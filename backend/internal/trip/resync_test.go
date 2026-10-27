package trip

import (
	"context"
	"net/http"
	"testing"
	"time"

	"github.com/google/uuid"
)

func TestTripsToResync_PassesDaysToRepo(t *testing.T) {
	repo := &fakeRepo{resyncTrips: []Trip{{ID: uuid.New(), Title: "Chiang Mai"}}}
	days := []time.Time{mustDay(t, "2026-12-05")}

	trips, err := newTestService(repo, defaultNow).TripsToResync(context.Background(), natID, days)

	if err != nil || len(trips) != 1 {
		t.Fatalf("trips = %v err = %v", trips, err)
	}
	if len(repo.resyncDays) != 1 || !repo.resyncDays[0].Equal(days[0]) {
		t.Errorf("repo got days %v", repo.resyncDays)
	}
}

func TestTripsToResync_NoDays_Empty(t *testing.T) {
	repo := &fakeRepo{}

	trips, err := newTestService(repo, defaultNow).TripsToResync(context.Background(), natID, nil)

	if err != nil || len(trips) != 0 || repo.resyncCalls != 0 {
		t.Errorf("trips = %v err = %v calls = %d, want empty without a repo call", trips, err, repo.resyncCalls)
	}
}

func TestResync_RouteNotShadowedById(t *testing.T) {
	repo := &fakeRepo{resyncTrips: []Trip{{ID: uuid.New(), Title: "Chiang Mai", StartDate: mustDay(t, "2026-12-01"), EndDate: mustDay(t, "2026-12-20")}}}
	app := newTestApp(t, repo)

	res := request(t, app, http.MethodGet, "/trips/resync?days=2026-12-05,2026-12-06", "", loginAs(t, app, natID))

	if res.StatusCode != http.StatusOK {
		t.Fatalf("status = %d, want 200 (not swallowed by /:id)", res.StatusCode)
	}
	if got := decode[[]tripResponse](t, res); len(got) != 1 || got[0].Title != "Chiang Mai" {
		t.Errorf("body = %+v", got)
	}
	if len(repo.resyncDays) != 2 {
		t.Errorf("repo got %d days, want 2", len(repo.resyncDays))
	}
}

func TestResync_BadDay_400(t *testing.T) {
	app := newTestApp(t, &fakeRepo{})

	res := request(t, app, http.MethodGet, "/trips/resync?days=2026-12-05,nope", "", loginAs(t, app, natID))

	if res.StatusCode != http.StatusBadRequest {
		t.Fatalf("status = %d, want 400", res.StatusCode)
	}
}

func TestResync_RequiresLogin_401(t *testing.T) {
	app := newTestApp(t, &fakeRepo{})

	res := request(t, app, http.MethodGet, "/trips/resync?days=2026-12-05", "")

	if res.StatusCode != http.StatusUnauthorized {
		t.Fatalf("status = %d, want 401", res.StatusCode)
	}
}
