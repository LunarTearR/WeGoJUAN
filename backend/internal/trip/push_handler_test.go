package trip

import (
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"WeGoJUAN-backend/internal/availability"
)

func TestPushPreview_200(t *testing.T) {
	repo, _ := decemberTrip(t)
	repo.cal = &fakeCalendar{marks: []availability.Mark{busy(t, "2026-12-06")}}
	app := newTestApp(t, repo)

	res := request(t, app, http.MethodGet, "/trips/"+repo.trip.ID.String()+"/push-preview", "", loginAs(t, app, natID))

	if res.StatusCode != http.StatusOK {
		t.Fatalf("status = %d, want 200", res.StatusCode)
	}
	b, _ := io.ReadAll(res.Body)
	if want := `[{"day":"2026-12-06","trip_status":null,"calendar_status":"busy"}]`; string(b) != want {
		t.Errorf("body = %s, want %s", b, want)
	}
}

func TestPush_Guest_403(t *testing.T) {
	repo := guestRepo(t)
	_, ck := joinAsGuest(t, repo, "Bank")

	res := request(t, newTestApp(t, repo), http.MethodPost, "/trips/"+repo.trip.ID.String()+"/push", `{"days":["2026-12-05"]}`, ck)

	if res.StatusCode != http.StatusForbidden {
		t.Fatalf("status = %d, want 403", res.StatusCode)
	}
}

func TestPush_NonJSON_415(t *testing.T) {
	repo, _ := decemberTrip(t)
	app := newTestApp(t, repo)
	req := httptest.NewRequest(http.MethodPost, "/trips/"+repo.trip.ID.String()+"/push", strings.NewReader("days=2026-12-05"))
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	req.AddCookie(loginAs(t, app, natID))

	res, err := app.Test(req)

	if err != nil {
		t.Fatal(err)
	}
	if res.StatusCode != http.StatusUnsupportedMediaType {
		t.Fatalf("status = %d, want 415", res.StatusCode)
	}
}

func TestPush_204(t *testing.T) {
	repo, me := decemberTrip(t)
	repo.cal = &fakeCalendar{marks: []availability.Mark{busy(t, "2026-12-06")}}
	app := newTestApp(t, repo)

	res := request(t, app, http.MethodPost, "/trips/"+repo.trip.ID.String()+"/push", `{"days":["2026-12-06"]}`, loginAs(t, app, natID))

	if res.StatusCode != http.StatusNoContent {
		t.Fatalf("status = %d, want 204", res.StatusCode)
	}
	if repo.savedFor != me.ID || len(repo.savedSet) != 1 {
		t.Errorf("saved for %v set=%v", repo.savedFor, repo.savedSet)
	}
	if _, ok := repo.pushedAt[me.ID]; !ok {
		t.Error("pushed_at not recorded")
	}
}

func TestPushPreview_JSONHasCalendarReason(t *testing.T) {
	repo, _ := decemberTrip(t)
	repo.cal = &fakeCalendar{marks: []availability.Mark{{Day: mustDay(t, "2026-12-06"), Status: availability.StatusBusy, Reason: "workday"}}}
	app := newTestApp(t, repo)

	res := request(t, app, http.MethodGet, "/trips/"+repo.trip.ID.String()+"/push-preview", "", loginAs(t, app, natID))

	b, _ := io.ReadAll(res.Body)
	if want := `[{"day":"2026-12-06","trip_status":null,"calendar_status":"busy","calendar_reason":"workday"}]`; string(b) != want {
		t.Errorf("body = %s, want %s", b, want)
	}
}

// Mark ในทริปไม่มี Reason — ส่งมาก็ไม่เก็บ
func TestTripMarks_NeverCarryReason(t *testing.T) {
	repo, _ := decemberTrip(t)
	app := newTestApp(t, repo)

	res := request(t, app, http.MethodPut, "/trips/"+repo.trip.ID.String()+"/marks/me",
		`[{"day":"2026-12-05","status":"busy","reason":"hospital"}]`, loginAs(t, app, natID))

	if res.StatusCode != http.StatusNoContent {
		t.Fatalf("status = %d, want 204", res.StatusCode)
	}
	if len(repo.savedSet) != 1 || repo.savedSet[0].Reason != "" {
		t.Errorf("saved = %+v, want no reason on trip marks", repo.savedSet)
	}
}
