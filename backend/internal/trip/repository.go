package trip

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"

	"WeGoJUAN-backend/internal/availability"
)

type PostgresRepository struct {
	db *pgxpool.Pool
}

var _ Repository = (*PostgresRepository)(nil)

func NewRepository(db *pgxpool.Pool) *PostgresRepository {
	return &PostgresRepository{db: db}
}

const tripColumns = `id, organizer_id, title, start_date, end_date, duration_days, invite_code, created_at, confirmed_start, date_range_changed_at`

// tripColumnsT เหมือน tripColumns แต่ระบุ alias t. สำหรับ query ที่ join กับ trip_members
const tripColumnsT = `t.id, t.organizer_id, t.title, t.start_date, t.end_date, t.duration_days, t.invite_code, t.created_at, t.confirmed_start, t.date_range_changed_at`

func scanTrip(row pgx.Row) (Trip, error) {
	var t Trip
	err := row.Scan(&t.ID, &t.OrganizerID, &t.Title, &t.StartDate, &t.EndDate, &t.DurationDays, &t.InviteCode, &t.CreatedAt, &t.ConfirmedStart, &t.DateRangeChangedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return Trip{}, ErrNotFound
	}
	return t, err
}

func (r *PostgresRepository) Create(ctx context.Context, t Trip) (Trip, error) {
	var created Trip
	err := pgx.BeginFunc(ctx, r.db, func(tx pgx.Tx) error {
		var err error
		created, err = scanTrip(tx.QueryRow(ctx, `
			INSERT INTO trips (organizer_id, title, start_date, end_date, duration_days, invite_code)
			VALUES ($1, $2, $3, $4, $5, $6)
			RETURNING `+tripColumns,
			t.OrganizerID, t.Title, t.StartDate, t.EndDate, t.DurationDays, t.InviteCode))
		if err != nil {
			return err
		}
		// ผู้จัดเป็นสมาชิกคนแรกของทริปเสมอ
		_, err = tx.Exec(ctx, `
			INSERT INTO trip_members (trip_id, user_id, display_name)
			SELECT $1, id, display_name FROM users WHERE id = $2`,
			created.ID, t.OrganizerID)
		return err
	})
	return created, err
}

func (r *PostgresRepository) FindByID(ctx context.Context, id uuid.UUID) (Trip, error) {
	return scanTrip(r.db.QueryRow(ctx, `SELECT `+tripColumns+` FROM trips WHERE id = $1`, id))
}

func (r *PostgresRepository) ListByUser(ctx context.Context, userID uuid.UUID) ([]Trip, error) {
	rows, err := r.db.Query(ctx, `
		SELECT `+tripColumnsT+`
		FROM trips t
		JOIN trip_members m ON m.trip_id = t.id
		WHERE m.user_id = $1
		ORDER BY t.created_at DESC`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	trips := []Trip{}
	for rows.Next() {
		t, err := scanTrip(rows)
		if err != nil {
			return nil, err
		}
		trips = append(trips, t)
	}
	return trips, rows.Err()
}

const memberColumns = `id, trip_id, user_id, display_name, joined_at, pushed_at, offer_answered_start`

func scanMember(row pgx.Row) (Member, error) {
	var m Member
	var userID *uuid.UUID // NULL = Guest
	err := row.Scan(&m.ID, &m.TripID, &userID, &m.DisplayName, &m.JoinedAt, &m.PushedAt, &m.OfferAnsweredStart)
	if errors.Is(err, pgx.ErrNoRows) {
		return Member{}, ErrNotFound
	}
	if userID != nil {
		m.UserID = *userID
	}
	return m, err
}

func (r *PostgresRepository) FindMember(ctx context.Context, tripID uuid.UUID, v Viewer) (Member, error) {
	switch {
	case v.UserID != uuid.Nil:
		return scanMember(r.db.QueryRow(ctx,
			`SELECT `+memberColumns+` FROM trip_members WHERE trip_id = $1 AND user_id = $2`, tripID, v.UserID))
	case v.GuestTokenHash != "":
		return scanMember(r.db.QueryRow(ctx,
			`SELECT `+memberColumns+` FROM trip_members WHERE trip_id = $1 AND guest_token_hash = $2`, tripID, v.GuestTokenHash))
	default:
		return Member{}, ErrNotFound
	}
}

func (r *PostgresRepository) Members(ctx context.Context, tripID uuid.UUID) ([]Member, error) {
	rows, err := r.db.Query(ctx,
		`SELECT `+memberColumns+` FROM trip_members WHERE trip_id = $1 ORDER BY joined_at, id`, tripID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	members := []Member{}
	for rows.Next() {
		m, err := scanMember(rows)
		if err != nil {
			return nil, err
		}
		members = append(members, m)
	}
	return members, rows.Err()
}

func (r *PostgresRepository) FindByInviteCode(ctx context.Context, code string) (Trip, error) {
	return scanTrip(r.db.QueryRow(ctx, `SELECT `+tripColumns+` FROM trips WHERE invite_code = $1`, code))
}

func (r *PostgresRepository) AddUserMember(ctx context.Context, tripID, userID uuid.UUID, displayName string) (Member, error) {
	m, err := scanMember(r.db.QueryRow(ctx, `
		INSERT INTO trip_members (trip_id, user_id, display_name)
		SELECT $1, id, COALESCE(NULLIF($3::text, ''), display_name) FROM users WHERE id = $2
		RETURNING `+memberColumns, tripID, userID, displayName))

	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) && pgErr.Code == "23505" {
		switch pgErr.ConstraintName {
		case "trip_members_trip_display_name":
			return Member{}, ErrDisplayNameTaken
		case "trip_members_trip_id_user_id_key":
			// กดเข้าร่วมซ้อนกันสองครั้ง — อีก request เพิ่มไปแล้ว คืนสมาชิกคนนั้น
			return r.FindMember(ctx, tripID, Viewer{UserID: userID})
		}
	}
	return m, err
}

func (r *PostgresRepository) ListMarks(ctx context.Context, tripID uuid.UUID) (map[uuid.UUID][]availability.Mark, error) {
	// Mark นอก Date Range (เช่นหลังผู้จัดหดช่วงวัน) ไม่มีผลกับทริป จึงกรองทิ้ง
	rows, err := r.db.Query(ctx, `
		SELECT k.member_id, k.day, k.status
		FROM trip_marks k
		JOIN trip_members m ON m.id = k.member_id
		JOIN trips t ON t.id = m.trip_id
		WHERE m.trip_id = $1 AND k.day BETWEEN t.start_date AND t.end_date
		ORDER BY k.day`, tripID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	byMember := map[uuid.UUID][]availability.Mark{}
	for rows.Next() {
		var memberID uuid.UUID
		var m availability.Mark
		if err := rows.Scan(&memberID, &m.Day, &m.Status); err != nil {
			return nil, err
		}
		byMember[memberID] = append(byMember[memberID], m)
	}
	return byMember, rows.Err()
}

func (r *PostgresRepository) SaveMarks(ctx context.Context, memberID uuid.UUID, set []availability.Mark, clear []time.Time) error {
	return pgx.BeginFunc(ctx, r.db, func(tx pgx.Tx) error {
		for _, m := range set {
			if _, err := tx.Exec(ctx, `
				INSERT INTO trip_marks (member_id, day, status) VALUES ($1, $2, $3)
				ON CONFLICT (member_id, day) DO UPDATE SET status = EXCLUDED.status`,
				memberID, m.Day, string(m.Status)); err != nil {
				return err
			}
		}
		if len(clear) == 0 {
			return nil
		}
		_, err := tx.Exec(ctx, `DELETE FROM trip_marks WHERE member_id = $1 AND day = ANY($2)`, memberID, clear)
		return err
	})
}

func (r *PostgresRepository) AddGuestMember(ctx context.Context, tripID uuid.UUID, guestTokenHash, displayName string) (Member, error) {
	m, err := scanMember(r.db.QueryRow(ctx, `
		INSERT INTO trip_members (trip_id, guest_token_hash, display_name)
		VALUES ($1, $2, $3)
		RETURNING `+memberColumns, tripID, guestTokenHash, displayName))

	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) && pgErr.Code == "23505" {
		switch pgErr.ConstraintName {
		case "trip_members_trip_display_name":
			return Member{}, ErrDisplayNameTaken
		case "trip_members_trip_guest":
			// เครื่องเดียวกันกดเข้าร่วมซ้อนกัน — คืนสมาชิกที่เพิ่มไปแล้ว
			return r.FindMember(ctx, tripID, Viewer{GuestTokenHash: guestTokenHash})
		}
	}
	return m, err
}

func (r *PostgresRepository) SetPushedAt(ctx context.Context, memberID uuid.UUID, at time.Time) error {
	_, err := r.db.Exec(ctx, `UPDATE trip_members SET pushed_at = $2 WHERE id = $1`, memberID, at)
	return err
}

func (r *PostgresRepository) ListPushedOverlapping(ctx context.Context, userID uuid.UUID, days []time.Time) ([]Trip, error) {
	rows, err := r.db.Query(ctx, `
		SELECT `+tripColumnsT+`
		FROM trips t
		JOIN trip_members m ON m.trip_id = t.id
		WHERE m.user_id = $1 AND m.pushed_at IS NOT NULL
		  AND EXISTS (SELECT 1 FROM unnest($2::date[]) AS d WHERE d BETWEEN t.start_date AND t.end_date)
		ORDER BY t.start_date, t.id`, userID, days)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	trips := []Trip{}
	for rows.Next() {
		t, err := scanTrip(rows)
		if err != nil {
			return nil, err
		}
		trips = append(trips, t)
	}
	return trips, rows.Err()
}

func (r *PostgresRepository) SetConfirmed(ctx context.Context, tripID uuid.UUID, start *time.Time) error {
	_, err := r.db.Exec(ctx, `UPDATE trips SET confirmed_start = $2 WHERE id = $1`, tripID, start)
	return err
}

func (r *PostgresRepository) SetOfferAnswered(ctx context.Context, memberID uuid.UUID, start time.Time) error {
	_, err := r.db.Exec(ctx, `UPDATE trip_members SET offer_answered_start = $2 WHERE id = $1`, memberID, start)
	return err
}

func (r *PostgresRepository) UpdateDates(ctx context.Context, t Trip) (Trip, error) {
	// ตั้ง confirmed_start ใน UPDATE เดียวกับวันใหม่ ไม่งั้น CHECK trips_confirmed_fits ล้มกลางทาง
	return scanTrip(r.db.QueryRow(ctx, `
		UPDATE trips
		SET start_date = $2, end_date = $3, duration_days = $4, confirmed_start = $5, date_range_changed_at = $6
		WHERE id = $1
		RETURNING `+tripColumns,
		t.ID, t.StartDate, t.EndDate, t.DurationDays, t.ConfirmedStart, t.DateRangeChangedAt))
}
