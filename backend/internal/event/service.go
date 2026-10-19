package event

import (
	"context"
	"time"

	"WeGoJUAN-backend/internal/availability"
)

type Repository interface {
	Create(ctx context.Context, e Event) (Event, error)
	FindByID(ctx context.Context, id string) (Event, error)
	MemberIDs(ctx context.Context, eventID string) ([]string, error)
}

// AvailabilityReader คือสิ่งที่ event ต้องการจาก availability
// ประกาศไว้ฝั่งผู้ใช้ (event) → test Service ด้วย fake ได้โดยไม่ต้องมี DB
type AvailabilityReader interface {
	ListByUsers(ctx context.Context, userIDs []string, from, to time.Time) (map[string][]availability.Mark, error)
}

type Service struct {
	repo  Repository
	avail AvailabilityReader
}

func NewService(repo Repository, avail AvailabilityReader) *Service {
	return &Service{repo: repo, avail: avail}
}

func (s *Service) Create(ctx context.Context, e Event) (Event, error) {
	// TODO: validate — From <= To, DurationDays >= 1, ช่วงวันที่ยาวพอสำหรับ DurationDays
	return s.repo.Create(ctx, e)
}

func (s *Service) GetByID(ctx context.Context, id string) (Event, error) {
	return s.repo.FindByID(ctx, id)
}

func (s *Service) SuggestDates(ctx context.Context, eventID string) ([]Window, error) {
	e, err := s.repo.FindByID(ctx, eventID)
	if err != nil {
		return nil, err
	}
	memberIDs, err := s.repo.MemberIDs(ctx, eventID)
	if err != nil {
		return nil, err
	}
	marks, err := s.avail.ListByUsers(ctx, memberIDs, e.From, e.To)
	if err != nil {
		return nil, err
	}
	return SuggestWindows(memberIDs, marks, e.From, e.To, e.DurationDays), nil
}
