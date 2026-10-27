package trip

import (
	"cmp"
	"errors"
	"slices"
	"time"

	"github.com/gofiber/fiber/v3"
	"github.com/google/uuid"

	"WeGoJUAN-backend/internal/auth"
	"WeGoJUAN-backend/internal/availability"
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
	r.Get("/:id/marks", requireAuth, h.marks)
	r.Put("/:id/marks/me", requireAuth, h.setMyMarks) // body แบบเดียวกับ PUT /availability
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

type markResponse struct {
	MemberID uuid.UUID           `json:"member_id"`
	Day      string              `json:"day"`
	Status   availability.Status `json:"status"`
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

	t, err := h.svc.Create(c, userIDFrom(c), NewTrip{
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
	trips, err := h.svc.ListMine(c, userIDFrom(c))
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
	tripID, err := parseTripID(c)
	if err != nil {
		return err
	}

	d, err := h.svc.Get(c, tripID, viewerFrom(c))
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

func (h *Handler) marks(c fiber.Ctx) error {
	tripID, err := parseTripID(c)
	if err != nil {
		return err
	}
	byMember, err := h.svc.Marks(c, tripID, viewerFrom(c))
	if errors.Is(err, ErrNotFound) {
		return fiber.NewError(fiber.StatusNotFound, err.Error())
	}
	if err != nil {
		return err
	}

	resp := []markResponse{}
	for memberID, marks := range byMember {
		for _, m := range marks {
			resp = append(resp, markResponse{MemberID: memberID, Day: m.Day.Format(time.DateOnly), Status: m.Status})
		}
	}
	// map วนไม่เป็นลำดับ — เรียงให้ผลลัพธ์คงที่
	slices.SortFunc(resp, func(a, b markResponse) int {
		return cmp.Or(cmp.Compare(a.Day, b.Day), cmp.Compare(a.MemberID.String(), b.MemberID.String()))
	})
	return c.JSON(resp)
}

func (h *Handler) setMyMarks(c fiber.Ctx) error {
	tripID, err := parseTripID(c)
	if err != nil {
		return err
	}
	var reqs []availability.ChangeRequest
	if err := c.Bind().Body(&reqs); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid request body")
	}
	set, clear, err := availability.ParseChanges(reqs)
	if err == nil {
		err = h.svc.SetMyMarks(c, tripID, viewerFrom(c), set, clear)
	}
	switch {
	case errors.Is(err, ErrNotFound):
		return fiber.NewError(fiber.StatusNotFound, err.Error())
	case errors.Is(err, availability.ErrInvalidStatus):
		return fiber.NewError(fiber.StatusUnprocessableEntity, err.Error())
	case errors.Is(err, availability.ErrInvalidDay), errors.Is(err, ErrDayOutOfRange):
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	case err != nil:
		return err
	}
	return c.SendStatus(fiber.StatusNoContent)
}

// parseTripID: id ที่ไม่ใช่ UUID ตอบ 404 เหมือนไม่มีทริปนี้
func parseTripID(c fiber.Ctx) (uuid.UUID, error) {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return uuid.Nil, fiber.NewError(fiber.StatusNotFound, ErrNotFound.Error())
	}
	return id, nil
}

// userIDFrom คืน userID ของคนที่ login อยู่ หรือ uuid.Nil ถ้าไม่ได้ login (route ที่ใช้ Optional)
func userIDFrom(c fiber.Ctx) uuid.UUID {
	id, _ := uuid.Parse(auth.UserID(c))
	return id
}

func viewerFrom(c fiber.Ctx) Viewer {
	return Viewer{UserID: userIDFrom(c)}
}
