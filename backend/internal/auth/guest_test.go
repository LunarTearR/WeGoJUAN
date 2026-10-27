package auth_test

import (
	"io"
	"net/http"
	"strings"
	"testing"
	"time"

	"github.com/gofiber/fiber/v3"

	"WeGoJUAN-backend/internal/auth"
)

func newGuestApp(m *auth.Manager) *fiber.App {
	app := fiber.New()
	app.Post("/guest", func(c fiber.Ctx) error {
		token, err := m.EnsureGuestToken(c)
		if err != nil {
			return err
		}
		return c.SendString(token)
	})
	return app
}

func guestCookie(res *http.Response) *http.Cookie {
	for _, ck := range res.Cookies() {
		if ck.Name == auth.GuestCookieName {
			return ck
		}
	}
	return nil
}

func TestEnsureGuestToken_IssuesHttpOnlyCookie(t *testing.T) {
	app := newGuestApp(newManager(t, testSecret, time.Hour, true))

	res := do(t, app, http.MethodPost, "/guest")

	body, _ := io.ReadAll(res.Body)
	ck := guestCookie(res)
	if ck == nil {
		t.Fatal("no guest cookie issued")
	}
	if ck.Value != string(body) || len(ck.Value) != 43 {
		t.Errorf("cookie = %q body = %q, want same 43-char token", ck.Value, body)
	}
	if !ck.HttpOnly || !ck.Secure || ck.SameSite != http.SameSiteLaxMode {
		t.Errorf("cookie flags HttpOnly=%v Secure=%v SameSite=%v", ck.HttpOnly, ck.Secure, ck.SameSite)
	}
	if ck.MaxAge < 364*24*60*60 {
		t.Errorf("MaxAge = %d, want about 1 year", ck.MaxAge)
	}
}

func TestEnsureGuestToken_ReusesExisting(t *testing.T) {
	app := newGuestApp(newManager(t, testSecret, time.Hour, false))
	existing := strings.Repeat("a", 43)

	res := do(t, app, http.MethodPost, "/guest", &http.Cookie{Name: auth.GuestCookieName, Value: existing})

	body, _ := io.ReadAll(res.Body)
	if string(body) != existing {
		t.Errorf("token = %q, want existing %q", body, existing)
	}
	if guestCookie(res) != nil {
		t.Error("existing token must not be re-issued")
	}
}

func TestEnsureGuestToken_ReplacesMalformed(t *testing.T) {
	app := newGuestApp(newManager(t, testSecret, time.Hour, false))

	res := do(t, app, http.MethodPost, "/guest", &http.Cookie{Name: auth.GuestCookieName, Value: "a"})

	body, _ := io.ReadAll(res.Body)
	if string(body) == "a" || guestCookie(res) == nil {
		t.Errorf("malformed token %q must be replaced with a new cookie", body)
	}
}

func TestHashGuestToken_Deterministic(t *testing.T) {
	token := strings.Repeat("b", 43)

	h1, h2 := auth.HashGuestToken(token), auth.HashGuestToken(token)

	if h1 != h2 || len(h1) != 64 || h1 == token {
		t.Errorf("hash = %q / %q, want same 64 hex chars that differ from the token", h1, h2)
	}
}
