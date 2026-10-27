package trip

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"errors"
	"fmt"
	"strings"
	"time"
	"unicode/utf8"

	"github.com/google/uuid"

	"WeGoJUAN-backend/internal/availability"
)

const (
	maxTitleRunes       = 100
	maxRangeDays        = 365
	maxDisplayNameRunes = 50
)

type Repository interface {
	// Create insert ทริปและแถวสมาชิกของผู้จัดใน transaction เดียว (ชื่อเอาจาก users.display_name)
	Create(ctx context.Context, t Trip) (Trip, error)
	FindByID(ctx context.Context, id uuid.UUID) (Trip, error)
	// ListByUser คืนทริปที่ user เป็นสมาชิก ใหม่สุดก่อน
	ListByUser(ctx context.Context, userID uuid.UUID) ([]Trip, error)
	// FindMember คืนสมาชิกของ viewer ในทริปนี้ หรือ ErrNotFound ถ้าไม่ได้เป็นสมาชิก
	FindMember(ctx context.Context, tripID uuid.UUID, v Viewer) (Member, error)
	// Members เรียงตามเวลาเข้าร่วม
	Members(ctx context.Context, tripID uuid.UUID) ([]Member, error)
	FindByInviteCode(ctx context.Context, code string) (Trip, error)
	// AddUserMember: displayName "" = ใช้ users.display_name; ชื่อชนในทริป → ErrDisplayNameTaken
	AddUserMember(ctx context.Context, tripID, userID uuid.UUID, displayName string) (Member, error)
	// AddGuestMember: ชื่อชนในทริป → ErrDisplayNameTaken
	AddGuestMember(ctx context.Context, tripID uuid.UUID, guestTokenHash, displayName string) (Member, error)
	// ListMarks คืน member ID → Mark ของคนนั้น เฉพาะวันใน Date Range
	ListMarks(ctx context.Context, tripID uuid.UUID) (map[uuid.UUID][]availability.Mark, error)
	// SaveMarks ตั้ง Mark ใน set และลบวันใน clear ของสมาชิกคนเดียว ใน transaction เดียว
	SaveMarks(ctx context.Context, memberID uuid.UUID, set []availability.Mark, clear []time.Time) error
	SetPushedAt(ctx context.Context, memberID uuid.UUID, at time.Time) error
	// SetConfirmed: nil = ยกเลิก Confirmed Dates
	SetConfirmed(ctx context.Context, tripID uuid.UUID, start *time.Time) error
	// UpdateDates บันทึกวัน, Duration, Confirmed Dates และ DateRangeChangedAt ใน UPDATE เดียว
	UpdateDates(ctx context.Context, t Trip) (Trip, error)
	SetInviteCode(ctx context.Context, tripID uuid.UUID, code string) error
	// DeleteMember: ErrNotFound ถ้าไม่มีสมาชิกคนนี้ในทริปนี้
	DeleteMember(ctx context.Context, tripID, memberID uuid.UUID) error
	Delete(ctx context.Context, tripID uuid.UUID) error
	SetOfferAnswered(ctx context.Context, memberID uuid.UUID, start time.Time) error
	// ListPushedOverlapping คืนทริปที่ User คนนี้เคย Push และ Date Range มีวันใดวันหนึ่งใน days
	ListPushedOverlapping(ctx context.Context, userID uuid.UUID, days []time.Time) ([]Trip, error)
}

// Calendar คือปฏิทินส่วนตัวของ User (availability.Service) — ทริปแตะได้เฉพาะตอนเจ้าของกดเอง (Push)
// ไม่เคยอ่านสดๆ มาคำนวณ ดู docs/adr/0001
type Calendar interface {
	ListByUser(ctx context.Context, userID string, from, to time.Time) ([]availability.Mark, error)
	SetMarks(ctx context.Context, userID string, set []availability.Mark, clear []time.Time) error
}

type Service struct {
	repo Repository
	cal  Calendar
	now  func() time.Time // test เปลี่ยนเพื่อกำหนด "วันนี้"
}

func NewService(repo Repository, cal Calendar) *Service {
	return &Service{repo: repo, cal: cal, now: time.Now}
}

func (s *Service) Create(ctx context.Context, organizerID uuid.UUID, in NewTrip) (Trip, error) {
	in.Title = strings.TrimSpace(in.Title)
	if err := validateNewTrip(in, Today(s.now())); err != nil {
		return Trip{}, err
	}

	code, err := newInviteCode()
	if err != nil {
		return Trip{}, err
	}
	return s.repo.Create(ctx, Trip{
		OrganizerID:  organizerID,
		Title:        in.Title,
		StartDate:    in.StartDate,
		EndDate:      in.EndDate,
		DurationDays: in.DurationDays,
		InviteCode:   code,
	})
}

func (s *Service) ListMine(ctx context.Context, userID uuid.UUID) ([]Trip, error) {
	return s.repo.ListByUser(ctx, userID)
}

// Get คืนทริปเฉพาะสมาชิก — คนนอกได้ ErrNotFound เหมือนไม่มีทริปนี้
func (s *Service) Get(ctx context.Context, tripID uuid.UUID, v Viewer) (Detail, error) {
	me, err := s.findMember(ctx, tripID, v)
	if err != nil {
		return Detail{}, err
	}
	t, err := s.repo.FindByID(ctx, tripID)
	if err != nil {
		return Detail{}, err
	}
	members, err := s.repo.Members(ctx, tripID)
	if err != nil {
		return Detail{}, err
	}
	return Detail{Trip: t, Members: members, Me: me, Prompts: promptsFor(t, me)}, nil
}

func promptsFor(t Trip, me Member) Prompts {
	if me.IsGuest() {
		return Prompts{} // Guest ไม่มีปฏิทินส่วนตัว
	}
	offer := t.ConfirmedStart != nil && (me.OfferAnsweredStart == nil || !me.OfferAnsweredStart.Equal(*t.ConfirmedStart))
	repush := me.PushedAt != nil && t.DateRangeChangedAt != nil && t.DateRangeChangedAt.After(*me.PushedAt)
	return Prompts{Repush: repush, ConfirmedOffer: offer}
}

// UpdateDates แก้ Date Range / Duration — ผู้จัดเท่านั้น
// Confirmed Dates ที่ไม่พอดีกับช่วงใหม่ถูกยกเลิกในการแก้ครั้งเดียวกัน; ขยายช่วง (มีวันใหม่) = ชวนคนที่เคย Push ให้ Push อีกครั้ง
func (s *Service) UpdateDates(ctx context.Context, tripID uuid.UUID, v Viewer, in DatesUpdate) (Trip, error) {
	t, _, err := s.asOrganizer(ctx, tripID, v)
	if err != nil {
		return Trip{}, err
	}
	// วันเริ่มที่ผ่านไปแล้วคงไว้ได้ (ทริปเริ่มไปแล้ว) แต่ห้ามเลื่อนวันเริ่มไปเป็นอดีต
	today := Today(s.now())
	if in.StartDate.Equal(t.StartDate) && in.StartDate.Before(today) {
		today = in.StartDate
	}
	if err := validateNewTrip(NewTrip{Title: t.Title, StartDate: in.StartDate, EndDate: in.EndDate, DurationDays: in.DurationDays}, today); err != nil {
		return Trip{}, err
	}

	addsDays := in.StartDate.Before(t.StartDate) || in.EndDate.After(t.EndDate)
	t.StartDate, t.EndDate, t.DurationDays = in.StartDate, in.EndDate, in.DurationDays
	if t.ConfirmedStart != nil && !t.windowFits(*t.ConfirmedStart) {
		t.ConfirmedStart = nil
	}
	if addsDays {
		now := s.now()
		t.DateRangeChangedAt = &now
	}
	return s.repo.UpdateDates(ctx, t)
}

// AnswerConfirmedOffer: accept = เขียนไม่ว่างทุกวันใน Confirmed Dates ลงปฏิทินส่วนตัว (User ยินยอมเอง)
// ตอบแล้วไม่ถามซ้ำจนกว่าผู้จัดจะเปลี่ยนวัน — ไม่เคยลบไม่ว่างเดิมออก
func (s *Service) AnswerConfirmedOffer(ctx context.Context, tripID uuid.UUID, v Viewer, accept bool) error {
	me, err := s.findMember(ctx, tripID, v)
	if err != nil {
		return err
	}
	if me.IsGuest() {
		return ErrGuestNotAllowed
	}
	t, err := s.repo.FindByID(ctx, tripID)
	if err != nil {
		return err
	}
	if t.ConfirmedStart == nil {
		return ErrNotConfirmed
	}
	if accept {
		var busy []availability.Mark
		for d := *t.ConfirmedStart; !d.After(*t.ConfirmedEnd()); d = d.AddDate(0, 0, 1) {
			busy = append(busy, availability.Mark{Day: d, Status: availability.StatusBusy})
		}
		if err := s.cal.SetMarks(ctx, me.UserID.String(), busy, nil); err != nil {
			return err
		}
	}
	return s.repo.SetOfferAnswered(ctx, me.ID, *t.ConfirmedStart)
}

// Preview คืนข้อมูลทริปจากลิงก์เชิญ ให้คนที่ยังไม่ได้เข้าร่วมเห็นว่ากำลังจะเข้าทริปอะไร (ไม่มี Mark/สมาชิก)
func (s *Service) Preview(ctx context.Context, code string, v Viewer) (Trip, bool, error) {
	t, err := s.repo.FindByInviteCode(ctx, code)
	if err != nil {
		return Trip{}, false, err
	}
	_, err = s.findMember(ctx, t.ID, v)
	switch {
	case err == nil:
		return t, true, nil
	case errors.Is(err, ErrNotFound):
		return t, false, nil
	default:
		return Trip{}, false, err
	}
}

// JoinAsUser เข้าร่วมทริปทันทีไม่ต้องรออนุมัติ — เป็นสมาชิกอยู่แล้วก็คืนสมาชิกเดิม
func (s *Service) JoinAsUser(ctx context.Context, code string, v Viewer, displayName string) (Trip, Member, error) {
	displayName = strings.TrimSpace(displayName)
	if displayName != "" {
		if err := validateDisplayName(displayName); err != nil {
			return Trip{}, Member{}, err
		}
	}

	t, err := s.repo.FindByInviteCode(ctx, code)
	if err != nil {
		return Trip{}, Member{}, err
	}
	m, err := s.findMember(ctx, t.ID, v)
	if err == nil {
		return t, m, nil
	}
	if !errors.Is(err, ErrNotFound) {
		return Trip{}, Member{}, err
	}
	m, err = s.repo.AddUserMember(ctx, t.ID, v.UserID, displayName)
	return t, m, err
}

// Marks คืน Mark ของทุกสมาชิก — สมาชิกเห็นของกันและกันทั้งหมด คนนอกได้ ErrNotFound
func (s *Service) Marks(ctx context.Context, tripID uuid.UUID, v Viewer) (map[uuid.UUID][]availability.Mark, error) {
	if _, err := s.findMember(ctx, tripID, v); err != nil {
		return nil, err
	}
	return s.repo.ListMarks(ctx, tripID)
}

// SetMyMarks แก้ Mark ของตัวเองในทริป (แก้ได้แค่ของตัวเอง และเฉพาะวันใน Date Range)
func (s *Service) SetMyMarks(ctx context.Context, tripID uuid.UUID, v Viewer, set []availability.Mark, clear []time.Time) error {
	me, err := s.findMember(ctx, tripID, v)
	if err != nil {
		return err
	}
	t, err := s.repo.FindByID(ctx, tripID)
	if err != nil {
		return err
	}
	for _, m := range set {
		if !m.Status.Valid() {
			return fmt.Errorf("%w: %q", availability.ErrInvalidStatus, m.Status)
		}
		if !t.inDateRange(m.Day) {
			return fmt.Errorf("%w: %s", ErrDayOutOfRange, m.Day.Format(time.DateOnly))
		}
	}
	for _, d := range clear {
		if !t.inDateRange(d) {
			return fmt.Errorf("%w: %s", ErrDayOutOfRange, d.Format(time.DateOnly))
		}
	}
	return s.repo.SaveMarks(ctx, me.ID, set, clear)
}

// JoinAsGuest เข้าร่วมโดยไม่มีบัญชี ต้องตั้งชื่อเสมอ — เครื่องเดิมเข้าซ้ำได้สมาชิกคนเดิม
func (s *Service) JoinAsGuest(ctx context.Context, code, guestTokenHash, displayName string) (Trip, Member, error) {
	displayName = strings.TrimSpace(displayName)
	if err := validateDisplayName(displayName); err != nil {
		return Trip{}, Member{}, err
	}

	t, err := s.repo.FindByInviteCode(ctx, code)
	if err != nil {
		return Trip{}, Member{}, err
	}
	m, err := s.repo.FindMember(ctx, t.ID, Viewer{GuestTokenHash: guestTokenHash})
	if err == nil {
		return t, m, nil
	}
	if !errors.Is(err, ErrNotFound) {
		return Trip{}, Member{}, err
	}
	m, err = s.repo.AddGuestMember(ctx, t.ID, guestTokenHash, displayName)
	return t, m, err
}

// Suggestions จัดอันดับ Window จาก Mark ในทริป — Window ที่เริ่มก่อนวันนี้ไม่แนะนำ
func (s *Service) Suggestions(ctx context.Context, tripID uuid.UUID, v Viewer) ([]Window, error) {
	if _, err := s.findMember(ctx, tripID, v); err != nil {
		return nil, err
	}
	t, err := s.repo.FindByID(ctx, tripID)
	if err != nil {
		return nil, err
	}
	members, err := s.repo.Members(ctx, tripID)
	if err != nil {
		return nil, err
	}
	marks, err := s.repo.ListMarks(ctx, tripID)
	if err != nil {
		return nil, err
	}

	from := t.StartDate
	if today := Today(s.now()); today.After(from) {
		from = today
	}
	ids := make([]uuid.UUID, len(members))
	for i, m := range members {
		ids[i] = m.ID
	}
	return SuggestWindows(ids, marks, from, t.EndDate, t.DurationDays), nil
}

// Confirm ตั้ง Confirmed Dates เป็น Window ที่เริ่ม start — ผู้จัดเท่านั้น
func (s *Service) Confirm(ctx context.Context, tripID uuid.UUID, v Viewer, start time.Time) (Trip, error) {
	t, _, err := s.asOrganizer(ctx, tripID, v)
	if err != nil {
		return Trip{}, err
	}
	if !t.isValidWindow(start, Today(s.now())) {
		return Trip{}, ErrInvalidWindow
	}
	if err := s.repo.SetConfirmed(ctx, tripID, &start); err != nil {
		return Trip{}, err
	}
	t.ConfirmedStart = &start
	return t, nil
}

// ClearConfirmed ยกเลิก Confirmed Dates → ทริปกลับไปเป็นกำลังหาวัน
func (s *Service) ClearConfirmed(ctx context.Context, tripID uuid.UUID, v Viewer) error {
	if _, _, err := s.asOrganizer(ctx, tripID, v); err != nil {
		return err
	}
	return s.repo.SetConfirmed(ctx, tripID, nil)
}

// asOrganizer คืนทริปและสมาชิกของผู้จัดถ้า viewer เป็นผู้จัด — สมาชิกคนอื่นได้ ErrNotOrganizer คนนอกได้ ErrNotFound
func (s *Service) asOrganizer(ctx context.Context, tripID uuid.UUID, v Viewer) (Trip, Member, error) {
	me, err := s.findMember(ctx, tripID, v)
	if err != nil {
		return Trip{}, Member{}, err
	}
	t, err := s.repo.FindByID(ctx, tripID)
	if err != nil {
		return Trip{}, Member{}, err
	}
	if me.IsGuest() || me.UserID != t.OrganizerID {
		return Trip{}, Member{}, ErrNotOrganizer
	}
	return t, me, nil
}

// RemoveMember นำสมาชิกคนอื่นออก — Mark ในทริปของคนนั้นหายไปด้วย ชื่อว่างให้คนอื่นใช้ได้ เข้าใหม่ผ่านลิงก์ปัจจุบันได้
func (s *Service) RemoveMember(ctx context.Context, tripID uuid.UUID, v Viewer, memberID uuid.UUID) error {
	_, me, err := s.asOrganizer(ctx, tripID, v)
	if err != nil {
		return err
	}
	if memberID == me.ID {
		return ErrCannotRemoveSelf
	}
	return s.repo.DeleteMember(ctx, tripID, memberID)
}

// Leave ออกจากทริปเอง (User หรือ Guest) — Mark ในทริปหายไปด้วย ผู้จัดออกไม่ได้ ต้องลบทริปแทน
func (s *Service) Leave(ctx context.Context, tripID uuid.UUID, v Viewer) error {
	me, err := s.findMember(ctx, tripID, v)
	if err != nil {
		return err
	}
	t, err := s.repo.FindByID(ctx, tripID)
	if err != nil {
		return err
	}
	if !me.IsGuest() && me.UserID == t.OrganizerID {
		return ErrOrganizerCannotLeave
	}
	return s.repo.DeleteMember(ctx, tripID, me.ID)
}

// ReplaceInviteLink สุ่มลิงก์เชิญใหม่ — ลิงก์เก่าใช้ไม่ได้ทันที
func (s *Service) ReplaceInviteLink(ctx context.Context, tripID uuid.UUID, v Viewer) (string, error) {
	if _, _, err := s.asOrganizer(ctx, tripID, v); err != nil {
		return "", err
	}
	code, err := newInviteCode()
	if err != nil {
		return "", err
	}
	return code, s.repo.SetInviteCode(ctx, tripID, code)
}

// Delete ลบทริปทั้งหมด (สมาชิกและ Mark หายไปด้วย)
func (s *Service) Delete(ctx context.Context, tripID uuid.UUID, v Viewer) error {
	if _, _, err := s.asOrganizer(ctx, tripID, v); err != nil {
		return err
	}
	return s.repo.Delete(ctx, tripID)
}

// TripsToResync: แก้ปฏิทินส่วนตัววันไหนไป ทริปไหนที่เคย Push แล้วทับวันนั้นควรได้รับการชวน re-sync
func (s *Service) TripsToResync(ctx context.Context, userID uuid.UUID, days []time.Time) ([]Trip, error) {
	if len(days) == 0 {
		return nil, nil
	}
	return s.repo.ListPushedOverlapping(ctx, userID, days)
}

// findMember หาสมาชิกจาก User ก่อน ถ้าไม่เจอแต่เครื่องนี้เคยเข้าทริปแบบ Guest ก็ใช้สมาชิก Guest นั้น
// (เคยเข้าแบบ Guest แล้ว login/สมัครทีหลังบนเครื่องเดิม จะได้ไม่หลุดจากทริป — จนกว่าจะรวม Guest เข้า User ได้จริง)
func (s *Service) findMember(ctx context.Context, tripID uuid.UUID, v Viewer) (Member, error) {
	m, err := s.repo.FindMember(ctx, tripID, v)
	if errors.Is(err, ErrNotFound) && v.UserID != uuid.Nil && v.GuestTokenHash != "" {
		return s.repo.FindMember(ctx, tripID, Viewer{GuestTokenHash: v.GuestTokenHash})
	}
	return m, err
}

func validateDisplayName(name string) error {
	if n := utf8.RuneCountInString(name); n < 1 || n > maxDisplayNameRunes {
		return ErrInvalidDisplayName
	}
	return nil
}

func validateNewTrip(in NewTrip, today time.Time) error {
	n := utf8.RuneCountInString(in.Title)
	switch {
	case n == 0 || n > maxTitleRunes:
		return fmt.Errorf("%w: title must be 1-%d characters", ErrInvalidTrip, maxTitleRunes)
	case in.StartDate.Before(today):
		return fmt.Errorf("%w: start date cannot be in the past", ErrInvalidTrip)
	case in.EndDate.Before(in.StartDate):
		return fmt.Errorf("%w: end date must not be before start date", ErrInvalidTrip)
	case rangeDays(in.StartDate, in.EndDate) > maxRangeDays:
		return fmt.Errorf("%w: date range must be at most %d days", ErrInvalidTrip, maxRangeDays)
	case in.DurationDays < 1 || in.DurationDays > rangeDays(in.StartDate, in.EndDate):
		return fmt.Errorf("%w: duration must be between 1 and the number of days in the date range", ErrInvalidTrip)
	}
	return nil
}

// newInviteCode สุ่ม 16 byte → base64url 22 ตัว เดาไม่ได้ (ลิงก์เชิญคือกุญแจเข้าทริป)
func newInviteCode() (string, error) {
	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(b), nil
}
