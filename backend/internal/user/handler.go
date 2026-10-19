package user

import (
	"errors"

	"github.com/gofiber/fiber/v3"
)

type Handler struct {
	svc *Service
}

func NewHandler(svc *Service) *Handler {
	return &Handler{svc: svc}
}

func (h *Handler) RegisterRoutes(r fiber.Router) {
	r.Get("/:id", h.getByID)
}

type userResponse struct {
	ID          string `json:"id"`
	DisplayName string `json:"display_name"`
}

func (h *Handler) getByID(c fiber.Ctx) error {
	u, err := h.svc.GetByID(c, c.Params("id"))
	if errors.Is(err, ErrNotFound) {
		return fiber.NewError(fiber.StatusNotFound, err.Error())
	}
	if err != nil {
		return err
	}
	return c.JSON(userResponse{ID: u.ID, DisplayName: u.DisplayName})
}
