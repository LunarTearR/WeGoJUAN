// Package event ดูแลนัดหมาย: สร้างนัด, สมาชิก, ลิงก์เชิญ และหาช่วงวันที่ลงตัว
package event

import (
	"errors"
	"time"
)

var ErrNotFound = errors.New("event not found")

type Event struct {
	ID           string
	OwnerID      string
	Title        string
	From         time.Time // ช่วงวันที่ที่ผู้จัดเปิดให้เลือก
	To           time.Time
	DurationDays int // ทริป 3 วัน = 3, นัดกินข้าว = 1
}

// Window คือช่วงวันที่ที่ระบบแนะนำ พร้อมรายชื่อสมาชิกแยกตามสถานะ
type Window struct {
	Start     time.Time
	End       time.Time
	Available []string // userID ที่ว่างครบทุกวันในช่วงนี้
	Busy      []string // userID ที่ติดอย่างน้อย 1 วัน
	Unknown   []string // userID ที่ยังไม่ระบุบางวัน (และไม่ได้ติด)
}
