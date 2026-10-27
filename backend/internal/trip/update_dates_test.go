package trip

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"
)

func dates(t *testing.T, start, end string, duration int) DatesUpdate {
	return DatesUpdate{StartDate: mustDay(t, start), EndDate: mustDay(t, end), DurationDays: duration}
}

func TestUpdateDates_OrganizerOnly(t *testing.T) {
	repo, _ := decemberTrip(t)

	_, err := newTestService(repo, defaultNow).UpdateDates(context.Background(), repo.trip.ID, Viewer{UserID: natID}, dates(t, "2026-12-01", "2026-12-25", 3))

	if !errors.Is(err, ErrNotOrganizer) || len(repo.updated) != 0 {
		t.Fatalf("err = %v updated = %d, want ErrNotOrganizer and nothing saved", err, len(repo.updated))
	}
}

func TestUpdateDates_Validation(t *testing.T) {
	dec10 := time.Date(2026, 12, 10, 5, 0, 0, 0, time.UTC) // ทริปเริ่มไปแล้ว
	tests := []struct {
		name    string
		now     time.Time
		in      DatesUpdate
		wantErr bool
	}{
		{"duration longer than range", defaultNow, dates(t, "2026-12-01", "2026-12-02", 3), true},
		{"moving start into the past", dec10, dates(t, "2026-12-02", "2026-12-20", 3), true},
		{"keeping a start that is now past", dec10, dates(t, "2026-12-01", "2026-12-25", 3), false},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			repo := organizerTrip(t)

			_, err := newTestService(repo, tt.now).UpdateDates(context.Background(), repo.trip.ID, Viewer{UserID: organizerID}, tt.in)

			if tt.wantErr != errors.Is(err, ErrInvalidTrip) {
				t.Fatalf("err = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

func TestUpdateDates_ClearsConfirmedThatNoLongerFits(t *testing.T) {
	repo := organizerTrip(t)
	start := mustDay(t, "2026-12-18")
	repo.trip.ConfirmedStart = &start

	got, err := newTestService(repo, defaultNow).UpdateDates(context.Background(), repo.trip.ID, Viewer{UserID: organizerID}, dates(t, "2026-12-01", "2026-12-15", 3))

	if err != nil {
		t.Fatal(err)
	}
	if repo.updated[0].ConfirmedStart != nil || got.ConfirmedStart != nil {
		t.Errorf("confirmed = %v, want cleared in the same update", repo.updated[0].ConfirmedStart)
	}
}

func TestUpdateDates_KeepsConfirmedThatStillFits(t *testing.T) {
	repo := organizerTrip(t)
	start := mustDay(t, "2026-12-05")
	repo.trip.ConfirmedStart = &start

	_, err := newTestService(repo, defaultNow).UpdateDates(context.Background(), repo.trip.ID, Viewer{UserID: organizerID}, dates(t, "2026-12-01", "2026-12-15", 3))

	if err != nil {
		t.Fatal(err)
	}
	if c := repo.updated[0].ConfirmedStart; c == nil || !c.Equal(start) {
		t.Errorf("confirmed = %v, want kept Dec 5", c)
	}
}

func TestUpdateDates_ExtendSetsChangedAt_ShrinkDoesNot(t *testing.T) {
	repo := organizerTrip(t)
	svc := newTestService(repo, defaultNow)
	v := Viewer{UserID: organizerID}

	if _, err := svc.UpdateDates(context.Background(), repo.trip.ID, v, dates(t, "2026-12-01", "2026-12-15", 3)); err != nil {
		t.Fatal(err)
	}
	if repo.updated[0].DateRangeChangedAt != nil {
		t.Error("shrinking adds no days → no re-push prompt")
	}

	if _, err := svc.UpdateDates(context.Background(), repo.trip.ID, v, dates(t, "2026-12-01", "2026-12-25", 3)); err != nil {
		t.Fatal(err)
	}
	if c := repo.updated[1].DateRangeChangedAt; c == nil || !c.Equal(defaultNow) {
		t.Errorf("DateRangeChangedAt = %v, want now", c)
	}
}

func TestGet_Repush_AfterExtendSincePush(t *testing.T) {
	repo, _ := decemberTrip(t)
	pushed := defaultNow.Add(-time.Hour)
	repo.member.PushedAt = &pushed

	if getDetail(t, repo, Viewer{UserID: natID}).Prompts.Repush {
		t.Fatal("no range change yet → no repush")
	}

	changed := defaultNow
	repo.trip.DateRangeChangedAt = &changed
	if !getDetail(t, repo, Viewer{UserID: natID}).Prompts.Repush {
		t.Error("range extended after last push → repush")
	}

	later := changed.Add(time.Minute)
	repo.member.PushedAt = &later
	if getDetail(t, repo, Viewer{UserID: natID}).Prompts.Repush {
		t.Error("pushed again after the change → no repush")
	}
}

func TestPatchTrip_NonJSON_415(t *testing.T) {
	repo := organizerTrip(t)
	app := newTestApp(t, repo)
	req := httptest.NewRequest(http.MethodPatch, "/trips/"+repo.trip.ID.String(), strings.NewReader("end_date=2026-12-25"))
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	req.AddCookie(loginAs(t, app, organizerID))

	res, err := app.Test(req)

	if err != nil {
		t.Fatal(err)
	}
	if res.StatusCode != http.StatusUnsupportedMediaType {
		t.Fatalf("status = %d, want 415", res.StatusCode)
	}
}

func TestPatchTrip_NonOrganizer_403(t *testing.T) {
	repo, _ := decemberTrip(t)
	app := newTestApp(t, repo)

	res := request(t, app, http.MethodPatch, "/trips/"+repo.trip.ID.String(),
		`{"start_date":"2026-12-01","end_date":"2026-12-25","duration_days":3}`, loginAs(t, app, natID))

	if res.StatusCode != http.StatusForbidden {
		t.Fatalf("status = %d, want 403", res.StatusCode)
	}
}

func TestPatchTrip_200(t *testing.T) {
	repo := organizerTrip(t)
	app := newTestApp(t, repo)

	res := request(t, app, http.MethodPatch, "/trips/"+repo.trip.ID.String(),
		`{"start_date":"2026-12-01","end_date":"2026-12-25","duration_days":4}`, loginAs(t, app, organizerID))

	if res.StatusCode != http.StatusOK {
		t.Fatalf("status = %d, want 200", res.StatusCode)
	}
	if got := decode[tripResponse](t, res); got.EndDate != "2026-12-25" || got.DurationDays != 4 {
		t.Errorf("body = %+v", got)
	}
}
