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
	ErrGuestNotAllowed    = errors.New("only signed-up users can do this")
	ErrNotOrganizer       = errors.New("only the organizer can do this")
	ErrInvalidWindow      = errors.New("not a valid window for this trip")
	ErrNotConfirmed       = errors.New("trip has no confirmed dates")
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
	// ConfirmedStart = วันแรกของ Confirmed Dates (nil = กำลังหาวัน)
	ConfirmedStart *time.Time
}

// ConfirmedEnd คือวันสุดท้ายของ Confirmed Dates (nil ถ้ายังไม่ยืนยัน)
func (t Trip) ConfirmedEnd() *time.Time {
	if t.ConfirmedStart == nil {
		return nil
	}
	end := t.ConfirmedStart.AddDate(0, 0, t.DurationDays-1)
	return &end
}

// isValidWindow: อยู่ใน Date Range ครบทั้ง Window และไม่เริ่มก่อนวันนี้
func (t Trip) isValidWindow(start, today time.Time) bool {
	return !start.Before(t.StartDate) && !start.AddDate(0, 0, t.DurationDays-1).After(t.EndDate) && !start.Before(today)
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
	PushedAt    *time.Time // Push ครั้งล่าสุด (nil = ยังไม่เคย)
	// OfferAnsweredStart = Confirmed Dates (วันเริ่ม) ที่ตอบคำถาม "ทำเครื่องหมายไม่ว่างไหม" ไปแล้ว
	OfferAnsweredStart *time.Time
}

func (m Member) IsGuest() bool {
	return m.UserID == uuid.Nil
}

// inDateRange บอกว่าวัน d อยู่ใน Date Range ของทริปไหม
func (t Trip) inDateRange(d time.Time) bool {
	return !d.Before(t.StartDate) && !d.After(t.EndDate)
}

// Viewer คือคนที่กำลังเรียก API — ใช้หาว่าเป็นสมาชิกคนไหนของทริป
// มีทั้งคู่ได้ (เคยเข้าแบบ Guest แล้ว login ทีหลัง) — หาจาก UserID ก่อน ไม่เจอค่อยใช้ Guest ของเครื่องนี้
type Viewer struct {
	UserID         uuid.UUID
	GuestTokenHash string
}

// Detail คือทริปตามที่สมาชิกเห็น
type Detail struct {
	Trip    Trip
	Members []Member
	Me      Member
	Prompts Prompts
}

// Prompts คือสิ่งที่ควรถามสมาชิกคนนี้ตอนเปิดทริป (คำนวณจากสถานะ ไม่ได้เก็บเป็น flag)
type Prompts struct {
	Repush         bool // ช่วงวันเปลี่ยนหลัง Push ครั้งล่าสุด → ชวน Push อีกครั้ง
	ConfirmedOffer bool // มี Confirmed Dates ที่ยังไม่ได้ตอบ → ถามว่าจะทำเครื่องหมายไม่ว่างในปฏิทินไหม
}

// Window คือช่วงวันติดกันยาวเท่า Duration ใน Date Range — หนึ่งตัวเลือกว่าจะไปช่วงไหน
// สมาชิกทุกคนอยู่ในกลุ่มเดียวพอดี เรียงตามลำดับสมาชิก
type Window struct {
	Start     time.Time
	End       time.Time
	Available []uuid.UUID // ว่างครบทุกวันใน Window
	Busy      []uuid.UUID // ไม่ว่างอย่างน้อย 1 วัน
	Unknown   []uuid.UUID // ไม่ได้ไม่ว่างสักวัน แต่ยังไม่ระบุบางวัน
}
