package trip

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"testing"
	"time"
)

// organizerTrip: ทริป ธ.ค. 1-20 ไป 3 วัน โดย viewer เป็นผู้จัด
func organizerTrip(t *testing.T) *fakeRepo {
	repo, _ := decemberTrip(t)
	repo.member = Member{ID: repo.member.ID, UserID: organizerID, DisplayName: "ploy"}
	repo.members = []Member{repo.member}
	return repo
}

func TestConfirm_OrganizerOnly(t *testing.T) {
	repo, _ := decemberTrip(t) // viewer = nat (ไม่ใช่ผู้จัด)

	_, err := newTestService(repo, defaultNow).Confirm(context.Background(), repo.trip.ID, Viewer{UserID: natID}, mustDay(t, "2026-12-05"))

	if !errors.Is(err, ErrNotOrganizer) {
		t.Fatalf("err = %v, want ErrNotOrganizer", err)
	}
	if repo.confirmCalls != 0 {
		t.Error("non-organizer must not confirm")
	}
}

func TestConfirm_InvalidWindow(t *testing.T) {
	tests := []struct {
		name  string
		start string
		now   time.Time
	}{
		{"before date range", "2026-11-30", defaultNow},
		{"runs past end", "2026-12-19", defaultNow},
		{"starts before today", "2026-12-05", time.Date(2026, 12, 10, 5, 0, 0, 0, time.UTC)},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			repo := organizerTrip(t)

			_, err := newTestService(repo, tt.now).Confirm(context.Background(), repo.trip.ID, Viewer{UserID: organizerID}, mustDay(t, tt.start))

			if !errors.Is(err, ErrInvalidWindow) {
				t.Fatalf("err = %v, want ErrInvalidWindow", err)
			}
			if repo.confirmCalls != 0 {
				t.Error("invalid window must not be saved")
			}
		})
	}
}

func TestConfirm_OK(t *testing.T) {
	repo := organizerTrip(t)

	got, err := newTestService(repo, defaultNow).Confirm(context.Background(), repo.trip.ID, Viewer{UserID: organizerID}, mustDay(t, "2026-12-05"))

	if err != nil {
		t.Fatal(err)
	}
	if repo.confirmedStart == nil || !repo.confirmedStart.Equal(mustDay(t, "2026-12-05")) {
		t.Errorf("repo got %v, want Dec 5", repo.confirmedStart)
	}
	if end := got.ConfirmedEnd(); end == nil || !end.Equal(mustDay(t, "2026-12-07")) {
		t.Errorf("ConfirmedEnd = %v, want Dec 7", end)
	}
}

func TestClearConfirmed_OrganizerOnly(t *testing.T) {
	repo, _ := decemberTrip(t)
	if err := newTestService(repo, defaultNow).ClearConfirmed(context.Background(), repo.trip.ID, Viewer{UserID: natID}); !errors.Is(err, ErrNotOrganizer) {
		t.Fatalf("member err = %v, want ErrNotOrganizer", err)
	}

	repo = organizerTrip(t)
	start := mustDay(t, "2026-12-05")
	repo.confirmedStart = &start
	if err := newTestService(repo, defaultNow).ClearConfirmed(context.Background(), repo.trip.ID, Viewer{UserID: organizerID}); err != nil {
		t.Fatal(err)
	}
	if repo.confirmCalls != 1 || repo.confirmedStart != nil {
		t.Errorf("calls = %d start = %v, want cleared", repo.confirmCalls, repo.confirmedStart)
	}
}

func TestConfirmRoute_NonOrganizer_403(t *testing.T) {
	repo, _ := decemberTrip(t)
	app := newTestApp(t, repo)

	res := request(t, app, http.MethodPut, "/trips/"+repo.trip.ID.String()+"/confirmed", `{"start":"2026-12-05"}`, loginAs(t, app, natID))

	if res.StatusCode != http.StatusForbidden {
		t.Fatalf("status = %d, want 403", res.StatusCode)
	}
}

func TestConfirmRoute_200(t *testing.T) {
	repo := organizerTrip(t)
	app := newTestApp(t, repo)

	res := request(t, app, http.MethodPut, "/trips/"+repo.trip.ID.String()+"/confirmed", `{"start":"2026-12-05"}`, loginAs(t, app, organizerID))

	if res.StatusCode != http.StatusOK {
		t.Fatalf("status = %d, want 200", res.StatusCode)
	}
	got := decode[tripResponse](t, res)
	if got.ConfirmedStart == nil || *got.ConfirmedStart != "2026-12-05" || got.ConfirmedEnd == nil || *got.ConfirmedEnd != "2026-12-07" {
		t.Errorf("confirmed = %v..%v", got.ConfirmedStart, got.ConfirmedEnd)
	}

	res = request(t, app, http.MethodDelete, "/trips/"+repo.trip.ID.String()+"/confirmed", "", loginAs(t, app, organizerID))
	if res.StatusCode != http.StatusNoContent {
		t.Fatalf("DELETE status = %d, want 204", res.StatusCode)
	}
}

func TestTripJSON_FindingDates_NullConfirmed(t *testing.T) {
	repo, _ := decemberTrip(t)
	app := newTestApp(t, repo)

	res := request(t, app, http.MethodGet, "/trips/"+repo.trip.ID.String(), "", loginAs(t, app, natID))

	b, _ := io.ReadAll(res.Body)
	var got struct {
		Trip map[string]any `json:"trip"`
	}
	if err := json.Unmarshal(b, &got); err != nil {
		t.Fatal(err)
	}
	if v, ok := got.Trip["confirmed_start"]; !ok || v != nil {
		t.Errorf("confirmed_start = %v (present %v), want null", v, ok)
	}
	if v, ok := got.Trip["confirmed_end"]; !ok || v != nil {
		t.Errorf("confirmed_end = %v (present %v), want null", v, ok)
	}
}
