package event

import (
	"errors"
	"time"

	"github.com/gofiber/fiber/v3"
)

type Handler struct {
	svc *Service
}

func NewHandler(svc *Service) *Handler {
	return &Handler{svc: svc}
}

func (h *Handler) RegisterRoutes(r fiber.Router) {
	r.Post("/", h.create)
	r.Get("/:id", h.getByID)
	r.Get("/:id/suggestions", h.suggestions)
}

type windowResponse struct {
	Start     string   `json:"start"` // "2026-12-05"
	End       string   `json:"end"`
	Available []string `json:"available"`
	Busy      []string `json:"busy"`
	Unknown   []string `json:"unknown"`
}

func (h *Handler) create(c fiber.Ctx) error {
	// TODO: bind body → Event (OwnerID มาจาก auth middleware) แล้วเรียก h.svc.Create
	return fiber.NewError(fiber.StatusNotImplemented, "not implemented")
}

func (h *Handler) getByID(c fiber.Ctx) error {
	// TODO: เรียก h.svc.GetByID แล้วแปลงเป็น response DTO (แบบเดียวกับ user.getByID)
	return fiber.NewError(fiber.StatusNotImplemented, "not implemented")
}

func (h *Handler) suggestions(c fiber.Ctx) error {
	windows, err := h.svc.SuggestDates(c, c.Params("id"))
	if errors.Is(err, ErrNotFound) {
		return fiber.NewError(fiber.StatusNotFound, err.Error())
	}
	if err != nil {
		return err
	}

	resp := make([]windowResponse, 0, len(windows))
	for _, w := range windows {
		resp = append(resp, windowResponse{
			Start:     w.Start.Format(time.DateOnly),
			End:       w.End.Format(time.DateOnly),
			Available: w.Available,
			Busy:      w.Busy,
			Unknown:   w.Unknown,
		})
	}
	return c.JSON(resp)
}
