package trip

import (
	"cmp"
	"errors"
	"slices"
	"strings"
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
	// User หรือ Guest — service เช็คเองว่าเป็นสมาชิกไหม (คนนอกได้ 404)
	optionalAuth := h.auth.Optional()

	// สร้าง/ดูรายการทริปได้เฉพาะ User (ผู้จัดต้องมีบัญชี, Guest ไม่มีรายการทริป)
	r.Post("/", requireAuth, h.create)
	r.Get("/", requireAuth, h.listMine)
	// route ตายตัวต้องมาก่อน /:id ไม่งั้น "resync" ถูกจับเป็น id
	r.Get("/resync", requireAuth, h.resync) // ?days=2026-12-05,2026-12-06
	r.Get("/:id", optionalAuth, h.getByID)
	r.Get("/:id/marks", optionalAuth, h.marks)
	r.Put("/:id/marks/me", optionalAuth, h.setMyMarks) // body แบบเดียวกับ PUT /availability
	r.Get("/:id/suggestions", optionalAuth, h.suggestions)
	r.Get("/:id/push-preview", optionalAuth, h.pushPreview)
	r.Post("/:id/push", optionalAuth, h.push)
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

type windowResponse struct {
	Start     string      `json:"start"` // "2026-12-05"
	End       string      `json:"end"`
	Available []uuid.UUID `json:"available"` // member ID
	Busy      []uuid.UUID `json:"busy"`
	Unknown   []uuid.UUID `json:"unknown"`
}

type pushDayResponse struct {
	Day            string               `json:"day"`
	TripStatus     *availability.Status `json:"trip_status"` // null = ยังไม่ระบุ
	CalendarStatus *availability.Status `json:"calendar_status"`
}

type pushRequest struct {
	Days []string `json:"days"` // วันที่เลือกให้ทับด้วยปฏิทินส่วนตัว
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

func (h *Handler) suggestions(c fiber.Ctx) error {
	tripID, err := parseTripID(c)
	if err != nil {
		return err
	}
	windows, err := h.svc.Suggestions(c, tripID, viewerFrom(c))
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
			Available: nonNil(w.Available),
			Busy:      nonNil(w.Busy),
			Unknown:   nonNil(w.Unknown),
		})
	}
	return c.JSON(resp)
}

func (h *Handler) resync(c fiber.Ctx) error {
	var days []time.Time
	if q := c.Query("days"); q != "" {
		parts := strings.Split(q, ",")
		if len(parts) > availability.MaxChanges {
			return fiber.NewError(fiber.StatusBadRequest, "too many days")
		}
		for _, p := range parts {
			d, err := availability.ParseDay(p)
			if err != nil {
				return fiber.NewError(fiber.StatusBadRequest, err.Error())
			}
			days = append(days, d)
		}
	}
	trips, err := h.svc.TripsToResync(c, userIDFrom(c), days)
	if err != nil {
		return err
	}
	resp := make([]tripResponse, 0, len(trips))
	for _, t := range trips {
		resp = append(resp, newTripResponse(t))
	}
	return c.JSON(resp)
}

func (h *Handler) pushPreview(c fiber.Ctx) error {
	tripID, err := parseTripID(c)
	if err != nil {
		return err
	}
	days, err := h.svc.PushPreview(c, tripID, viewerFrom(c))
	if err != nil {
		return tripError(err)
	}
	resp := make([]pushDayResponse, 0, len(days))
	for _, d := range days {
		resp = append(resp, pushDayResponse{Day: d.Day.Format(time.DateOnly), TripStatus: d.Trip, CalendarStatus: d.Calendar})
	}
	return c.JSON(resp)
}

func (h *Handler) push(c fiber.Ctx) error {
	tripID, err := parseTripID(c)
	if err != nil {
		return err
	}
	if err := requireJSON(c); err != nil {
		return err
	}
	var req pushRequest
	if err := c.Bind().Body(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid request body")
	}
	days := make([]time.Time, 0, len(req.Days))
	for _, s := range req.Days {
		d, err := availability.ParseDay(s)
		if err != nil {
			return fiber.NewError(fiber.StatusBadRequest, err.Error())
		}
		days = append(days, d)
	}
	if err := h.svc.Push(c, tripID, viewerFrom(c), days); err != nil {
		return tripError(err)
	}
	return c.SendStatus(fiber.StatusNoContent)
}

// tripError แปลง error ของ service เป็น HTTP status ที่ใช้ร่วมกันทุก route ของทริป
func tripError(err error) error {
	switch {
	case errors.Is(err, ErrNotFound):
		return fiber.NewError(fiber.StatusNotFound, err.Error())
	case errors.Is(err, ErrGuestNotAllowed):
		return fiber.NewError(fiber.StatusForbidden, err.Error())
	case errors.Is(err, ErrDayOutOfRange), errors.Is(err, availability.ErrInvalidDay):
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	default:
		return err
	}
}

// requireJSON: body ของ route ที่เปลี่ยนข้อมูลต้องเป็น JSON — form จากเว็บอื่นส่ง JSON ข้าม origin ไม่ได้ถ้าไม่ผ่าน CORS
func requireJSON(c fiber.Ctx) error {
	if !strings.HasPrefix(c.Get(fiber.HeaderContentType), fiber.MIMEApplicationJSON) {
		return fiber.NewError(fiber.StatusUnsupportedMediaType, "request body must be JSON")
	}
	return nil
}

// nonNil ให้ JSON เป็น [] แทน null ฝั่งเว็บจะได้ใช้ .length ได้เลย
func nonNil(ids []uuid.UUID) []uuid.UUID {
	if ids == nil {
		return []uuid.UUID{}
	}
	return ids
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
	v := Viewer{UserID: userIDFrom(c)}
	if t := auth.GuestToken(c); t != "" {
		v.GuestTokenHash = auth.HashGuestToken(t)
	}
	return v
}
