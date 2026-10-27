package trip

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

type PostgresRepository struct {
	db *pgxpool.Pool
}

var _ Repository = (*PostgresRepository)(nil)

func NewRepository(db *pgxpool.Pool) *PostgresRepository {
	return &PostgresRepository{db: db}
}

const tripColumns = `id, organizer_id, title, start_date, end_date, duration_days, invite_code, created_at`

func scanTrip(row pgx.Row) (Trip, error) {
	var t Trip
	err := row.Scan(&t.ID, &t.OrganizerID, &t.Title, &t.StartDate, &t.EndDate, &t.DurationDays, &t.InviteCode, &t.CreatedAt)
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
		SELECT t.id, t.organizer_id, t.title, t.start_date, t.end_date, t.duration_days, t.invite_code, t.created_at
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

const memberColumns = `id, trip_id, user_id, display_name, joined_at`

func scanMember(row pgx.Row) (Member, error) {
	var m Member
	err := row.Scan(&m.ID, &m.TripID, &m.UserID, &m.DisplayName, &m.JoinedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return Member{}, ErrNotFound
	}
	return m, err
}

func (r *PostgresRepository) FindMember(ctx context.Context, tripID uuid.UUID, v Viewer) (Member, error) {
	if v.UserID == uuid.Nil {
		return Member{}, ErrNotFound
	}
	return scanMember(r.db.QueryRow(ctx,
		`SELECT `+memberColumns+` FROM trip_members WHERE trip_id = $1 AND user_id = $2`, tripID, v.UserID))
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
