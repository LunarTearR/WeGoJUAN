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
	r.Post("/claim-guest", requireAuth, h.claimGuest)
	r.Get("/:id", optionalAuth, h.getByID)
	r.Patch("/:id", optionalAuth, h.updateDates)
	r.Delete("/:id", optionalAuth, h.deleteTrip)
	r.Delete("/:id/members/me", optionalAuth, h.leave) // ต้องมาก่อน /:memberId ไม่งั้น "me" ถูกจับเป็น id
	r.Delete("/:id/members/:memberId", optionalAuth, h.removeMember)
	r.Post("/:id/invite-link", optionalAuth, h.replaceInviteLink)
	r.Get("/:id/marks", optionalAuth, h.marks)
	r.Put("/:id/marks/me", optionalAuth, h.setMyMarks) // body แบบเดียวกับ PUT /availability
	r.Get("/:id/suggestions", optionalAuth, h.suggestions)
	r.Get("/:id/push-preview", optionalAuth, h.pushPreview)
	r.Post("/:id/push", optionalAuth, h.push)
	r.Put("/:id/confirmed", optionalAuth, h.confirm)
	r.Delete("/:id/confirmed", optionalAuth, h.clearConfirmed)
	r.Post("/:id/confirmed-offer", optionalAuth, h.answerConfirmedOffer)
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
	// null ทั้งคู่ = กำลังหาวัน
	ConfirmedStart *string `json:"confirmed_start"`
	ConfirmedEnd   *string `json:"confirmed_end"`
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
	Prompts promptsResponse  `json:"prompts"`
}

type promptsResponse struct {
	Repush         bool `json:"repush"`
	ConfirmedOffer bool `json:"confirmed_offer"`
}

type confirmedOfferRequest struct {
	Accept bool   `json:"accept"`
	Start  string `json:"start"` // Confirmed Dates (วันเริ่ม) ที่ User เห็นตอนตอบ
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
	CalendarReason string               `json:"calendar_reason,omitempty"` // Reason ของตัวเอง เห็นแค่เจ้าของ
}

type updateDatesRequest struct {
	StartDate    string `json:"start_date"`
	EndDate      string `json:"end_date"`
	DurationDays int    `json:"duration_days"`
}

type confirmRequest struct {
	Start string `json:"start"` // วันแรกของ Window ที่เลือก
}

type pushRequest struct {
	Days []string `json:"days"` // วันที่เลือกให้ทับด้วยปฏิทินส่วนตัว
}

func newTripResponse(t Trip) tripResponse {
	return tripResponse{
		ID:             t.ID,
		Title:          t.Title,
		StartDate:      t.StartDate.Format(time.DateOnly),
		EndDate:        t.EndDate.Format(time.DateOnly),
		DurationDays:   t.DurationDays,
		OrganizerID:    t.OrganizerID,
		InviteCode:     t.InviteCode,
		ConfirmedStart: dateOrNil(t.ConfirmedStart),
		ConfirmedEnd:   dateOrNil(t.ConfirmedEnd()),
	}
}

func dateOrNil(d *time.Time) *string {
	if d == nil {
		return nil
	}
	s := d.Format(time.DateOnly)
	return &s
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
		Prompts: promptsResponse{Repush: d.Prompts.Repush, ConfirmedOffer: d.Prompts.ConfirmedOffer},
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
	// Mark ในทริปไม่มี Reason — ทิ้งก่อน parse เลย จะได้ไม่มีกรณี Reason ผิดรูปแบบทำให้ request ล้ม
	// (Reason อยู่ได้แค่ในปฏิทินส่วนตัว)
	for i := range reqs {
		reqs[i].Reason = nil
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

// claimGuest: เว็บเรียกหลัง login/สมัคร — ไม่ต้องมี body (cookie session แบบ Lax ไม่ถูกส่งจาก POST ข้ามเว็บอยู่แล้ว)
func (h *Handler) claimGuest(c fiber.Ctx) error {
	hash := ""
	if t := auth.GuestToken(c); t != "" {
		hash = auth.HashGuestToken(t)
	}
	n, err := h.svc.ClaimGuestMemberships(c, userIDFrom(c), hash)
	if err != nil {
		return err
	}
	return c.JSON(fiber.Map{"claimed": n})
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
		resp = append(resp, pushDayResponse{Day: d.Day.Format(time.DateOnly), TripStatus: d.Trip, CalendarStatus: d.Calendar, CalendarReason: d.CalendarReason})
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

func (h *Handler) updateDates(c fiber.Ctx) error {
	tripID, err := parseTripID(c)
	if err != nil {
		return err
	}
	if err := requireJSON(c); err != nil {
		return err
	}
	var req updateDatesRequest
	if err := c.Bind().Body(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid request body")
	}
	start, err1 := availability.ParseDay(req.StartDate)
	end, err2 := availability.ParseDay(req.EndDate)
	if err1 != nil || err2 != nil {
		return fiber.NewError(fiber.StatusBadRequest, "start_date and end_date must be YYYY-MM-DD")
	}
	t, err := h.svc.UpdateDates(c, tripID, viewerFrom(c), DatesUpdate{StartDate: start, EndDate: end, DurationDays: req.DurationDays})
	if err != nil {
		return tripError(err)
	}
	return c.JSON(newTripResponse(t))
}

func (h *Handler) deleteTrip(c fiber.Ctx) error {
	tripID, err := parseTripID(c)
	if err != nil {
		return err
	}
	if err := h.svc.Delete(c, tripID, viewerFrom(c)); err != nil {
		return tripError(err)
	}
	return c.SendStatus(fiber.StatusNoContent)
}

func (h *Handler) leave(c fiber.Ctx) error {
	tripID, err := parseTripID(c)
	if err != nil {
		return err
	}
	if err := h.svc.Leave(c, tripID, viewerFrom(c)); err != nil {
		return tripError(err)
	}
	return c.SendStatus(fiber.StatusNoContent)
}

func (h *Handler) removeMember(c fiber.Ctx) error {
	tripID, err := parseTripID(c)
	if err != nil {
		return err
	}
	memberID, err := uuid.Parse(c.Params("memberId"))
	if err != nil {
		return fiber.NewError(fiber.StatusNotFound, "member not found")
	}
	if err := h.svc.RemoveMember(c, tripID, viewerFrom(c), memberID); err != nil {
		return tripError(err)
	}
	return c.SendStatus(fiber.StatusNoContent)
}

func (h *Handler) replaceInviteLink(c fiber.Ctx) error {
	tripID, err := parseTripID(c)
	if err != nil {
		return err
	}
	code, err := h.svc.ReplaceInviteLink(c, tripID, viewerFrom(c))
	if err != nil {
		return tripError(err)
	}
	return c.JSON(fiber.Map{"invite_code": code})
}

func (h *Handler) confirm(c fiber.Ctx) error {
	tripID, err := parseTripID(c)
	if err != nil {
		return err
	}
	if err := requireJSON(c); err != nil {
		return err
	}
	var req confirmRequest
	if err := c.Bind().Body(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid request body")
	}
	start, err := availability.ParseDay(req.Start)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}
	t, err := h.svc.Confirm(c, tripID, viewerFrom(c), start)
	if err != nil {
		return tripError(err)
	}
	return c.JSON(newTripResponse(t))
}

func (h *Handler) clearConfirmed(c fiber.Ctx) error {
	tripID, err := parseTripID(c)
	if err != nil {
		return err
	}
	if err := h.svc.ClearConfirmed(c, tripID, viewerFrom(c)); err != nil {
		return tripError(err)
	}
	return c.SendStatus(fiber.StatusNoContent)
}

func (h *Handler) answerConfirmedOffer(c fiber.Ctx) error {
	tripID, err := parseTripID(c)
	if err != nil {
		return err
	}
	if err := requireJSON(c); err != nil {
		return err
	}
	var req confirmedOfferRequest
	if err := c.Bind().Body(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid request body")
	}
	shownStart, err := availability.ParseDay(req.Start)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}
	if err := h.svc.AnswerConfirmedOffer(c, tripID, viewerFrom(c), req.Accept, shownStart); err != nil {
		return tripError(err)
	}
	return c.SendStatus(fiber.StatusNoContent)
}

// tripError แปลง error ของ service เป็น HTTP status ที่ใช้ร่วมกันทุก route ของทริป
func tripError(err error) error {
	switch {
	case errors.Is(err, ErrNotFound):
		return fiber.NewError(fiber.StatusNotFound, err.Error())
	case errors.Is(err, ErrConfirmedChanged):
		return fiber.NewError(fiber.StatusConflict, err.Error())
	case errors.Is(err, ErrGuestNotAllowed), errors.Is(err, ErrNotOrganizer):
		return fiber.NewError(fiber.StatusForbidden, err.Error())
	case errors.Is(err, ErrInvalidWindow), errors.Is(err, ErrNotConfirmed), errors.Is(err, ErrInvalidTrip),
		errors.Is(err, ErrCannotRemoveSelf), errors.Is(err, ErrOrganizerCannotLeave):
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
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
