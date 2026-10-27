// Package availability ดูแลปฏิทินส่วนตัว: แต่ละคน mark วันว่าง/ไม่ว่างของตัวเอง
package availability

import (
	"errors"
	"time"
)

var ErrInvalidStatus = errors.New("invalid status")

type Status string

// มีแค่ว่าง/ไม่ว่าง — ไม่แน่ใจให้ปล่อยวันนั้นว่างไว้ (= Unknown)
const (
	StatusFree Status = "free"
	StatusBusy Status = "busy"
)

func (s Status) Valid() bool {
	switch s {
	case StatusFree, StatusBusy:
		return true
	}
	return false
}

type Mark struct {
	Day    time.Time
	Status Status
}
