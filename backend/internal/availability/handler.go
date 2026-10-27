package availability

import (
	"errors"
	"time"

	"github.com/gofiber/fiber/v3"

	"WeGoJUAN-backend/internal/auth"
)

type Handler struct {
	svc *Service
}

func NewHandler(svc *Service) *Handler {
	return &Handler{svc: svc}
}

func (h *Handler) RegisterRoutes(r fiber.Router) {
	r.Get("/", h.listMine) // GET /api/v1/availability?from=2026-12-01&to=2026-12-31
	r.Put("/", h.setMarks) // PUT /api/v1/availability  body: [{"day":"2026-12-05","status":"free"|"busy"|null}]
}

type markResponse struct {
	Day    string `json:"day"` // "2026-12-05"
	Status Status `json:"status"`
	Reason string `json:"reason,omitempty"` // ส่วนตัว — endpoint นี้คืนเฉพาะของตัวเอง
}

func (h *Handler) listMine(c fiber.Ctx) error {
	from, err1 := ParseDay(c.Query("from"))
	to, err2 := ParseDay(c.Query("to"))
	if err1 != nil || err2 != nil {
		return fiber.NewError(fiber.StatusBadRequest, "from and to must be YYYY-MM-DD")
	}
	if to.Before(from) || int(to.Sub(from).Hours()/24)+1 > MaxChanges {
		return fiber.NewError(fiber.StatusBadRequest, "range must be 1-366 days")
	}

	marks, err := h.svc.ListByUser(c, auth.UserID(c), from, to)
	if err != nil {
		return err
	}
	resp := make([]markResponse, 0, len(marks))
	for _, m := range marks {
		resp = append(resp, markResponse{Day: m.Day.Format(time.DateOnly), Status: m.Status, Reason: m.Reason})
	}
	return c.JSON(resp)
}

func (h *Handler) setMarks(c fiber.Ctx) error {
	var reqs []ChangeRequest
	if err := c.Bind().Body(&reqs); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid request body")
	}
	set, clear, err := ParseChanges(reqs)
	if err == nil {
		err = h.svc.SetMarks(c, auth.UserID(c), set, clear)
	}
	switch {
	case errors.Is(err, ErrInvalidStatus):
		return fiber.NewError(fiber.StatusUnprocessableEntity, err.Error())
	case errors.Is(err, ErrInvalidDay), errors.Is(err, ErrInvalidReason):
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	case err != nil:
		return err
	}
	return c.SendStatus(fiber.StatusNoContent)
}
