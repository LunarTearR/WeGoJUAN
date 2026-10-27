package trip

import (
	"cmp"
	"slices"
	"time"

	"github.com/google/uuid"

	"WeGoJUAN-backend/internal/availability"
)

// SuggestWindows หาทุกช่วงวันติดกันยาว duration วันใน [from, to] แล้วจัดอันดับ:
// Busy น้อยสุดก่อน (Busy = ไปไม่ได้แน่, Unknown ยังตามให้ระบุได้) → Available มากสุด → เริ่มเร็วสุด
//
// เป็น pure function: ไม่แตะ DB/HTTP → เขียน table-driven test ได้เต็มที่
func SuggestWindows(memberIDs []uuid.UUID, marks map[uuid.UUID][]availability.Mark, from, to time.Time, duration int) []Window {
	if duration < 1 || duration > rangeDays(from, to) {
		return nil
	}

	// member → "YYYY-MM-DD" → status (key เป็น string กันปัญหาเทียบ time.Time ต่าง location)
	byDay := make(map[uuid.UUID]map[string]availability.Status, len(marks))
	for id, ms := range marks {
		days := make(map[string]availability.Status, len(ms))
		for _, m := range ms {
			days[m.Day.Format(time.DateOnly)] = m.Status
		}
		byDay[id] = days
	}

	var windows []Window
	for start := from; !start.AddDate(0, 0, duration-1).After(to); start = start.AddDate(0, 0, 1) {
		w := Window{Start: start, End: start.AddDate(0, 0, duration-1)}
		for _, id := range memberIDs {
			switch classify(byDay[id], start, duration) {
			case availability.StatusBusy:
				w.Busy = append(w.Busy, id)
			case availability.StatusFree:
				w.Available = append(w.Available, id)
			default:
				w.Unknown = append(w.Unknown, id)
			}
		}
		windows = append(windows, w)
	}

	slices.SortStableFunc(windows, func(a, b Window) int {
		return cmp.Or(
			cmp.Compare(len(a.Busy), len(b.Busy)),
			cmp.Compare(len(b.Available), len(a.Available)),
			a.Start.Compare(b.Start),
		)
	})
	return windows
}

// classify: Busy ถ้าไม่ว่างสักวัน, Free ถ้าว่างครบทุกวัน, "" (Unknown) ถ้าเหลือวันที่ยังไม่ระบุ
func classify(days map[string]availability.Status, start time.Time, duration int) availability.Status {
	allFree := true
	for i := range duration {
		switch days[start.AddDate(0, 0, i).Format(time.DateOnly)] {
		case availability.StatusBusy:
			return availability.StatusBusy
		case availability.StatusFree:
		default:
			allFree = false
		}
	}
	if allFree {
		return availability.StatusFree
	}
	return ""
}
