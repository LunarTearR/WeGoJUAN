package trip

import (
	"errors"
	"time"

	"github.com/gofiber/fiber/v3"
	"github.com/google/uuid"

	"WeGoJUAN-backend/internal/auth"
)

// InviteHandler ดูแล /invites/:code — หน้าแรกที่คนได้ลิงก์เชิญเปิดเจอ
type InviteHandler struct {
	svc  *Service
	auth *auth.Manager
}

func NewInviteHandler(svc *Service, auth *auth.Manager) *InviteHandler {
	return &InviteHandler{svc: svc, auth: auth}
}

func (h *InviteHandler) RegisterRoutes(r fiber.Router) {
	r.Get("/:code", h.auth.Optional(), h.preview)
	// ไม่ได้ login = เข้าร่วมแบบ Guest
	r.Post("/:code/join", h.auth.Optional(), h.join)
}

// inviteResponse ตั้งใจไม่มีสมาชิกหรือ Mark — คนนอกเห็นแค่ว่าเป็นทริปอะไร
type inviteResponse struct {
	TripID       uuid.UUID `json:"trip_id"`
	Title        string    `json:"title"`
	StartDate    string    `json:"start_date"`
	EndDate      string    `json:"end_date"`
	DurationDays int       `json:"duration_days"`
	IsMember     bool      `json:"is_member"`
}

type joinRequest struct {
	DisplayName string `json:"display_name"` // User: ว่างได้ = ใช้ชื่อบัญชี, Guest: ต้องมี
}

type joinResponse struct {
	TripID uuid.UUID      `json:"trip_id"`
	Member memberResponse `json:"member"`
}

func (h *InviteHandler) preview(c fiber.Ctx) error {
	t, isMember, err := h.svc.Preview(c, c.Params("code"), viewerFrom(c))
	if errors.Is(err, ErrNotFound) {
		return fiber.NewError(fiber.StatusNotFound, "invite link not found")
	}
	if err != nil {
		return err
	}
	return c.JSON(inviteResponse{
		TripID:       t.ID,
		Title:        t.Title,
		StartDate:    t.StartDate.Format(time.DateOnly),
		EndDate:      t.EndDate.Format(time.DateOnly),
		DurationDays: t.DurationDays,
		IsMember:     isMember,
	})
}

func (h *InviteHandler) join(c fiber.Ctx) error {
	var req joinRequest
	if len(c.Body()) > 0 {
		if err := c.Bind().Body(&req); err != nil {
			return fiber.NewError(fiber.StatusBadRequest, "invalid request body")
		}
	}

	t, m, err := h.joinAsUserOrGuest(c, req.DisplayName)
	switch {
	case errors.Is(err, ErrNotFound):
		return fiber.NewError(fiber.StatusNotFound, "invite link not found")
	case errors.Is(err, ErrInvalidDisplayName):
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	case errors.Is(err, ErrDisplayNameTaken):
		return fiber.NewError(fiber.StatusConflict, err.Error())
	case err != nil:
		return err
	}
	return c.JSON(joinResponse{TripID: t.ID, Member: newMemberResponse(t, m)})
}

func (h *InviteHandler) joinAsUserOrGuest(c fiber.Ctx, displayName string) (Trip, Member, error) {
	if userID := userIDFrom(c); userID != uuid.Nil {
		return h.svc.JoinAsUser(c, c.Params("code"), userID, displayName)
	}
	token, err := h.auth.EnsureGuestToken(c)
	if err != nil {
		return Trip{}, Member{}, err
	}
	return h.svc.JoinAsGuest(c, c.Params("code"), auth.HashGuestToken(token), displayName)
}
