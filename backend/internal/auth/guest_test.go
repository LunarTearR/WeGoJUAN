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
		token, err := auth.NewGuestToken()
		if err != nil {
			return err
		}
		m.SetGuestToken(c, token)
		return c.SendString(token)
	})
	app.Get("/guest", func(c fiber.Ctx) error {
		return c.SendString(auth.GuestToken(c))
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

func TestSetGuestToken_IssuesHttpOnlyCookie(t *testing.T) {
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

func TestNewGuestToken_RandomAnd43Chars(t *testing.T) {
	a, err1 := auth.NewGuestToken()
	b, err2 := auth.NewGuestToken()

	if err1 != nil || err2 != nil || len(a) != 43 || a == b {
		t.Errorf("tokens %q %q errs %v %v, want two different 43-char tokens", a, b, err1, err2)
	}
}

func TestGuestToken_ReadsValidCookie(t *testing.T) {
	app := newGuestApp(newManager(t, testSecret, time.Hour, false))
	existing := strings.Repeat("a", 43)

	res := do(t, app, http.MethodGet, "/guest", &http.Cookie{Name: auth.GuestCookieName, Value: existing})

	if body, _ := io.ReadAll(res.Body); string(body) != existing {
		t.Errorf("token = %q, want %q", body, existing)
	}
}

func TestGuestToken_IgnoresMalformed(t *testing.T) {
	app := newGuestApp(newManager(t, testSecret, time.Hour, false))

	res := do(t, app, http.MethodGet, "/guest", &http.Cookie{Name: auth.GuestCookieName, Value: "a"})

	if body, _ := io.ReadAll(res.Body); string(body) != "" {
		t.Errorf("token = %q, want empty for malformed cookie", body)
	}
}

func TestHashGuestToken_Deterministic(t *testing.T) {
	token := strings.Repeat("b", 43)

	h1, h2 := auth.HashGuestToken(token), auth.HashGuestToken(token)

	if h1 != h2 || len(h1) != 64 || h1 == token {
		t.Errorf("hash = %q / %q, want same 64 hex chars that differ from the token", h1, h2)
	}
}
