package server

import (
	"context"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gofiber/fiber/v3"
)

type okPinger struct{}

func (okPinger) Ping(context.Context) error { return nil }

type pingRoutes struct{}

func (pingRoutes) RegisterRoutes(r fiber.Router) {
	r.Get("/ping", func(c fiber.Ctx) error { return c.SendString("pong") })
}

func newTestServer(cfg Config, mounts ...Mount) *fiber.App {
	return New(cfg, slog.New(slog.NewTextHandler(io.Discard, nil)), okPinger{}, mounts...)
}

func TestMount_MiddlewareGuardsOnlyItsPrefix(t *testing.T) {
	deny := func(c fiber.Ctx) error { return fiber.NewError(fiber.StatusUnauthorized, "unauthorized") }
	app := newTestServer(Config{},
		Mount{Prefix: "/open", Routes: pingRoutes{}},
		Mount{Prefix: "/guarded", Routes: pingRoutes{}, Middleware: []fiber.Handler{deny}},
	)

	tests := []struct {
		path string
		want int
	}{
		{"/api/v1/open/ping", http.StatusOK},
		{"/api/v1/guarded/ping", http.StatusUnauthorized},
	}
	for _, tt := range tests {
		t.Run(tt.path, func(t *testing.T) {
			res, err := app.Test(httptest.NewRequest(http.MethodGet, tt.path, nil))
			if err != nil {
				t.Fatal(err)
			}
			if res.StatusCode != tt.want {
				t.Errorf("status = %d, want %d", res.StatusCode, tt.want)
			}
		})
	}
}

func TestCORS_AllowsCredentialsForConfiguredOrigin(t *testing.T) {
	app := newTestServer(Config{AllowedOrigins: []string{"http://localhost:5173"}},
		Mount{Prefix: "/open", Routes: pingRoutes{}},
	)

	req := httptest.NewRequest(http.MethodGet, "/api/v1/open/ping", nil)
	req.Header.Set("Origin", "http://localhost:5173")
	res, err := app.Test(req)
	if err != nil {
		t.Fatal(err)
	}

	if got := res.Header.Get("Access-Control-Allow-Credentials"); got != "true" {
		t.Errorf("Access-Control-Allow-Credentials = %q, want true", got)
	}
}

func TestNew_NoOriginsConfigured_DoesNotPanic(t *testing.T) {
	// fiber cors panic ถ้า AllowCredentials=true คู่กับ origin "*" (ค่า default ตอนไม่ได้ตั้ง)
	newTestServer(Config{})
}
