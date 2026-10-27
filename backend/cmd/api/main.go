package main

import (
	"context"
	"fmt"
	"log/slog"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gofiber/fiber/v3"

	"WeGoJUAN-backend/internal/auth"
	"WeGoJUAN-backend/internal/availability"
	"WeGoJUAN-backend/internal/config"
	"WeGoJUAN-backend/internal/event"
	"WeGoJUAN-backend/internal/platform/postgres"
	"WeGoJUAN-backend/internal/server"
	"WeGoJUAN-backend/internal/user"
)

func main() {
	if err := run(); err != nil {
		slog.Error("server exited with error", "err", err)
		os.Exit(1)
	}
}

func run() error {
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	// ---------- 1. Config & logger ----------
	cfg, err := config.Load()
	if err != nil {
		return fmt.Errorf("load config: %w", err)
	}

	logger := newLogger(cfg.Env)
	slog.SetDefault(logger)

	// ---------- 2. Infrastructure ----------
	db, err := postgres.New(ctx, cfg.DatabaseURL)
	if err != nil {
		return fmt.Errorf("connect postgres: %w", err)
	}
	defer db.Close() 

	// ---------- 3. Wiring (manual dependency injection) ----------
	authManager, err := auth.NewManager(cfg.JWTSecret, 7*24*time.Hour, cfg.Env != "development")
	if err != nil {
		return fmt.Errorf("init auth: %w", err)
	}
	requireAuth := []fiber.Handler{authManager.Require()}

	userSvc := user.NewService(user.NewRepository(db))
	availabilitySvc := availability.NewService(availability.NewRepository(db))

	eventSvc := event.NewService(event.NewRepository(db), availabilitySvc)

	// ---------- 4. HTTP ----------
	app := server.New(
		server.Config{AllowedOrigins: cfg.AllowedOrigins},
		logger,
		db,
		server.Mount{Prefix: "/users", Routes: user.NewHandler(userSvc, authManager)}, // auth ราย route เพราะ register/login ต้องเปิด
		server.Mount{Prefix: "/availability", Routes: availability.NewHandler(availabilitySvc), Middleware: requireAuth},
		server.Mount{Prefix: "/events", Routes: event.NewHandler(eventSvc), Middleware: requireAuth},
	)

	// ---------- 5. Start & graceful shutdown ----------
	serverErr := make(chan error, 1)
	go func() {
		if err := app.Listen(cfg.HTTPAddr); err != nil {
			serverErr <- err
		}
	}()

	select {
	case err := <-serverErr:
		return fmt.Errorf("http server: %w", err)
	case <-ctx.Done():
		stop()
		logger.Info("shutdown signal received")
	}

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := app.ShutdownWithContext(shutdownCtx); err != nil {
		return fmt.Errorf("graceful shutdown: %w", err)
	}

	logger.Info("server stopped cleanly")
	return nil
}

func newLogger(env string) *slog.Logger {
	if env == "development" {
		return slog.New(slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelDebug}))
	}
	return slog.New(slog.NewJSONHandler(os.Stdout, nil))
}
