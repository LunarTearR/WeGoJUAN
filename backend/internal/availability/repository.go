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
			if _, err := tx.Exec(ctx, `
				INSERT INTO availability (user_id, day, status) VALUES ($1, $2, $3)
				ON CONFLICT (user_id, day) DO UPDATE SET status = EXCLUDED.status`,
				userID, m.Day, string(m.Status)); err != nil {
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
		SELECT day, status FROM availability
		WHERE user_id = $1 AND day BETWEEN $2 AND $3
		ORDER BY day`, userID, from, to)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	marks := []Mark{}
	for rows.Next() {
		var m Mark
		if err := rows.Scan(&m.Day, &m.Status); err != nil {
			return nil, err
		}
		marks = append(marks, m)
	}
	return marks, rows.Err()
}
