package availability

import (
	"context"
	"fmt"
	"strings"
	"time"
)

type Repository interface {
	// Save ตั้ง Mark ใน set และลบวันใน clear ใน transaction เดียว
	Save(ctx context.Context, userID string, set []Mark, clear []time.Time) error
	// ListByUser เรียงตามวัน
	ListByUser(ctx context.Context, userID string, from, to time.Time) ([]Mark, error)
	// MarkBusy ตั้งวันเป็นไม่ว่าง โดยคง Reason เดิมไว้ ถ้าไม่มีค่อยใช้ reason ที่ส่งมา
	MarkBusy(ctx context.Context, userID string, days []time.Time, reason string) error
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

// MarkBusy ใช้ตอน User ตอบรับให้ทำเครื่องหมายไม่ว่างตาม Confirmed Dates ของทริป
// reason (ชื่อทริป) ใส่เฉพาะวันที่ยังไม่มี Reason — Reason ที่ User เขียนเองไม่ถูกทับ
func (s *Service) MarkBusy(ctx context.Context, userID string, days []time.Time, reason string) error {
	reason = strings.TrimSpace(reason)
	if r := []rune(reason); len(r) > MaxReasonRunes {
		reason = string(r[:MaxReasonRunes]) // ชื่อทริปยาวได้ถึง 100 ตัว
	}
	return s.repo.MarkBusy(ctx, userID, days, reason)
}
