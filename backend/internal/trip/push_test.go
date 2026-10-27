package trip

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/google/uuid"

	"WeGoJUAN-backend/internal/availability"
)

func free(t *testing.T, day string) availability.Mark {
	return availability.Mark{Day: mustDay(t, day), Status: availability.StatusFree}
}

func busy(t *testing.T, day string) availability.Mark {
	return availability.Mark{Day: mustDay(t, day), Status: availability.StatusBusy}
}

func TestPushPreview_OnlyDifferingDays(t *testing.T) {
	repo, me := decemberTrip(t)
	repo.marks = map[uuid.UUID][]availability.Mark{me.ID: {free(t, "2026-12-05")}}
	repo.cal = &fakeCalendar{marks: []availability.Mark{free(t, "2026-12-05"), busy(t, "2026-12-06"), busy(t, "2026-12-25")}}

	days, err := newTestService(repo, defaultNow).PushPreview(context.Background(), repo.trip.ID, Viewer{UserID: natID})

	if err != nil {
		t.Fatal(err)
	}
	if len(days) != 1 || !days[0].Day.Equal(mustDay(t, "2026-12-06")) || days[0].Trip != nil || days[0].Calendar == nil || *days[0].Calendar != availability.StatusBusy {
		t.Errorf("preview = %+v, want only Dec 6 Unknown→busy", days)
	}
	if repo.cal.listedFor != natID.String() {
		t.Errorf("read calendar of %q, want the viewer's own", repo.cal.listedFor)
	}
}

func TestPushPreview_GuestForbidden(t *testing.T) {
	repo, _ := decemberTrip(t)
	repo.guests = map[string]Member{bankHash: {ID: uuid.New(), DisplayName: "Bank"}}

	_, err := newTestService(repo, defaultNow).PushPreview(context.Background(), repo.trip.ID, Viewer{GuestTokenHash: bankHash})

	if !errors.Is(err, ErrGuestNotAllowed) {
		t.Fatalf("err = %v, want ErrGuestNotAllowed", err)
	}
}

func TestPush_AppliesOnlyPickedDays(t *testing.T) {
	repo, me := decemberTrip(t)
	repo.marks = map[uuid.UUID][]availability.Mark{me.ID: {free(t, "2026-12-05")}}
	repo.cal = &fakeCalendar{marks: []availability.Mark{busy(t, "2026-12-05"), busy(t, "2026-12-06")}}

	err := newTestService(repo, defaultNow).Push(context.Background(), repo.trip.ID, Viewer{UserID: natID}, []time.Time{mustDay(t, "2026-12-06")})

	if err != nil {
		t.Fatal(err)
	}
	if repo.savedFor != me.ID || len(repo.savedSet) != 1 || repo.savedSet[0] != busy(t, "2026-12-06") || len(repo.savedClear) != 0 {
		t.Errorf("saved for %v set=%v clear=%v, want only Dec 6 busy", repo.savedFor, repo.savedSet, repo.savedClear)
	}
	if !repo.pushedAt[me.ID].Equal(defaultNow) {
		t.Errorf("pushed_at = %v, want %v", repo.pushedAt[me.ID], defaultNow)
	}
}

func TestPush_PickedUnknownClears(t *testing.T) {
	repo, me := decemberTrip(t)
	repo.marks = map[uuid.UUID][]availability.Mark{me.ID: {busy(t, "2026-12-05")}}

	err := newTestService(repo, defaultNow).Push(context.Background(), repo.trip.ID, Viewer{UserID: natID}, []time.Time{mustDay(t, "2026-12-05")})

	if err != nil {
		t.Fatal(err)
	}
	if len(repo.savedSet) != 0 || len(repo.savedClear) != 1 || !repo.savedClear[0].Equal(mustDay(t, "2026-12-05")) {
		t.Errorf("set=%v clear=%v, want Dec 5 cleared", repo.savedSet, repo.savedClear)
	}
}

func TestPush_DayOutOfRange(t *testing.T) {
	repo, _ := decemberTrip(t)

	err := newTestService(repo, defaultNow).Push(context.Background(), repo.trip.ID, Viewer{UserID: natID}, []time.Time{mustDay(t, "2026-12-21")})

	if !errors.Is(err, ErrDayOutOfRange) {
		t.Fatalf("err = %v, want ErrDayOutOfRange", err)
	}
	if repo.saveCalls != 0 || len(repo.pushedAt) != 0 {
		t.Error("out-of-range push must save nothing")
	}
}

// Reason ของตัวเองช่วยเลือกวันตอน Push — เห็นเฉพาะเจ้าของ ไม่ถูกคัดลอกเข้าทริป
func TestPushPreview_IncludesOwnReason(t *testing.T) {
	repo, _ := decemberTrip(t)
	repo.cal = &fakeCalendar{marks: []availability.Mark{{Day: mustDay(t, "2026-12-06"), Status: availability.StatusBusy, Reason: "workday"}}}

	days, err := newTestService(repo, defaultNow).PushPreview(context.Background(), repo.trip.ID, Viewer{UserID: natID})

	if err != nil || len(days) != 1 || days[0].CalendarReason != "workday" {
		t.Fatalf("preview = %+v err = %v, want Dec 6 with reason workday", days, err)
	}
}

func TestPush_NeverCopiesReason(t *testing.T) {
	repo, _ := decemberTrip(t)
	repo.cal = &fakeCalendar{marks: []availability.Mark{{Day: mustDay(t, "2026-12-06"), Status: availability.StatusBusy, Reason: "workday"}}}

	if err := newTestService(repo, defaultNow).Push(context.Background(), repo.trip.ID, Viewer{UserID: natID}, []time.Time{mustDay(t, "2026-12-06")}); err != nil {
		t.Fatal(err)
	}
	if len(repo.savedSet) != 1 || repo.savedSet[0].Reason != "" {
		t.Errorf("saved = %+v, want busy without reason", repo.savedSet)
	}
}
