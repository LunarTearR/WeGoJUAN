package server

import (
	"errors"
	"log/slog"
	"time"

	"github.com/gofiber/fiber/v3"
	"github.com/gofiber/fiber/v3/middleware/requestid"
)

func requestLogger(logger *slog.Logger) fiber.Handler {
	return func(c fiber.Ctx) error {
		start := time.Now()
		err := c.Next()

		status := c.Response().StatusCode()
		if err != nil {
			status = statusFromError(err)
		}

		logger.Info("http request",
			"method", c.Method(),
			"path", c.Path(),
			"status", status,
			"duration", time.Since(start),
			"request_id", requestid.FromContext(c),
		)
		return err
	}
}

func errorHandler(logger *slog.Logger) func(fiber.Ctx, error) error {
	return func(c fiber.Ctx, err error) error {
		var fe *fiber.Error
		if errors.As(err, &fe) {
			return c.Status(fe.Code).JSON(fiber.Map{"error": fe.Message})
		}

		logger.Error("unhandled error",
			"method", c.Method(),
			"path", c.Path(),
			"request_id", requestid.FromContext(c),
			"err", err,
		)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "internal server error"})
	}
}

func statusFromError(err error) int {
	var fe *fiber.Error
	if errors.As(err, &fe) {
		return fe.Code
	}
	return fiber.StatusInternalServerError
}
