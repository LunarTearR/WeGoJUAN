package availability

import (
	"context"
	"fmt"
	"time"
)

type Repository interface {
	Upsert(ctx context.Context, userID string, marks []Mark) error
	ListByUser(ctx context.Context, userID string, from, to time.Time) ([]Mark, error)
}

type Service struct {
	repo Repository
}

func NewService(repo Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) SetMarks(ctx context.Context, userID string, marks []Mark) error {
	for _, m := range marks {
		if !m.Status.Valid() {
			return fmt.Errorf("%w: %q", ErrInvalidStatus, m.Status)
		}
	}
	return s.repo.Upsert(ctx, userID, marks)
}

func (s *Service) ListByUser(ctx context.Context, userID string, from, to time.Time) ([]Mark, error) {
	return s.repo.ListByUser(ctx, userID, from, to)
}
