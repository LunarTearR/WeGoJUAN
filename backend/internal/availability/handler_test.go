package availability

import (
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/gofiber/fiber/v3"

	"WeGoJUAN-backend/internal/auth"
)

const testUserID = "6f1c2c1e-0d5e-4a43-9a51-0c7d0f6f5b11"

// mount แบบเดียวกับ main.go: ทั้ง /availability อยู่หลัง Require
func newTestApp(t *testing.T, repo *fakeRepo) (*fiber.App, *http.Cookie) {
	t.Helper()
	m, err := auth.NewManager("test-secret-that-is-at-least-32-bytes!!", time.Hour, false)
	if err != nil {
		t.Fatal(err)
	}
	app := fiber.New()
	app.Post("/test-login/:id", func(c fiber.Ctx) error { return m.Login(c, c.Params("id")) })
	g := app.Group("/availability")
	g.Use(m.Require())
	NewHandler(NewService(repo)).RegisterRoutes(g)

	res, err := app.Test(httptest.NewRequest(http.MethodPost, "/test-login/"+testUserID, nil))
	if err != nil {
		t.Fatal(err)
	}
	for _, ck := range res.Cookies() {
		if ck.Name == auth.CookieName {
			return app, &http.Cookie{Name: ck.Name, Value: ck.Value}
		}
	}
	t.Fatal("no session cookie")
	return nil, nil
}

func do(t *testing.T, app *fiber.App, method, path, body string, cookie *http.Cookie) *http.Response {
	t.Helper()
	var r io.Reader
	if body != "" {
		r = strings.NewReader(body)
	}
	req := httptest.NewRequest(method, path, r)
	if body != "" {
		req.Header.Set("Content-Type", "application/json")
	}
	if cookie != nil {
		req.AddCookie(cookie)
	}
	res, err := app.Test(req)
	if err != nil {
		t.Fatal(err)
	}
	return res
}

func TestAvailability_RequiresLogin_401(t *testing.T) {
	app, _ := newTestApp(t, &fakeRepo{})

	for _, method := range []string{http.MethodGet, http.MethodPut} {
		res := do(t, app, method, "/availability?from=2026-12-01&to=2026-12-31", `[]`, nil)
		if res.StatusCode != http.StatusUnauthorized {
			t.Errorf("%s status = %d, want 401", method, res.StatusCode)
		}
	}
}

func TestListMine_RequiresFromTo_400(t *testing.T) {
	app, ck := newTestApp(t, &fakeRepo{})

	for _, q := range []string{"", "?from=2026-12-01", "?from=2026-12-01&to=31-12-2026", "?from=2026-12-31&to=2026-12-01"} {
		res := do(t, app, http.MethodGet, "/availability"+q, "", ck)
		if res.StatusCode != http.StatusBadRequest {
			t.Errorf("GET %q status = %d, want 400", q, res.StatusCode)
		}
	}
}

func TestListMine_RangeOver366Days_400(t *testing.T) {
	app, ck := newTestApp(t, &fakeRepo{})

	res := do(t, app, http.MethodGet, "/availability?from=2026-01-01&to=2027-01-02", "", ck)

	if res.StatusCode != http.StatusBadRequest {
		t.Fatalf("status = %d, want 400", res.StatusCode)
	}
}

func TestListMine_ReturnsDateOnly(t *testing.T) {
	app, ck := newTestApp(t, &fakeRepo{listed: []Mark{{Day: day("2026-12-05"), Status: StatusBusy}}})

	res := do(t, app, http.MethodGet, "/availability?from=2026-12-01&to=2026-12-31", "", ck)

	if res.StatusCode != http.StatusOK {
		t.Fatalf("status = %d, want 200", res.StatusCode)
	}
	b, _ := io.ReadAll(res.Body)
	var got []map[string]string
	if err := json.Unmarshal(b, &got); err != nil {
		t.Fatal(err)
	}
	if len(got) != 1 || got[0]["day"] != "2026-12-05" || got[0]["status"] != "busy" {
		t.Errorf("body = %s", b)
	}
}

func TestSetMarks_Maybe_422(t *testing.T) {
	repo := &fakeRepo{}
	app, ck := newTestApp(t, repo)

	res := do(t, app, http.MethodPut, "/availability", `[{"day":"2026-12-05","status":"maybe"}]`, ck)

	if res.StatusCode != http.StatusUnprocessableEntity {
		t.Fatalf("status = %d, want 422", res.StatusCode)
	}
	if repo.savedUser != "" {
		t.Error("invalid status must not reach the repo")
	}
}

func TestSetMarks_DuplicateDay_400(t *testing.T) {
	app, ck := newTestApp(t, &fakeRepo{})

	res := do(t, app, http.MethodPut, "/availability",
		`[{"day":"2026-12-05","status":"free"},{"day":"2026-12-05","status":"busy"}]`, ck)

	if res.StatusCode != http.StatusBadRequest {
		t.Fatalf("status = %d, want 400", res.StatusCode)
	}
}

func TestSetMarks_204(t *testing.T) {
	repo := &fakeRepo{}
	app, ck := newTestApp(t, repo)

	res := do(t, app, http.MethodPut, "/availability",
		`[{"day":"2026-12-05","status":"free"},{"day":"2026-12-06","status":null}]`, ck)

	if res.StatusCode != http.StatusNoContent {
		t.Fatalf("status = %d, want 204", res.StatusCode)
	}
	if repo.savedUser != testUserID || len(repo.savedSet) != 1 || len(repo.savedClear) != 1 {
		t.Errorf("saved user=%q set=%v clear=%v", repo.savedUser, repo.savedSet, repo.savedClear)
	}
}

func TestListMine_ReturnsReason(t *testing.T) {
	app, ck := newTestApp(t, &fakeRepo{listed: []Mark{
		{Day: day("2026-12-05"), Status: StatusBusy, Reason: "workday"},
		{Day: day("2026-12-06"), Status: StatusFree},
	}})

	res := do(t, app, http.MethodGet, "/availability?from=2026-12-01&to=2026-12-31", "", ck)

	b, _ := io.ReadAll(res.Body)
	want := `[{"day":"2026-12-05","status":"busy","reason":"workday"},{"day":"2026-12-06","status":"free"}]`
	if string(b) != want {
		t.Errorf("body = %s, want %s", b, want)
	}
}

func TestSetMarks_InvalidReason_400(t *testing.T) {
	repo := &fakeRepo{}
	app, ck := newTestApp(t, repo)

	res := do(t, app, http.MethodPut, "/availability", `[{"day":"2026-12-05","status":"free","reason":"x"}]`, ck)

	if res.StatusCode != http.StatusBadRequest {
		t.Fatalf("status = %d, want 400", res.StatusCode)
	}
	if repo.savedUser != "" {
		t.Error("invalid reason must not reach the repo")
	}
}
