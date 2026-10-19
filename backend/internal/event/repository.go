package event

import (
	"context"
	"errors"

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

func (r *PostgresRepository) Create(ctx context.Context, e Event) (Event, error) {
	// TODO: INSERT INTO events ... RETURNING id
	//       และเพิ่มผู้สร้างเข้า event_members ใน transaction เดียวกัน
	return Event{}, errNotImplemented
}

func (r *PostgresRepository) FindByID(ctx context.Context, id string) (Event, error) {
	// TODO: SELECT ... FROM events WHERE id = $1 (pgx.ErrNoRows → ErrNotFound)
	return Event{}, errNotImplemented
}

func (r *PostgresRepository) MemberIDs(ctx context.Context, eventID string) ([]string, error) {
	// TODO: SELECT user_id FROM event_members WHERE event_id = $1
	return nil, errNotImplemented
}
