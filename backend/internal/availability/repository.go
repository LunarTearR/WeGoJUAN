package availability

import (
	"context"
	"errors"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

var errNotImplemented = errors.New("not implemented")

type PostgresRepository struct {
	db *pgxpool.Pool
}

var _ Repository = (*PostgresRepository)(nil)

func NewRepository(db *pgxpool.Pool) *PostgresRepository {
	return &PostgresRepository{db: db}
}

func (r *PostgresRepository) Upsert(ctx context.Context, userID string, marks []Mark) error {
	// TODO: INSERT INTO availability (user_id, day, status) VALUES ...
	//       ON CONFLICT (user_id, day) DO UPDATE SET status = EXCLUDED.status
	return errNotImplemented
}

func (r *PostgresRepository) ListByUser(ctx context.Context, userID string, from, to time.Time) ([]Mark, error) {
	// TODO: SELECT day, status FROM availability
	//       WHERE user_id = $1 AND day BETWEEN $2 AND $3 ORDER BY day
	return nil, errNotImplemented
}
