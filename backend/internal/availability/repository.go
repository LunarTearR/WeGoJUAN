package availability

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type PostgresRepository struct {
	db *pgxpool.Pool
}

var _ Repository = (*PostgresRepository)(nil)

func NewRepository(db *pgxpool.Pool) *PostgresRepository {
	return &PostgresRepository{db: db}
}

func (r *PostgresRepository) Save(ctx context.Context, userID string, set []Mark, clear []time.Time) error {
	return pgx.BeginFunc(ctx, r.db, func(tx pgx.Tx) error {
		for _, m := range set {
			// เขียน reason ทับเสมอ: เปลี่ยนเป็นว่าง = Reason หายไปด้วย (CHECK ไม่ยอมให้วันว่างมี Reason)
			if _, err := tx.Exec(ctx, `
				INSERT INTO availability (user_id, day, status, reason) VALUES ($1, $2, $3, NULLIF($4, ''))
				ON CONFLICT (user_id, day) DO UPDATE SET status = EXCLUDED.status, reason = EXCLUDED.reason`,
				userID, m.Day, string(m.Status), m.Reason); err != nil {
				return err
			}
		}
		if len(clear) == 0 {
			return nil
		}
		_, err := tx.Exec(ctx, `DELETE FROM availability WHERE user_id = $1 AND day = ANY($2)`, userID, clear)
		return err
	})
}

func (r *PostgresRepository) ListByUser(ctx context.Context, userID string, from, to time.Time) ([]Mark, error) {
	rows, err := r.db.Query(ctx, `
		SELECT day, status, COALESCE(reason, '') FROM availability
		WHERE user_id = $1 AND day BETWEEN $2 AND $3
		ORDER BY day`, userID, from, to)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	marks := []Mark{}
	for rows.Next() {
		var m Mark
		if err := rows.Scan(&m.Day, &m.Status, &m.Reason); err != nil {
			return nil, err
		}
		marks = append(marks, m)
	}
	return marks, rows.Err()
}

func (r *PostgresRepository) MarkBusy(ctx context.Context, userID string, days []time.Time, reason string) error {
	return pgx.BeginFunc(ctx, r.db, func(tx pgx.Tx) error {
		for _, d := range days {
			if _, err := tx.Exec(ctx, `
				INSERT INTO availability (user_id, day, status, reason) VALUES ($1, $2, 'busy', NULLIF($3, ''))
				ON CONFLICT (user_id, day) DO UPDATE
				SET status = 'busy', reason = COALESCE(availability.reason, EXCLUDED.reason)`,
				userID, d, reason); err != nil {
				return err
			}
		}
		return nil
	})
}
