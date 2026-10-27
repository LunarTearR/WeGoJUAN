package trip

import (
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/gofiber/fiber/v3"
	"github.com/google/uuid"

	"WeGoJUAN-backend/internal/auth"
)

const validTripBody = `{"title":"Chiang Mai","start_date":"2026-12-01","end_date":"2026-12-20","duration_days":3}`

func newTestApp(t *testing.T, repo *fakeRepo) *fiber.App {
	t.Helper()
	m, err := auth.NewManager("test-secret-that-is-at-least-32-bytes!!", time.Hour, false)
	if err != nil {
		t.Fatal(err)
	}
	app := fiber.New()
	// route ช่วย test: ออก session cookie ให้ userID ใดๆ โดยไม่ต้องผ่าน package user
	app.Post("/test-login/:id", func(c fiber.Ctx) error { return m.Login(c, c.Params("id")) })
	NewHandler(newTestService(repo, defaultNow), m).RegisterRoutes(app.Group("/trips"))
	return app
}

func request(t *testing.T, app *fiber.App, method, path, body string, cookies ...*http.Cookie) *http.Response {
	t.Helper()
	var r io.Reader
	if body != "" {
		r = strings.NewReader(body)
	}
	req := httptest.NewRequest(method, path, r)
	if body != "" {
		req.Header.Set("Content-Type", "application/json")
	}
	for _, ck := range cookies {
		req.AddCookie(ck)
	}
	res, err := app.Test(req)
	if err != nil {
		t.Fatalf("%s %s: %v", method, path, err)
	}
	return res
}

// loginAs คืน session cookie ของ userID สำหรับ request ถัดไป
func loginAs(t *testing.T, app *fiber.App, userID uuid.UUID) *http.Cookie {
	t.Helper()
	res := request(t, app, http.MethodPost, "/test-login/"+userID.String(), "")
	for _, ck := range res.Cookies() {
		if ck.Name == auth.CookieName && ck.Value != "" {
			return &http.Cookie{Name: ck.Name, Value: ck.Value}
		}
	}
	t.Fatal("test login did not set session cookie")
	return nil
}

func decode[T any](t *testing.T, res *http.Response) T {
	t.Helper()
	var v T
	if err := json.NewDecoder(res.Body).Decode(&v); err != nil {
		t.Fatalf("decode body: %v", err)
	}
	return v
}

func bodyString(t *testing.T, res *http.Response) string {
	t.Helper()
	b, err := io.ReadAll(res.Body)
	if err != nil {
		t.Fatal(err)
	}
	return string(b)
}

func TestTripRoutes_RequireLogin(t *testing.T) {
	app := newTestApp(t, &fakeRepo{})

	tests := []struct{ method, path, body string }{
		{http.MethodPost, "/trips", validTripBody},
		{http.MethodGet, "/trips", ""},
		{http.MethodGet, "/trips/" + uuid.NewString(), ""},
	}
	for _, tt := range tests {
		t.Run(tt.method+" "+tt.path, func(t *testing.T) {
			res := request(t, app, tt.method, tt.path, tt.body)
			if res.StatusCode != http.StatusUnauthorized {
				t.Errorf("status = %d, want 401", res.StatusCode)
			}
		})
	}
}

func TestCreateTrip_BadDate_400(t *testing.T) {
	repo := &fakeRepo{}
	app := newTestApp(t, repo)

	res := request(t, app, http.MethodPost, "/trips",
		`{"title":"Chiang Mai","start_date":"2026/12/01","end_date":"2026-12-20","duration_days":3}`,
		loginAs(t, app, organizerID))

	if res.StatusCode != http.StatusBadRequest {
		t.Fatalf("status = %d, want 400", res.StatusCode)
	}
	if len(repo.created) != 0 {
		t.Error("bad date must not reach the repo")
	}
}

func TestCreateTrip_Invalid_400(t *testing.T) {
	app := newTestApp(t, &fakeRepo{})

	res := request(t, app, http.MethodPost, "/trips",
		`{"title":"Chiang Mai","start_date":"2026-12-01","end_date":"2026-12-20","duration_days":0}`,
		loginAs(t, app, organizerID))

	if res.StatusCode != http.StatusBadRequest {
		t.Fatalf("status = %d, want 400", res.StatusCode)
	}
	if body := bodyString(t, res); !strings.HasPrefix(body, "invalid trip") {
		t.Errorf("body = %q, want prefix %q", body, "invalid trip")
	}
}

func TestCreateTrip_201(t *testing.T) {
	app := newTestApp(t, &fakeRepo{})

	res := request(t, app, http.MethodPost, "/trips", validTripBody, loginAs(t, app, organizerID))

	if res.StatusCode != http.StatusCreated {
		t.Fatalf("status = %d, want 201", res.StatusCode)
	}
	got := decode[tripResponse](t, res)
	if got.StartDate != "2026-12-01" || got.EndDate != "2026-12-20" || got.DurationDays != 3 {
		t.Errorf("dates = %s..%s duration %d", got.StartDate, got.EndDate, got.DurationDays)
	}
	if got.InviteCode == "" {
		t.Error("invite_code is empty")
	}
	if got.OrganizerID != organizerID {
		t.Errorf("organizer_id = %v, want %v", got.OrganizerID, organizerID)
	}
}

func TestListTrips_200(t *testing.T) {
	repo := &fakeRepo{listed: []Trip{{ID: uuid.New(), Title: "Chiang Mai", StartDate: mustDay(t, "2026-12-01"), EndDate: mustDay(t, "2026-12-20")}}}
	app := newTestApp(t, repo)

	res := request(t, app, http.MethodGet, "/trips", "", loginAs(t, app, organizerID))

	if res.StatusCode != http.StatusOK {
		t.Fatalf("status = %d, want 200", res.StatusCode)
	}
	got := decode[[]tripResponse](t, res)
	if len(got) != 1 || got[0].Title != "Chiang Mai" || got[0].StartDate != "2026-12-01" {
		t.Errorf("body = %+v", got)
	}
}

func TestGetTrip_MalformedID_404(t *testing.T) {
	app := newTestApp(t, &fakeRepo{})

	res := request(t, app, http.MethodGet, "/trips/not-a-uuid", "", loginAs(t, app, organizerID))

	if res.StatusCode != http.StatusNotFound {
		t.Fatalf("status = %d, want 404", res.StatusCode)
	}
}

func TestGetTrip_NonMember_404(t *testing.T) {
	app := newTestApp(t, &fakeRepo{memberErr: ErrNotFound})

	res := request(t, app, http.MethodGet, "/trips/"+uuid.NewString(), "", loginAs(t, app, organizerID))

	if res.StatusCode != http.StatusNotFound {
		t.Fatalf("status = %d, want 404", res.StatusCode)
	}
}

func TestGetTrip_200(t *testing.T) {
	me := Member{ID: uuid.New(), UserID: organizerID, DisplayName: "ploy"}
	repo := &fakeRepo{
		trip:    Trip{ID: uuid.New(), OrganizerID: organizerID, Title: "Chiang Mai"},
		member:  me,
		members: []Member{me},
	}
	app := newTestApp(t, repo)

	res := request(t, app, http.MethodGet, "/trips/"+repo.trip.ID.String(), "", loginAs(t, app, organizerID))

	if res.StatusCode != http.StatusOK {
		t.Fatalf("status = %d, want 200", res.StatusCode)
	}
	got := decode[detailResponse](t, res)
	if got.Trip.Title != "Chiang Mai" {
		t.Errorf("trip.title = %q", got.Trip.Title)
	}
	if len(got.Members) != 1 || !got.Members[0].IsOrganizer || got.Members[0].DisplayName != "ploy" {
		t.Errorf("members = %+v", got.Members)
	}
	if got.Me.ID != got.Members[0].ID {
		t.Errorf("me.id = %v, want %v", got.Me.ID, got.Members[0].ID)
	}
}
