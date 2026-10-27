package availability

import (
	"context"
	"fmt"
	"time"
)

type Repository interface {
	// Save ตั้ง Mark ใน set และลบวันใน clear ใน transaction เดียว
	Save(ctx context.Context, userID string, set []Mark, clear []time.Time) error
	// ListByUser เรียงตามวัน
	ListByUser(ctx context.Context, userID string, from, to time.Time) ([]Mark, error)
}

type Service struct {
	repo Repository
}

func NewService(repo Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) SetMarks(ctx context.Context, userID string, set []Mark, clear []time.Time) error {
	for _, m := range set {
		if !m.Status.Valid() {
			return fmt.Errorf("%w: %q", ErrInvalidStatus, m.Status)
		}
	}
	return s.repo.Save(ctx, userID, set, clear)
}

func (s *Service) ListByUser(ctx context.Context, userID string, from, to time.Time) ([]Mark, error) {
	return s.repo.ListByUser(ctx, userID, from, to)
}
