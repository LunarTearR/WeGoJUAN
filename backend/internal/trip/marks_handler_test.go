package trip

import (
	"encoding/json"
	"io"
	"net/http"
	"testing"

	"github.com/google/uuid"

	"WeGoJUAN-backend/internal/availability"
)

func TestGetMarks_200(t *testing.T) {
	repo, me := decemberTrip(t)
	repo.marks = map[uuid.UUID][]availability.Mark{me.ID: {{Day: mustDay(t, "2026-12-05"), Status: availability.StatusFree}}}
	app := newTestApp(t, repo)

	res := request(t, app, http.MethodGet, "/trips/"+repo.trip.ID.String()+"/marks", "", loginAs(t, app, natID))

	if res.StatusCode != http.StatusOK {
		t.Fatalf("status = %d, want 200", res.StatusCode)
	}
	b, _ := io.ReadAll(res.Body)
	var got []map[string]string
	if err := json.Unmarshal(b, &got); err != nil {
		t.Fatal(err)
	}
	if len(got) != 1 || got[0]["member_id"] != me.ID.String() || got[0]["day"] != "2026-12-05" || got[0]["status"] != "free" {
		t.Errorf("body = %s", b)
	}
}

func TestPutMyMarks_OutOfRange_400(t *testing.T) {
	repo, _ := decemberTrip(t)
	app := newTestApp(t, repo)

	res := request(t, app, http.MethodPut, "/trips/"+repo.trip.ID.String()+"/marks/me",
		`[{"day":"2026-12-21","status":"free"}]`, loginAs(t, app, natID))

	if res.StatusCode != http.StatusBadRequest {
		t.Fatalf("status = %d, want 400", res.StatusCode)
	}
}

func TestPutMyMarks_Maybe_422(t *testing.T) {
	repo, _ := decemberTrip(t)
	app := newTestApp(t, repo)

	res := request(t, app, http.MethodPut, "/trips/"+repo.trip.ID.String()+"/marks/me",
		`[{"day":"2026-12-05","status":"maybe"}]`, loginAs(t, app, natID))

	if res.StatusCode != http.StatusUnprocessableEntity {
		t.Fatalf("status = %d, want 422", res.StatusCode)
	}
}

func TestPutMyMarks_NonMember_404(t *testing.T) {
	repo, _ := decemberTrip(t)
	repo.memberErr = ErrNotFound
	app := newTestApp(t, repo)

	res := request(t, app, http.MethodPut, "/trips/"+repo.trip.ID.String()+"/marks/me",
		`[{"day":"2026-12-05","status":"free"}]`, loginAs(t, app, natID))

	if res.StatusCode != http.StatusNotFound {
		t.Fatalf("status = %d, want 404", res.StatusCode)
	}
	if repo.saveCalls != 0 {
		t.Error("non-member must not save")
	}
}

func TestPutMyMarks_204(t *testing.T) {
	repo, me := decemberTrip(t)
	app := newTestApp(t, repo)

	res := request(t, app, http.MethodPut, "/trips/"+repo.trip.ID.String()+"/marks/me",
		`[{"day":"2026-12-05","status":"busy"},{"day":"2026-12-06","status":null}]`, loginAs(t, app, natID))

	if res.StatusCode != http.StatusNoContent {
		t.Fatalf("status = %d, want 204", res.StatusCode)
	}
	if repo.savedFor != me.ID || len(repo.savedSet) != 1 || len(repo.savedClear) != 1 {
		t.Errorf("saved for %v set=%v clear=%v", repo.savedFor, repo.savedSet, repo.savedClear)
	}
}
