package trip

import (
	"context"
	"errors"
	"strings"
	"testing"
	"time"

	"github.com/google/uuid"

	"WeGoJUAN-backend/internal/availability"
)

type fakeRepo struct {
	created []Trip
	listed  []Trip

	trip    Trip
	findErr error

	member    Member
	memberErr error
	members   []Member

	byCode     Trip
	byCodeErr  error
	addErr     error
	addedUsers []addedUser

	marks      map[uuid.UUID][]availability.Mark
	saveCalls  int
	savedFor   uuid.UUID
	savedSet   []availability.Mark
	savedClear []time.Time
}

type addedUser struct {
	userID      uuid.UUID
	displayName string
}

func (r *fakeRepo) Create(ctx context.Context, t Trip) (Trip, error) {
	r.created = append(r.created, t)
	t.ID = uuid.New()
	return t, nil
}

func (r *fakeRepo) FindByID(ctx context.Context, id uuid.UUID) (Trip, error) {
	return r.trip, r.findErr
}

func (r *fakeRepo) ListByUser(ctx context.Context, userID uuid.UUID) ([]Trip, error) {
	return r.listed, nil
}

func (r *fakeRepo) FindMember(ctx context.Context, tripID uuid.UUID, v Viewer) (Member, error) {
	return r.member, r.memberErr
}

func (r *fakeRepo) Members(ctx context.Context, tripID uuid.UUID) ([]Member, error) {
	return r.members, nil
}

func (r *fakeRepo) ListMarks(ctx context.Context, tripID uuid.UUID) (map[uuid.UUID][]availability.Mark, error) {
	return r.marks, nil
}

func (r *fakeRepo) SaveMarks(ctx context.Context, memberID uuid.UUID, set []availability.Mark, clear []time.Time) error {
	r.saveCalls++
	r.savedFor, r.savedSet, r.savedClear = memberID, set, clear
	return nil
}

func (r *fakeRepo) FindByInviteCode(ctx context.Context, code string) (Trip, error) {
	return r.byCode, r.byCodeErr
}

func (r *fakeRepo) AddUserMember(ctx context.Context, tripID, userID uuid.UUID, displayName string) (Member, error) {
	if r.addErr != nil {
		return Member{}, r.addErr
	}
	r.addedUsers = append(r.addedUsers, addedUser{userID, displayName})
	return Member{ID: uuid.New(), TripID: tripID, UserID: userID, DisplayName: displayName}, nil
}

var organizerID = uuid.MustParse("6f1c2c1e-0d5e-4a43-9a51-0c7d0f6f5b11")

// defaultNow = 1 พ.ย. 2026 เที่ยงวันเวลาไทย
var defaultNow = time.Date(2026, 11, 1, 5, 0, 0, 0, time.UTC)

func mustDay(t *testing.T, s string) time.Time {
	t.Helper()
	d, err := time.Parse(time.DateOnly, s)
	if err != nil {
		t.Fatal(err)
	}
	return d
}

func newTestService(repo *fakeRepo, now time.Time) *Service {
	s := NewService(repo)
	s.now = func() time.Time { return now }
	return s
}

func validNewTrip(t *testing.T) NewTrip {
	return NewTrip{
		Title:        "Chiang Mai",
		StartDate:    mustDay(t, "2026-12-01"),
		EndDate:      mustDay(t, "2026-12-20"),
		DurationDays: 3,
	}
}

func TestToday_UsesThailandDate(t *testing.T) {
	tests := []struct {
		now  time.Time
		want string
	}{
		{time.Date(2026, 11, 1, 23, 30, 0, 0, time.UTC), "2026-11-02"}, // 06:30 วันถัดไปในไทย
		{time.Date(2026, 11, 1, 16, 59, 0, 0, time.UTC), "2026-11-01"}, // 23:59 ในไทย
	}
	for _, tt := range tests {
		got := Today(tt.now)
		if !got.Equal(mustDay(t, tt.want)) || got.Location() != time.UTC {
			t.Errorf("Today(%v) = %v, want %s UTC midnight", tt.now, got, tt.want)
		}
	}
}

func TestCreate_Validation(t *testing.T) {
	tests := []struct {
		name   string
		mutate func(*NewTrip)
	}{
		{"blank title", func(n *NewTrip) { n.Title = "   " }},
		{"title over 100 runes", func(n *NewTrip) { n.Title = strings.Repeat("ก", 101) }},
		{"start before today", func(n *NewTrip) { n.StartDate = mustDay(t, "2026-10-31") }},
		{"end before start", func(n *NewTrip) { n.EndDate = mustDay(t, "2026-11-30") }},
		{"date range over 365 days", func(n *NewTrip) { n.EndDate = mustDay(t, "2027-12-01") }},
		{"duration zero", func(n *NewTrip) { n.DurationDays = 0 }},
		{"duration longer than date range", func(n *NewTrip) {
			n.EndDate = mustDay(t, "2026-12-03")
			n.DurationDays = 4
		}},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			repo := &fakeRepo{}
			in := validNewTrip(t)
			tt.mutate(&in)

			_, err := newTestService(repo, defaultNow).Create(context.Background(), organizerID, in)

			if !errors.Is(err, ErrInvalidTrip) {
				t.Fatalf("err = %v, want ErrInvalidTrip", err)
			}
			if len(repo.created) != 0 {
				t.Errorf("invalid trip must not reach the repo, got %d", len(repo.created))
			}
		})
	}
}

func TestCreate_OK(t *testing.T) {
	repo := &fakeRepo{}
	svc := newTestService(repo, defaultNow)
	in := validNewTrip(t)
	in.Title = "  Chiang Mai  "

	if _, err := svc.Create(context.Background(), organizerID, in); err != nil {
		t.Fatal(err)
	}
	if _, err := svc.Create(context.Background(), organizerID, in); err != nil {
		t.Fatal(err)
	}

	got := repo.created[0]
	if got.Title != "Chiang Mai" {
		t.Errorf("Title = %q, want trimmed", got.Title)
	}
	if got.OrganizerID != organizerID {
		t.Errorf("OrganizerID = %v, want %v", got.OrganizerID, organizerID)
	}
	if len(got.InviteCode) != 22 {
		t.Errorf("len(InviteCode) = %d, want 22", len(got.InviteCode))
	}
	if repo.created[1].InviteCode == got.InviteCode {
		t.Error("two trips got the same invite code")
	}
}

func TestCreate_StartTodayThai_OK(t *testing.T) {
	in := validNewTrip(t)
	in.StartDate = mustDay(t, "2026-11-02")

	// 23:30 UTC วันที่ 1 = 06:30 วันที่ 2 ในไทย → วันที่ 2 คือ "วันนี้"
	_, err := newTestService(&fakeRepo{}, time.Date(2026, 11, 1, 23, 30, 0, 0, time.UTC)).
		Create(context.Background(), organizerID, in)

	if err != nil {
		t.Fatalf("err = %v, want nil", err)
	}
}

func TestGet_NonMember_NotFound(t *testing.T) {
	repo := &fakeRepo{memberErr: ErrNotFound}

	_, err := newTestService(repo, defaultNow).Get(context.Background(), uuid.New(), Viewer{UserID: organizerID})

	if !errors.Is(err, ErrNotFound) {
		t.Fatalf("err = %v, want ErrNotFound", err)
	}
}

func TestGet_Member_ReturnsTripMembersAndMe(t *testing.T) {
	me := Member{ID: uuid.New(), UserID: organizerID, DisplayName: "ploy"}
	repo := &fakeRepo{
		trip:    Trip{ID: uuid.New(), Title: "Chiang Mai"},
		member:  me,
		members: []Member{me},
	}

	d, err := newTestService(repo, defaultNow).Get(context.Background(), repo.trip.ID, Viewer{UserID: organizerID})

	if err != nil {
		t.Fatal(err)
	}
	if d.Trip.Title != "Chiang Mai" || len(d.Members) != 1 || d.Me.ID != me.ID {
		t.Errorf("detail = %+v", d)
	}
}

var natID = uuid.MustParse("0a7c0e55-6a7e-4a33-9d0e-2b1b7d4c9a21")

func TestPreview_UnknownCode_NotFound(t *testing.T) {
	repo := &fakeRepo{byCodeErr: ErrNotFound}

	_, _, err := newTestService(repo, defaultNow).Preview(context.Background(), "nope", Viewer{})

	if !errors.Is(err, ErrNotFound) {
		t.Fatalf("err = %v, want ErrNotFound", err)
	}
}

func TestPreview_IsMember(t *testing.T) {
	tests := []struct {
		name      string
		memberErr error
		want      bool
	}{
		{"member", nil, true},
		{"not a member", ErrNotFound, false},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			repo := &fakeRepo{byCode: Trip{ID: uuid.New()}, memberErr: tt.memberErr}

			_, isMember, err := newTestService(repo, defaultNow).Preview(context.Background(), "code", Viewer{UserID: natID})

			if err != nil || isMember != tt.want {
				t.Errorf("isMember = %v err = %v, want %v nil", isMember, err, tt.want)
			}
		})
	}
}

func TestJoinAsUser_AlreadyMember_ReturnsExisting(t *testing.T) {
	existing := Member{ID: uuid.New(), UserID: natID, DisplayName: "nat"}
	repo := &fakeRepo{byCode: Trip{ID: uuid.New()}, member: existing}

	_, m, err := newTestService(repo, defaultNow).JoinAsUser(context.Background(), "code", natID, "")

	if err != nil || m.ID != existing.ID {
		t.Fatalf("member = %+v err = %v, want existing", m, err)
	}
	if len(repo.addedUsers) != 0 {
		t.Errorf("already a Member must not insert again, got %v", repo.addedUsers)
	}
}

func TestJoinAsUser_NewMember_Added(t *testing.T) {
	repo := &fakeRepo{byCode: Trip{ID: uuid.New()}, memberErr: ErrNotFound}

	_, _, err := newTestService(repo, defaultNow).JoinAsUser(context.Background(), "code", natID, "  Nat  ")

	if err != nil {
		t.Fatal(err)
	}
	if len(repo.addedUsers) != 1 || repo.addedUsers[0] != (addedUser{natID, "Nat"}) {
		t.Errorf("added = %+v, want [{nat Nat}]", repo.addedUsers)
	}
}

func TestJoinAsUser_NameTaken(t *testing.T) {
	repo := &fakeRepo{byCode: Trip{ID: uuid.New()}, memberErr: ErrNotFound, addErr: ErrDisplayNameTaken}

	_, _, err := newTestService(repo, defaultNow).JoinAsUser(context.Background(), "code", natID, "ploy")

	if !errors.Is(err, ErrDisplayNameTaken) {
		t.Fatalf("err = %v, want ErrDisplayNameTaken", err)
	}
}

func TestJoinAsUser_DisplayNameTooLong(t *testing.T) {
	repo := &fakeRepo{byCode: Trip{ID: uuid.New()}, memberErr: ErrNotFound}

	_, _, err := newTestService(repo, defaultNow).JoinAsUser(context.Background(), "code", natID, strings.Repeat("ก", 51))

	if !errors.Is(err, ErrInvalidDisplayName) {
		t.Fatalf("err = %v, want ErrInvalidDisplayName", err)
	}
	if len(repo.addedUsers) != 0 {
		t.Error("invalid name must not reach the repo")
	}
}

// decemberTrip: Date Range 1-20 ธ.ค. 2026 ไป 3 วัน, viewer เป็นสมาชิก me
func decemberTrip(t *testing.T) (*fakeRepo, Member) {
	me := Member{ID: uuid.New(), UserID: natID, DisplayName: "nat"}
	return &fakeRepo{
		trip: Trip{
			ID: uuid.New(), OrganizerID: organizerID, Title: "Chiang Mai",
			StartDate: mustDay(t, "2026-12-01"), EndDate: mustDay(t, "2026-12-20"), DurationDays: 3,
		},
		member:  me,
		members: []Member{me},
	}, me
}

func TestSetMyMarks_DayOutOfRange(t *testing.T) {
	tests := []struct {
		name  string
		set   []availability.Mark
		clear []time.Time
	}{
		{"set after end", []availability.Mark{{Day: mustDay(t, "2026-12-21"), Status: availability.StatusFree}}, nil},
		{"clear before start", nil, []time.Time{mustDay(t, "2026-11-30")}},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			repo, _ := decemberTrip(t)

			err := newTestService(repo, defaultNow).SetMyMarks(context.Background(), repo.trip.ID, Viewer{UserID: natID}, tt.set, tt.clear)

			if !errors.Is(err, ErrDayOutOfRange) {
				t.Fatalf("err = %v, want ErrDayOutOfRange", err)
			}
			if repo.saveCalls != 0 {
				t.Error("out-of-range day must not be saved")
			}
		})
	}
}

func TestSetMyMarks_SavesForViewersMember(t *testing.T) {
	repo, me := decemberTrip(t)
	set := []availability.Mark{{Day: mustDay(t, "2026-12-01"), Status: availability.StatusBusy}}
	clear := []time.Time{mustDay(t, "2026-12-20")}

	err := newTestService(repo, defaultNow).SetMyMarks(context.Background(), repo.trip.ID, Viewer{UserID: natID}, set, clear)

	if err != nil {
		t.Fatal(err)
	}
	if repo.savedFor != me.ID || len(repo.savedSet) != 1 || len(repo.savedClear) != 1 {
		t.Errorf("saved for %v set=%v clear=%v, want member %v", repo.savedFor, repo.savedSet, repo.savedClear, me.ID)
	}
}

func TestMarks_NonMember_NotFound(t *testing.T) {
	repo, _ := decemberTrip(t)
	repo.memberErr = ErrNotFound

	_, err := newTestService(repo, defaultNow).Marks(context.Background(), repo.trip.ID, Viewer{UserID: natID})

	if !errors.Is(err, ErrNotFound) {
		t.Fatalf("err = %v, want ErrNotFound", err)
	}
}
