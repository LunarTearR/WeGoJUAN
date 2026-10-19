// Package availability ดูแลปฏิทินส่วนตัว: แต่ละคน mark วันว่าง/ไม่ว่างของตัวเอง
package availability

import (
	"errors"
	"time"
)

var ErrInvalidStatus = errors.New("invalid status")

type Status string

const (
	StatusFree  Status = "free"
	StatusBusy  Status = "busy"
	StatusMaybe Status = "maybe"
)

func (s Status) Valid() bool {
	switch s {
	case StatusFree, StatusBusy, StatusMaybe:
		return true
	}
	return false
}

type Mark struct {
	Day    time.Time
	Status Status
}
