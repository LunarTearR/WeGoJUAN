package trip

import (
	"slices"
	"testing"
	"time"

	"github.com/google/uuid"

	"WeGoJUAN-backend/internal/availability"
)

func memberIDs(n int) []uuid.UUID {
	ids := make([]uuid.UUID, n)
	for i := range ids {
		ids[i] = uuid.New()
	}
	return ids
}

// dec สร้างวันที่ใน ธ.ค. 2026
func dec(day int) time.Time {
	return time.Date(2026, 12, day, 0, 0, 0, 0, time.UTC)
}

// marksOn ตั้ง status เดียวกันให้วันที่ from..to ใน ธ.ค.
func marksOn(s availability.Status, from, to int) []availability.Mark {
	var ms []availability.Mark
	for d := from; d <= to; d++ {
		ms = append(ms, availability.Mark{Day: dec(d), Status: s})
	}
	return ms
}

func indexOfStart(ws []Window, start time.Time) int {
	return slices.IndexFunc(ws, func(w Window) bool { return w.Start.Equal(start) })
}

func TestSuggestWindows_UnknownBeatsBusy(t *testing.T) {
	ids := memberIDs(6) // A B C D E F
	marks := map[uuid.UUID][]availability.Mark{}
	for _, id := range ids[:4] { // A-D ว่างทั้งสองช่วง
		marks[id] = append(marksOn(availability.StatusFree, 5, 7), marksOn(availability.StatusFree, 12, 14)...)
	}
	marks[ids[4]] = marksOn(availability.StatusFree, 12, 14) // E: ไม่ระบุช่วงแรก
	marks[ids[5]] = append(marksOn(availability.StatusBusy, 12, 12), marksOn(availability.StatusFree, 13, 14)...)

	ws := SuggestWindows(ids, marks, dec(5), dec(14), 3)

	a, b := ws[indexOfStart(ws, dec(5))], ws[indexOfStart(ws, dec(12))]
	if len(a.Available) != 4 || len(a.Busy) != 0 || len(a.Unknown) != 2 {
		t.Fatalf("window Dec 5-7 = %d/%d/%d, want 4/0/2", len(a.Available), len(a.Busy), len(a.Unknown))
	}
	if len(b.Available) != 5 || len(b.Busy) != 1 || len(b.Unknown) != 0 {
		t.Fatalf("window Dec 12-14 = %d/%d/%d, want 5/1/0", len(b.Available), len(b.Busy), len(b.Unknown))
	}
	if indexOfStart(ws, dec(5)) > indexOfStart(ws, dec(12)) {
		t.Error("0 Busy + 2 Unknown must rank above 1 Busy + 0 Unknown")
	}
}

func TestSuggestWindows_TieOnBusy_MoreAvailableFirst(t *testing.T) {
	ids := memberIDs(2)
	marks := map[uuid.UUID][]availability.Mark{
		ids[0]: marksOn(availability.StatusFree, 1, 2),
		ids[1]: marksOn(availability.StatusFree, 2, 2),
	}

	ws := SuggestWindows(ids, marks, dec(1), dec(2), 1)

	if len(ws) != 2 || !ws[0].Start.Equal(dec(2)) || !ws[1].Start.Equal(dec(1)) {
		t.Errorf("order = %v, want Dec 2 (2 Available) then Dec 1 (1 Available)", starts(ws))
	}
}

func TestSuggestWindows_FullTie_EarliestFirst(t *testing.T) {
	ws := SuggestWindows(memberIDs(1), nil, dec(1), dec(3), 1)

	if got := starts(ws); !slices.Equal(got, []int{1, 2, 3}) {
		t.Errorf("order = %v, want [1 2 3]", got)
	}
}

func TestSuggestWindows_BusyOnOneDayWins(t *testing.T) {
	ids := memberIDs(1)
	marks := map[uuid.UUID][]availability.Mark{ids[0]: {
		{Day: dec(1), Status: availability.StatusFree},
		{Day: dec(3), Status: availability.StatusBusy}, // วันที่ 2 ไม่ระบุ
	}}

	ws := SuggestWindows(ids, marks, dec(1), dec(3), 3)

	if len(ws) != 1 || !slices.Equal(ws[0].Busy, ids) || len(ws[0].Unknown) != 0 || len(ws[0].Available) != 0 {
		t.Errorf("windows = %+v, want one Window with the Member Busy", ws)
	}
}

func TestSuggestWindows_NoMarksIsUnknown(t *testing.T) {
	ids := memberIDs(1)

	ws := SuggestWindows(ids, map[uuid.UUID][]availability.Mark{}, dec(1), dec(5), 2)

	for _, w := range ws {
		if !slices.Equal(w.Unknown, ids) || len(w.Available) != 0 {
			t.Errorf("window %v: available=%v unknown=%v, want Unknown only", w.Start, w.Available, w.Unknown)
		}
	}
}

func TestSuggestWindows_DurationLongerThanRange(t *testing.T) {
	if ws := SuggestWindows(memberIDs(1), nil, dec(1), dec(2), 3); len(ws) != 0 {
		t.Errorf("got %d windows, want none", len(ws))
	}
}

func TestSuggestWindows_CoversRangeExactly(t *testing.T) {
	ws := SuggestWindows(memberIDs(1), nil, dec(1), dec(5), 3)

	got := starts(ws)
	slices.Sort(got)
	if !slices.Equal(got, []int{1, 2, 3}) {
		t.Errorf("starts = %v, want [1 2 3]", got)
	}
	for _, w := range ws {
		if !w.End.Equal(w.Start.AddDate(0, 0, 2)) {
			t.Errorf("window %v ends %v, want 3 days long", w.Start, w.End)
		}
	}
}

func TestSuggestWindows_EveryMemberInExactlyOneBucket(t *testing.T) {
	ids := memberIDs(6)
	marks := map[uuid.UUID][]availability.Mark{
		ids[0]: marksOn(availability.StatusFree, 1, 10),
		ids[1]: marksOn(availability.StatusBusy, 3, 4),
		ids[2]: append(marksOn(availability.StatusFree, 1, 5), marksOn(availability.StatusBusy, 8, 8)...),
		ids[3]: marksOn(availability.StatusFree, 6, 10),
		// ids[4], ids[5]: ไม่ระบุอะไรเลย
	}

	for _, w := range SuggestWindows(ids, marks, dec(1), dec(10), 3) {
		all := slices.Concat(w.Available, w.Busy, w.Unknown)
		if len(all) != len(ids) {
			t.Fatalf("window %v has %d members in buckets, want %d", w.Start, len(all), len(ids))
		}
		for _, id := range ids {
			if slices.Index(all, id) == -1 {
				t.Errorf("window %v is missing member %v", w.Start, id)
			}
		}
		for _, bucket := range [][]uuid.UUID{w.Available, w.Busy, w.Unknown} {
			if !slices.IsSortedFunc(bucket, func(a, b uuid.UUID) int { return slices.Index(ids, a) - slices.Index(ids, b) }) {
				t.Errorf("window %v bucket %v not in member order", w.Start, bucket)
			}
		}
	}
}

func starts(ws []Window) []int {
	out := make([]int, len(ws))
	for i, w := range ws {
		out[i] = w.Start.Day()
	}
	return out
}
