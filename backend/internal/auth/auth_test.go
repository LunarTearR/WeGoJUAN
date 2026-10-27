package auth_test

import (
	"io"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gofiber/fiber/v3"

	"WeGoJUAN-backend/internal/auth"
)

const testSecret = "test-secret-that-is-at-least-32-bytes!!"

func newManager(t *testing.T, secret string, ttl time.Duration, secure bool) *auth.Manager {
	t.Helper()
	m, err := auth.NewManager(secret, ttl, secure)
	if err != nil {
		t.Fatalf("NewManager: %v", err)
	}
	return m
}

// newApp mounts /login (issues cookie for "user-1"), /logout and a protected /whoami
func newApp(m *auth.Manager) *fiber.App {
	app := fiber.New()
	app.Post("/login", func(c fiber.Ctx) error {
		return m.Login(c, "user-1")
	})
	app.Post("/logout", func(c fiber.Ctx) error {
		m.Logout(c)
		return c.SendStatus(fiber.StatusNoContent)
	})
	app.Get("/whoami", m.Require(), func(c fiber.Ctx) error {
		return c.SendString(auth.UserID(c))
	})
	return app
}

func do(t *testing.T, app *fiber.App, method, path string, cookies ...*http.Cookie) *http.Response {
	t.Helper()
	req := httptest.NewRequest(method, path, nil)
	for _, ck := range cookies {
		req.AddCookie(ck)
	}
	res, err := app.Test(req)
	if err != nil {
		t.Fatalf("%s %s: %v", method, path, err)
	}
	return res
}

func sessionCookie(t *testing.T, res *http.Response) *http.Cookie {
	t.Helper()
	for _, ck := range res.Cookies() {
		if ck.Name == auth.CookieName {
			return ck
		}
	}
	t.Fatalf("response has no %q cookie", auth.CookieName)
	return nil
}

func TestNewManager_RejectsShortSecret(t *testing.T) {
	if _, err := auth.NewManager("too-short", time.Hour, false); err == nil {
		t.Fatal("want error for secret shorter than 32 bytes, got nil")
	}
}

func TestLogin_SetsHttpOnlyCookie(t *testing.T) {
	app := newApp(newManager(t, testSecret, time.Hour, true))

	ck := sessionCookie(t, do(t, app, http.MethodPost, "/login"))

	if ck.Value == "" {
		t.Error("cookie value is empty")
	}
	if !ck.HttpOnly {
		t.Error("cookie must be HttpOnly")
	}
	if !ck.Secure {
		t.Error("cookie must be Secure when manager is configured secure")
	}
	if ck.SameSite != http.SameSiteLaxMode {
		t.Errorf("SameSite = %v, want Lax", ck.SameSite)
	}
	if ck.Path != "/" {
		t.Errorf("Path = %q, want /", ck.Path)
	}
}

func TestLogin_InsecureCookieInDevelopment(t *testing.T) {
	app := newApp(newManager(t, testSecret, time.Hour, false))

	ck := sessionCookie(t, do(t, app, http.MethodPost, "/login"))

	if ck.Secure {
		t.Error("cookie must not be Secure when manager is configured insecure")
	}
}

func TestRequire_ValidCookie_ExposesUserID(t *testing.T) {
	app := newApp(newManager(t, testSecret, time.Hour, false))
	ck := sessionCookie(t, do(t, app, http.MethodPost, "/login"))

	res := do(t, app, http.MethodGet, "/whoami", &http.Cookie{Name: ck.Name, Value: ck.Value})

	if res.StatusCode != http.StatusOK {
		t.Fatalf("status = %d, want 200", res.StatusCode)
	}
	body, err := io.ReadAll(res.Body)
	if err != nil {
		t.Fatal(err)
	}
	if string(body) != "user-1" {
		t.Errorf("UserID = %q, want %q", body, "user-1")
	}
}

func TestRequire_Rejects(t *testing.T) {
	issuer := newApp(newManager(t, testSecret, time.Hour, false))
	valid := sessionCookie(t, do(t, issuer, http.MethodPost, "/login"))

	expiredIssuer := newApp(newManager(t, testSecret, -time.Minute, false))
	expired := sessionCookie(t, do(t, expiredIssuer, http.MethodPost, "/login"))
	if expired.Value == "" {
		t.Fatal("expired issuer returned empty token")
	}

	tests := []struct {
		name   string
		cookie *http.Cookie
	}{
		{"no cookie", nil},
		{"garbage token", &http.Cookie{Name: auth.CookieName, Value: "not-a-jwt"}},
		{"expired token", &http.Cookie{Name: auth.CookieName, Value: expired.Value}},
		{"tampered token", &http.Cookie{Name: auth.CookieName, Value: valid.Value + "x"}},
	}
	app := newApp(newManager(t, testSecret, time.Hour, false))
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var res *http.Response
			if tt.cookie == nil {
				res = do(t, app, http.MethodGet, "/whoami")
			} else {
				res = do(t, app, http.MethodGet, "/whoami", tt.cookie)
			}
			if res.StatusCode != http.StatusUnauthorized {
				t.Errorf("status = %d, want 401", res.StatusCode)
			}
		})
	}
}

func TestRequire_RejectsTokenSignedWithOtherSecret(t *testing.T) {
	other := newApp(newManager(t, "another-secret-that-is-32-bytes-long!!", time.Hour, false))
	ck := sessionCookie(t, do(t, other, http.MethodPost, "/login"))

	app := newApp(newManager(t, testSecret, time.Hour, false))
	res := do(t, app, http.MethodGet, "/whoami", &http.Cookie{Name: ck.Name, Value: ck.Value})

	if res.StatusCode != http.StatusUnauthorized {
		t.Errorf("status = %d, want 401", res.StatusCode)
	}
}

func TestLogout_ExpiresCookie(t *testing.T) {
	app := newApp(newManager(t, testSecret, time.Hour, false))

	ck := sessionCookie(t, do(t, app, http.MethodPost, "/logout"))

	if ck.Value != "" {
		t.Errorf("cookie value = %q, want empty", ck.Value)
	}
	expired := ck.MaxAge < 0 || (!ck.Expires.IsZero() && ck.Expires.Before(time.Now()))
	if !expired {
		t.Errorf("cookie not expired: MaxAge=%d Expires=%v", ck.MaxAge, ck.Expires)
	}
}
