package availability

import (
	"errors"
	"fmt"
	"time"
)

// MaxChanges จำกัดจำนวนวันต่อ request (1 ปีพอดี)
const MaxChanges = 366

var ErrInvalidDay = errors.New("invalid day")

// ChangeRequest คือ body หนึ่งรายการของ PUT: status เป็น null = ลบ Mark (วันนั้นกลับเป็น Unknown)
// ใช้ร่วมกับ PUT Mark ในทริปด้วย
type ChangeRequest struct {
	Day    string  `json:"day"`
	Status *Status `json:"status"`
}

// ParseDay แปลง "YYYY-MM-DD" เป็นเที่ยงคืน UTC
func ParseDay(s string) (time.Time, error) {
	d, err := time.Parse(time.DateOnly, s)
	if err != nil {
		return time.Time{}, fmt.Errorf("%w: %q must be YYYY-MM-DD", ErrInvalidDay, s)
	}
	return d, nil
}

// ParseChanges แยก request เป็น Mark ที่จะตั้ง กับวันที่จะลบ
// วันซ้ำใน request เดียวถือว่าผิด (ไม่งั้น upsert ชนกันเองใน transaction)
func ParseChanges(reqs []ChangeRequest) (set []Mark, clear []time.Time, err error) {
	if len(reqs) > MaxChanges {
		return nil, nil, fmt.Errorf("%w: at most %d days per request", ErrInvalidDay, MaxChanges)
	}
	seen := make(map[time.Time]bool, len(reqs))
	for _, r := range reqs {
		d, err := ParseDay(r.Day)
		if err != nil {
			return nil, nil, err
		}
		if seen[d] {
			return nil, nil, fmt.Errorf("%w: %s appears more than once", ErrInvalidDay, r.Day)
		}
		seen[d] = true

		if r.Status == nil {
			clear = append(clear, d)
			continue
		}
		if !r.Status.Valid() {
			return nil, nil, fmt.Errorf("%w: %q", ErrInvalidStatus, *r.Status)
		}
		set = append(set, Mark{Day: d, Status: *r.Status})
	}
	return set, clear, nil
}
