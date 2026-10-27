package trip

import (
	"errors"
	"time"

	"github.com/gofiber/fiber/v3"
	"github.com/google/uuid"

	"WeGoJUAN-backend/internal/auth"
)

type Handler struct {
	svc  *Service
	auth *auth.Manager
}

func NewHandler(svc *Service, auth *auth.Manager) *Handler {
	return &Handler{svc: svc, auth: auth}
}

func (h *Handler) RegisterRoutes(r fiber.Router) {
	requireAuth := h.auth.Require()

	r.Post("/", requireAuth, h.create)
	r.Get("/", requireAuth, h.listMine)
	r.Get("/:id", requireAuth, h.getByID)
}

type createTripRequest struct {
	Title        string `json:"title"`
	StartDate    string `json:"start_date"` // "2026-12-01"
	EndDate      string `json:"end_date"`
	DurationDays int    `json:"duration_days"`
}

type tripResponse struct {
	ID           uuid.UUID `json:"id"`
	Title        string    `json:"title"`
	StartDate    string    `json:"start_date"`
	EndDate      string    `json:"end_date"`
	DurationDays int       `json:"duration_days"`
	OrganizerID  uuid.UUID `json:"organizer_id"`
	InviteCode   string    `json:"invite_code"`
}

type memberResponse struct {
	ID          uuid.UUID `json:"id"`
	DisplayName string    `json:"display_name"`
	IsOrganizer bool      `json:"is_organizer"`
	IsGuest     bool      `json:"is_guest"`
}

type detailResponse struct {
	Trip    tripResponse     `json:"trip"`
	Members []memberResponse `json:"members"`
	Me      memberResponse   `json:"me"`
}

func newTripResponse(t Trip) tripResponse {
	return tripResponse{
		ID:           t.ID,
		Title:        t.Title,
		StartDate:    t.StartDate.Format(time.DateOnly),
		EndDate:      t.EndDate.Format(time.DateOnly),
		DurationDays: t.DurationDays,
		OrganizerID:  t.OrganizerID,
		InviteCode:   t.InviteCode,
	}
}

func newMemberResponse(t Trip, m Member) memberResponse {
	return memberResponse{
		ID:          m.ID,
		DisplayName: m.DisplayName,
		IsOrganizer: !m.IsGuest() && m.UserID == t.OrganizerID,
		IsGuest:     m.IsGuest(),
	}
}

func (h *Handler) create(c fiber.Ctx) error {
	var req createTripRequest
	if err := c.Bind().Body(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid request body")
	}
	start, err1 := time.Parse(time.DateOnly, req.StartDate)
	end, err2 := time.Parse(time.DateOnly, req.EndDate)
	if err1 != nil || err2 != nil {
		return fiber.NewError(fiber.StatusBadRequest, "start_date and end_date must be YYYY-MM-DD")
	}

	t, err := h.svc.Create(c, h.userID(c), NewTrip{
		Title:        req.Title,
		StartDate:    start,
		EndDate:      end,
		DurationDays: req.DurationDays,
	})
	if errors.Is(err, ErrInvalidTrip) {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}
	if err != nil {
		return err
	}
	return c.Status(fiber.StatusCreated).JSON(newTripResponse(t))
}

func (h *Handler) listMine(c fiber.Ctx) error {
	trips, err := h.svc.ListMine(c, h.userID(c))
	if err != nil {
		return err
	}
	resp := make([]tripResponse, 0, len(trips))
	for _, t := range trips {
		resp = append(resp, newTripResponse(t))
	}
	return c.JSON(resp)
}

func (h *Handler) getByID(c fiber.Ctx) error {
	tripID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return fiber.NewError(fiber.StatusNotFound, ErrNotFound.Error())
	}

	d, err := h.svc.Get(c, tripID, h.viewer(c))
	if errors.Is(err, ErrNotFound) {
		return fiber.NewError(fiber.StatusNotFound, err.Error())
	}
	if err != nil {
		return err
	}

	members := make([]memberResponse, 0, len(d.Members))
	for _, m := range d.Members {
		members = append(members, newMemberResponse(d.Trip, m))
	}
	return c.JSON(detailResponse{
		Trip:    newTripResponse(d.Trip),
		Members: members,
		Me:      newMemberResponse(d.Trip, d.Me),
	})
}

// userID ของคนที่ login อยู่ — ใช้ได้เฉพาะ route ที่ผ่าน Require (token ที่เราออกเองจึง parse ได้เสมอ)
func (h *Handler) userID(c fiber.Ctx) uuid.UUID {
	id, _ := uuid.Parse(auth.UserID(c))
	return id
}

func (h *Handler) viewer(c fiber.Ctx) Viewer {
	return Viewer{UserID: h.userID(c)}
}
