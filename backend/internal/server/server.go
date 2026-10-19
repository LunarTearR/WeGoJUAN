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
	Prefix string
	Routes Routes
}

type Pinger interface {
	Ping(ctx context.Context) error
}

func New(cfg Config, logger *slog.Logger, db Pinger, mounts ...Mount) *fiber.App {
	app := fiber.New(fiber.Config{
		AppName:      "myapp-api",
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
	}))

	api := app.Group("/api/v1")
	for _, m := range mounts {
		m.Routes.RegisterRoutes(api.Group(m.Prefix))
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
