package trip

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"

	"WeGoJUAN-backend/internal/availability"
)

// PushDay คือวันที่ Mark ในทริปไม่ตรงกับปฏิทินส่วนตัว (nil = Unknown)
type PushDay struct {
	Day      time.Time
	Trip     *availability.Status
	Calendar *availability.Status
}

// PushPreview แสดงทุกวันใน Date Range ที่ทริปกับปฏิทินส่วนตัวไม่ตรงกัน ให้ User เลือกว่าจะทับวันไหน
func (s *Service) PushPreview(ctx context.Context, tripID uuid.UUID, v Viewer) ([]PushDay, error) {
	t, me, err := s.pusher(ctx, tripID, v)
	if err != nil {
		return nil, err
	}
	tripBy, calBy, err := s.pushSides(ctx, t, me)
	if err != nil {
		return nil, err
	}

	var days []PushDay
	for d := t.StartDate; !d.After(t.EndDate); d = d.AddDate(0, 0, 1) {
		k := d.Format(time.DateOnly)
		ts, inTrip := tripBy[k]
		cs, inCal := calBy[k]
		if inTrip == inCal && ts == cs {
			continue
		}
		pd := PushDay{Day: d}
		if inTrip {
			pd.Trip = &ts
		}
		if inCal {
			pd.Calendar = &cs
		}
		days = append(days, pd)
	}
	return days, nil
}

// Push คัดลอกสถานะในปฏิทินส่วนตัว ณ ตอนนี้ ไปทับเฉพาะวันที่เลือก — ปฏิทินไม่ระบุ = ลบ Mark ในทริป
// วันที่ไม่ได้เลือกคงค่าเดิม (กลายเป็น Trip-only Mark)
func (s *Service) Push(ctx context.Context, tripID uuid.UUID, v Viewer, days []time.Time) error {
	t, me, err := s.pusher(ctx, tripID, v)
	if err != nil {
		return err
	}
	for _, d := range days {
		if !t.inDateRange(d) {
			return fmt.Errorf("%w: %s", ErrDayOutOfRange, d.Format(time.DateOnly))
		}
	}
	_, calBy, err := s.pushSides(ctx, t, me)
	if err != nil {
		return err
	}

	var set []availability.Mark
	var clear []time.Time
	seen := map[string]bool{}
	for _, d := range days {
		k := d.Format(time.DateOnly)
		if seen[k] {
			continue
		}
		seen[k] = true
		if st, ok := calBy[k]; ok {
			set = append(set, availability.Mark{Day: d, Status: st})
		} else {
			clear = append(clear, d)
		}
	}
	if err := s.repo.SaveMarks(ctx, me.ID, set, clear); err != nil {
		return err
	}
	return s.repo.SetPushedAt(ctx, me.ID, s.now())
}

// pusher: ต้องเป็นสมาชิก และต้องเป็น User (Guest ไม่มีปฏิทินส่วนตัว)
func (s *Service) pusher(ctx context.Context, tripID uuid.UUID, v Viewer) (Trip, Member, error) {
	me, err := s.findMember(ctx, tripID, v)
	if err != nil {
		return Trip{}, Member{}, err
	}
	if me.IsGuest() {
		return Trip{}, Member{}, ErrGuestNotAllowed
	}
	t, err := s.repo.FindByID(ctx, tripID)
	return t, me, err
}

// pushSides คืน Mark ของฉันในทริป กับ Mark ในปฏิทินส่วนตัวช่วง Date Range — key เป็น "YYYY-MM-DD"
func (s *Service) pushSides(ctx context.Context, t Trip, me Member) (map[string]availability.Status, map[string]availability.Status, error) {
	all, err := s.repo.ListMarks(ctx, t.ID)
	if err != nil {
		return nil, nil, err
	}
	cal, err := s.cal.ListByUser(ctx, me.UserID.String(), t.StartDate, t.EndDate)
	if err != nil {
		return nil, nil, err
	}
	return statusByDay(all[me.ID]), statusByDay(cal), nil
}

func statusByDay(marks []availability.Mark) map[string]availability.Status {
	by := make(map[string]availability.Status, len(marks))
	for _, m := range marks {
		by[m.Day.Format(time.DateOnly)] = m.Status
	}
	return by
}
