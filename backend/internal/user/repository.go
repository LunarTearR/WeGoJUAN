package user

import (
	"context"
	"errors"
	"time"

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

func (r *PostgresRepository) FindByID(ctx context.Context, id uuid.UUID) (User, error) {
	sql := `
		SELECT id, display_name, email, password, created_at, updated_at
		FROM users
		WHERE id = $1
	`
	var user User
	err := r.db.QueryRow(ctx, sql, id).Scan(&user.ID, &user.DisplayName, &user.Email, &user.Password, &user.CreatedAt, &user.UpdatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return User{}, ErrNotFound
	}
	if err != nil {
		return User{}, err
	}
	return user, nil
}

func (r *PostgresRepository) FindByEmail(ctx context.Context, email string) (User, error) {
	sql := `
		SELECT id, display_name, email, password, created_at, updated_at
		FROM users
		WHERE email = $1
	`
	var user User
	err := r.db.QueryRow(ctx, sql, email).Scan(&user.ID, &user.DisplayName, &user.Email, &user.Password, &user.CreatedAt, &user.UpdatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return User{}, ErrNotFound
	}
	if err != nil {
		return User{}, err
	}
	return user, nil
}

func (r *PostgresRepository) CreateUser(ctx context.Context, user User) error {
	var pgErr *pgconn.PgError
	sql := `
		INSERT INTO users (id, display_name, email, password, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6)
	`
	_, err := r.db.Exec(ctx, sql, user.ID, user.DisplayName, user.Email, user.Password, user.CreatedAt, user.UpdatedAt)
	if errors.As(err, &pgErr) && pgErr.Code == "23505" {
		return ErrEmailAlreadyExists
	}
	if err != nil {
		return err
	}

	return nil
}

func (r *PostgresRepository) UpdateDisplayName(ctx context.Context, id uuid.UUID, displayName string, updatedAt time.Time) (User, error) {
	sql := `
		UPDATE users
		SET display_name = $2, updated_at = $3
		WHERE id = $1
		RETURNING id, display_name, email, password, created_at, updated_at
	`
	var user User
	err := r.db.QueryRow(ctx, sql, id, displayName, updatedAt).Scan(&user.ID, &user.DisplayName, &user.Email, &user.Password, &user.CreatedAt, &user.UpdatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return User{}, ErrNotFound
	}
	if err != nil {
		return User{}, err
	}
	return user, nil
}

func (r *PostgresRepository) UpdatePassword(ctx context.Context, id uuid.UUID, passwordHash string, updatedAt time.Time) error {
	sql := `
		UPDATE users
		SET password = $2, updated_at = $3
		WHERE id = $1
	`
	tag, err := r.db.Exec(ctx, sql, id, passwordHash, updatedAt)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}
