package server

import (
	"context"
	"log/slog"
	"time"

	"github.com/gofiber/fiber/v3"
	"github.com/gofiber/fiber/v3/middleware/cors"
	recoverer "github.com/gofiber/fiber/v3/middleware/recover"
	"github.com/gofiber/fiber/v3/middleware/requestid"
)

type Config struct {
	AllowedOrigins []string
}

type Routes interface {
	RegisterRoutes(r fiber.Router)
}

type Mount struct {
	Prefix     string
	Routes     Routes
	Middleware []fiber.Handler // รันก่อนทุก route ใน prefix นี้ เช่น auth
}

type Pinger interface {
	Ping(ctx context.Context) error
}

func New(cfg Config, logger *slog.Logger, db Pinger, mounts ...Mount) *fiber.App {
	app := fiber.New(fiber.Config{
		AppName:      "wegojuan-api",
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
		ErrorHandler: errorHandler(logger),
	})

	app.Use(recoverer.New())

	app.Get("/healthz", healthHandler(db))

	app.Use(requestid.New())
	app.Use(requestLogger(logger))
	app.Use(cors.New(cors.Config{
		AllowOrigins: cfg.AllowedOrigins,
		// ให้ browser ส่ง auth cookie ข้าม origin ได้ — fiber ห้ามใช้คู่กับ "*" (default ตอนไม่ได้ตั้ง origin)
		AllowCredentials: len(cfg.AllowedOrigins) > 0,
	}))

	api := app.Group("/api/v1")
	for _, m := range mounts {
		g := api.Group(m.Prefix)
		for _, mw := range m.Middleware {
			g.Use(mw)
		}
		m.Routes.RegisterRoutes(g)
	}

	return app
}

func healthHandler(db Pinger) fiber.Handler {
	return func(c fiber.Ctx) error {
		ctx, cancel := context.WithTimeout(c, 2*time.Second)
		defer cancel()
		if err := db.Ping(ctx); err != nil {
			return c.SendStatus(fiber.StatusServiceUnavailable)
		}
		return c.SendStatus(fiber.StatusOK)
	}
}
