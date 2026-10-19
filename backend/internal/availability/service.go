package availability

import (
	"context"
	"fmt"
	"time"
)

type Repository interface {
	Upsert(ctx context.Context, userID string, marks []Mark) error
	ListByUser(ctx context.Context, userID string, from, to time.Time) ([]Mark, error)
	ListByUsers(ctx context.Context, userIDs []string, from, to time.Time) (map[string][]Mark, error)
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

// ListByUsers ถูกเรียกจาก package event ผ่าน interface event.AvailabilityReader
// คืนค่าเป็น userID → วันที่คนนั้น mark ไว้ในช่วง [from, to]
func (s *Service) ListByUsers(ctx context.Context, userIDs []string, from, to time.Time) (map[string][]Mark, error) {
	return s.repo.ListByUsers(ctx, userIDs, from, to)
}
