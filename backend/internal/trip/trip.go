// Package trip ดูแลทริป: สร้างทริป, สมาชิก, ลิงก์เชิญ, Mark ของแต่ละคนในทริป และหาช่วงวันที่ลงตัว
package trip

import (
	"errors"
	"time"

	"github.com/google/uuid"
)

var (
	ErrNotFound           = errors.New("trip not found")
	ErrInvalidTrip        = errors.New("invalid trip") // ห่อด้วยเหตุผล: fmt.Errorf("%w: ...", ErrInvalidTrip)
	ErrDisplayNameTaken   = errors.New("display name already taken in this trip")
	ErrInvalidDisplayName = errors.New("display name must be 1-50 characters")
	ErrDayOutOfRange      = errors.New("day is outside the trip's date range")
)

type Trip struct {
	ID           uuid.UUID
	OrganizerID  uuid.UUID
	Title        string
	StartDate    time.Time // Date Range: ช่วงวันที่ผู้จัดเปิดให้เลือก (เที่ยงคืน UTC)
	EndDate      time.Time
	DurationDays int // ทริปยาวกี่วันติดกัน
	InviteCode   string
	CreatedAt    time.Time
}

type NewTrip struct {
	Title        string
	StartDate    time.Time
	EndDate      time.Time
	DurationDays int
}

type Member struct {
	ID          uuid.UUID
	TripID      uuid.UUID
	UserID      uuid.UUID // uuid.Nil = Guest
	DisplayName string
	JoinedAt    time.Time
}

func (m Member) IsGuest() bool {
	return m.UserID == uuid.Nil
}

// inDateRange บอกว่าวัน d อยู่ใน Date Range ของทริปไหม
func (t Trip) inDateRange(d time.Time) bool {
	return !d.Before(t.StartDate) && !d.After(t.EndDate)
}

// Viewer คือคนที่กำลังเรียก API — ใช้หาว่าเป็นสมาชิกคนไหนของทริป
type Viewer struct {
	UserID uuid.UUID
}

// Detail คือทริปตามที่สมาชิกเห็น
type Detail struct {
	Trip    Trip
	Members []Member
	Me      Member
}
