package trip

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"strings"
	"time"
	"unicode/utf8"

	"github.com/google/uuid"
)

const (
	maxTitleRunes = 100
	maxRangeDays  = 365
)

type Repository interface {
	// Create insert ทริปและแถวสมาชิกของผู้จัดใน transaction เดียว (ชื่อเอาจาก users.display_name)
	Create(ctx context.Context, t Trip) (Trip, error)
	FindByID(ctx context.Context, id uuid.UUID) (Trip, error)
	// ListByUser คืนทริปที่ user เป็นสมาชิก ใหม่สุดก่อน
	ListByUser(ctx context.Context, userID uuid.UUID) ([]Trip, error)
	// FindMember คืนสมาชิกของ viewer ในทริปนี้ หรือ ErrNotFound ถ้าไม่ได้เป็นสมาชิก
	FindMember(ctx context.Context, tripID uuid.UUID, v Viewer) (Member, error)
	// Members เรียงตามเวลาเข้าร่วม
	Members(ctx context.Context, tripID uuid.UUID) ([]Member, error)
}

type Service struct {
	repo Repository
	now  func() time.Time // test เปลี่ยนเพื่อกำหนด "วันนี้"
}

func NewService(repo Repository) *Service {
	return &Service{repo: repo, now: time.Now}
}

func (s *Service) Create(ctx context.Context, organizerID uuid.UUID, in NewTrip) (Trip, error) {
	in.Title = strings.TrimSpace(in.Title)
	if err := validateNewTrip(in, Today(s.now())); err != nil {
		return Trip{}, err
	}

	code, err := newInviteCode()
	if err != nil {
		return Trip{}, err
	}
	return s.repo.Create(ctx, Trip{
		OrganizerID:  organizerID,
		Title:        in.Title,
		StartDate:    in.StartDate,
		EndDate:      in.EndDate,
		DurationDays: in.DurationDays,
		InviteCode:   code,
	})
}

func (s *Service) ListMine(ctx context.Context, userID uuid.UUID) ([]Trip, error) {
	return s.repo.ListByUser(ctx, userID)
}

// Get คืนทริปเฉพาะสมาชิก — คนนอกได้ ErrNotFound เหมือนไม่มีทริปนี้
func (s *Service) Get(ctx context.Context, tripID uuid.UUID, v Viewer) (Detail, error) {
	me, err := s.repo.FindMember(ctx, tripID, v)
	if err != nil {
		return Detail{}, err
	}
	t, err := s.repo.FindByID(ctx, tripID)
	if err != nil {
		return Detail{}, err
	}
	members, err := s.repo.Members(ctx, tripID)
	if err != nil {
		return Detail{}, err
	}
	return Detail{Trip: t, Members: members, Me: me}, nil
}

func validateNewTrip(in NewTrip, today time.Time) error {
	n := utf8.RuneCountInString(in.Title)
	switch {
	case n == 0 || n > maxTitleRunes:
		return fmt.Errorf("%w: title must be 1-%d characters", ErrInvalidTrip, maxTitleRunes)
	case in.StartDate.Before(today):
		return fmt.Errorf("%w: start date cannot be in the past", ErrInvalidTrip)
	case in.EndDate.Before(in.StartDate):
		return fmt.Errorf("%w: end date must not be before start date", ErrInvalidTrip)
	case rangeDays(in.StartDate, in.EndDate) > maxRangeDays:
		return fmt.Errorf("%w: date range must be at most %d days", ErrInvalidTrip, maxRangeDays)
	case in.DurationDays < 1 || in.DurationDays > rangeDays(in.StartDate, in.EndDate):
		return fmt.Errorf("%w: duration must be between 1 and the number of days in the date range", ErrInvalidTrip)
	}
	return nil
}

// newInviteCode สุ่ม 16 byte → base64url 22 ตัว เดาไม่ได้ (ลิงก์เชิญคือกุญแจเข้าทริป)
func newInviteCode() (string, error) {
	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(b), nil
}
