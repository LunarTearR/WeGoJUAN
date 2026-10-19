package availability

import "github.com/gofiber/fiber/v3"

type Handler struct {
	svc *Service
}

func NewHandler(svc *Service) *Handler {
	return &Handler{svc: svc}
}

func (h *Handler) RegisterRoutes(r fiber.Router) {
	r.Get("/", h.listMine) // GET /api/v1/availability?from=2026-12-01&to=2026-12-31
	r.Put("/", h.setMarks) // PUT /api/v1/availability  body: [{"day":"2026-12-05","status":"free"}]
}

func (h *Handler) listMine(c fiber.Ctx) error {
	// TODO: อ่าน userID จาก auth middleware, parse from/to (time.DateOnly)
	//       แล้วเรียก h.svc.ListByUser
	return fiber.NewError(fiber.StatusNotImplemented, "not implemented")
}

func (h *Handler) setMarks(c fiber.Ctx) error {
	// TODO: bind body → []Mark แล้วเรียก h.svc.SetMarks
	//       errors.Is(err, ErrInvalidStatus) → fiber.StatusUnprocessableEntity
	return fiber.NewError(fiber.StatusNotImplemented, "not implemented")
}
