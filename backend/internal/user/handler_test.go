package user

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

func newTestApp(t *testing.T, repo *fakeRepo) *fiber.App {
	t.Helper()
	m, err := auth.NewManager("test-secret-that-is-at-least-32-bytes!!", time.Hour, false)
	if err != nil {
		t.Fatal(err)
	}
	app := fiber.New()
	NewHandler(NewService(repo), m).RegisterRoutes(app.Group("/users"))
	return app
}

func request(t *testing.T, app *fiber.App, method, path, body string, cookie *http.Cookie) *http.Response {
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
		t.Fatalf("%s %s: %v", method, path, err)
	}
	return res
}

// login เข้าระบบด้วย existingUser แล้วคืน cookie สำหรับ request ถัดไป
func login(t *testing.T, app *fiber.App) *http.Cookie {
	t.Helper()
	res := request(t, app, http.MethodPost, "/users/login", `{"email":"a@x.com","password":"Secret#123"}`, nil)
	if res.StatusCode != http.StatusOK {
		t.Fatalf("login status = %d, want 200", res.StatusCode)
	}
	for _, ck := range res.Cookies() {
		if ck.Name == auth.CookieName && ck.Value != "" {
			return &http.Cookie{Name: ck.Name, Value: ck.Value}
		}
	}
	t.Fatal("login did not set session cookie")
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

func TestLoginHandler_NormalizesEmailAndReturnsProfile(t *testing.T) {
	u := existingUser(t)
	repo := &fakeRepo{findUser: u}
	app := newTestApp(t, repo)

	res := request(t, app, http.MethodPost, "/users/login", `{"email":"  A@X.com ","password":"Secret#123"}`, nil)

	if res.StatusCode != http.StatusOK {
		t.Fatalf("status = %d, want 200", res.StatusCode)
	}
	if len(repo.findEmails) != 1 || repo.findEmails[0] != "a@x.com" {
		t.Errorf("looked up emails = %q, want [a@x.com]", repo.findEmails)
	}
	got := decode[meResponse](t, res)
	if got.ID != u.ID || got.Email != "a@x.com" || got.DisplayName != "alice" {
		t.Errorf("body = %+v", got)
	}
}

func TestLoginHandler_WrongPassword_401(t *testing.T) {
	app := newTestApp(t, &fakeRepo{findUser: existingUser(t)})

	res := request(t, app, http.MethodPost, "/users/login", `{"email":"a@x.com","password":"Wrong#123"}`, nil)

	if res.StatusCode != http.StatusUnauthorized {
		t.Fatalf("status = %d, want 401", res.StatusCode)
	}
	if len(res.Cookies()) != 0 {
		t.Errorf("failed login must not set cookies, got %v", res.Cookies())
	}
}

func TestProtectedRoutes_RequireLogin(t *testing.T) {
	u := existingUser(t)
	app := newTestApp(t, &fakeRepo{findUser: u})

	tests := []struct{ method, path, body string }{
		{http.MethodGet, "/users/me", ""},
		{http.MethodPatch, "/users/me", `{"display_name":"bob"}`},
		{http.MethodPut, "/users/me/password", `{"current_password":"Secret#123","new_password":"NewSecret#456"}`},
		{http.MethodGet, "/users/" + u.ID.String(), ""},
	}
	for _, tt := range tests {
		t.Run(tt.method+" "+tt.path, func(t *testing.T) {
			res := request(t, app, tt.method, tt.path, tt.body, nil)
			if res.StatusCode != http.StatusUnauthorized {
				t.Errorf("status = %d, want 401", res.StatusCode)
			}
		})
	}
}

func TestMe_ReturnsOwnProfile(t *testing.T) {
	u := existingUser(t)
	app := newTestApp(t, &fakeRepo{findUser: u})

	res := request(t, app, http.MethodGet, "/users/me", "", login(t, app))

	if res.StatusCode != http.StatusOK {
		t.Fatalf("status = %d, want 200", res.StatusCode)
	}
	got := decode[meResponse](t, res)
	if got.ID != u.ID || got.Email != "a@x.com" {
		t.Errorf("body = %+v", got)
	}
}

func TestUpdateMe(t *testing.T) {
	tests := []struct {
		name        string
		body        string
		wantStatus  int
		wantUpdates []string
	}{
		{"trims and saves", `{"display_name":"  bob  "}`, http.StatusOK, []string{"bob"}},
		{"too short", `{"display_name":"ab"}`, http.StatusBadRequest, nil},
		{"blank", `{"display_name":"   "}`, http.StatusBadRequest, nil},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			repo := &fakeRepo{findUser: existingUser(t)}
			app := newTestApp(t, repo)

			res := request(t, app, http.MethodPatch, "/users/me", tt.body, login(t, app))

			if res.StatusCode != tt.wantStatus {
				t.Fatalf("status = %d, want %d", res.StatusCode, tt.wantStatus)
			}
			if strings.Join(repo.displayNameUpdates, ",") != strings.Join(tt.wantUpdates, ",") {
				t.Errorf("repo updates = %q, want %q", repo.displayNameUpdates, tt.wantUpdates)
			}
			if tt.wantStatus == http.StatusOK {
				if got := decode[meResponse](t, res); got.DisplayName != "bob" {
					t.Errorf("DisplayName = %q, want bob", got.DisplayName)
				}
			}
		})
	}
}

func TestChangePasswordHandler(t *testing.T) {
	tests := []struct {
		name        string
		body        string
		wantStatus  int
		wantUpdated bool
	}{
		{"ok", `{"current_password":"Secret#123","new_password":"NewSecret#456"}`, http.StatusNoContent, true},
		{"wrong current", `{"current_password":"Wrong#123","new_password":"NewSecret#456"}`, http.StatusBadRequest, false},
		{"weak new", `{"current_password":"Secret#123","new_password":"weak"}`, http.StatusBadRequest, false},
		{"missing current", `{"new_password":"NewSecret#456"}`, http.StatusBadRequest, false},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			repo := &fakeRepo{findUser: existingUser(t)}
			app := newTestApp(t, repo)

			res := request(t, app, http.MethodPut, "/users/me/password", tt.body, login(t, app))

			if res.StatusCode != tt.wantStatus {
				t.Fatalf("status = %d, want %d", res.StatusCode, tt.wantStatus)
			}
			if updated := len(repo.passwordUpdates) > 0; updated != tt.wantUpdated {
				t.Errorf("password updated = %v, want %v", updated, tt.wantUpdated)
			}
		})
	}
}

func TestGetByIDHandler_PublicProfileOnly(t *testing.T) {
	u := existingUser(t)
	app := newTestApp(t, &fakeRepo{findUser: u})

	res := request(t, app, http.MethodGet, "/users/"+u.ID.String(), "", login(t, app))

	if res.StatusCode != http.StatusOK {
		t.Fatalf("status = %d, want 200", res.StatusCode)
	}
	got := decode[map[string]any](t, res)
	if _, ok := got["email"]; ok {
		t.Errorf("public profile must not expose email: %v", got)
	}
	if got["display_name"] != "alice" {
		t.Errorf("display_name = %v, want alice", got["display_name"])
	}
}

func TestLogoutHandler_ClearsCookie(t *testing.T) {
	app := newTestApp(t, &fakeRepo{})

	res := request(t, app, http.MethodPost, "/users/logout", "", nil)

	if res.StatusCode != http.StatusNoContent {
		t.Fatalf("status = %d, want 204", res.StatusCode)
	}
	for _, ck := range res.Cookies() {
		if ck.Name == auth.CookieName && ck.Value == "" {
			return
		}
	}
	t.Error("logout did not clear session cookie")
}
