package trip

import (
	"encoding/json"
	"io"
	"net/http"
	"slices"
	"testing"
	"time"

	"github.com/gofiber/fiber/v3"
	"github.com/google/uuid"

	"WeGoJUAN-backend/internal/auth"
)

func newInviteTestApp(t *testing.T, repo *fakeRepo) *fiber.App {
	t.Helper()
	m, err := auth.NewManager("test-secret-that-is-at-least-32-bytes!!", time.Hour, false)
	if err != nil {
		t.Fatal(err)
	}
	app := fiber.New()
	app.Post("/test-login/:id", func(c fiber.Ctx) error { return m.Login(c, c.Params("id")) })
	NewInviteHandler(newTestService(repo, defaultNow), m).RegisterRoutes(app.Group("/invites"))
	return app
}

func inviteRepo(t *testing.T) *fakeRepo {
	return &fakeRepo{
		byCode: Trip{
			ID: uuid.New(), OrganizerID: organizerID, Title: "Chiang Mai",
			StartDate: mustDay(t, "2026-12-01"), EndDate: mustDay(t, "2026-12-20"), DurationDays: 3,
			InviteCode: "code123",
		},
		memberErr: ErrNotFound,
	}
}

func TestJoin_RequiresLogin_401(t *testing.T) {
	app := newInviteTestApp(t, inviteRepo(t))

	res := request(t, app, http.MethodPost, "/invites/code123/join", "")

	if res.StatusCode != http.StatusUnauthorized {
		t.Fatalf("status = %d, want 401", res.StatusCode)
	}
}

func TestJoin_NameTaken_409(t *testing.T) {
	repo := inviteRepo(t)
	repo.addErr = ErrDisplayNameTaken
	app := newInviteTestApp(t, repo)

	res := request(t, app, http.MethodPost, "/invites/code123/join", `{"display_name":"ploy"}`, loginAs(t, app, natID))

	if res.StatusCode != http.StatusConflict {
		t.Fatalf("status = %d, want 409", res.StatusCode)
	}
}

func TestJoin_TrimsDisplayName(t *testing.T) {
	repo := inviteRepo(t)
	app := newInviteTestApp(t, repo)

	res := request(t, app, http.MethodPost, "/invites/code123/join", `{"display_name":" Nat "}`, loginAs(t, app, natID))

	if res.StatusCode != http.StatusOK {
		t.Fatalf("status = %d, want 200", res.StatusCode)
	}
	if len(repo.addedUsers) != 1 || repo.addedUsers[0].displayName != "Nat" {
		t.Errorf("added = %+v, want display name Nat", repo.addedUsers)
	}
	got := decode[joinResponse](t, res)
	if got.TripID != repo.byCode.ID || got.Member.DisplayName != "Nat" || got.Member.IsOrganizer {
		t.Errorf("body = %+v", got)
	}
}

func TestJoin_EmptyBody_UsesAccountName(t *testing.T) {
	repo := inviteRepo(t)
	app := newInviteTestApp(t, repo)

	res := request(t, app, http.MethodPost, "/invites/code123/join", "", loginAs(t, app, natID))

	if res.StatusCode != http.StatusOK {
		t.Fatalf("status = %d, want 200", res.StatusCode)
	}
	if len(repo.addedUsers) != 1 || repo.addedUsers[0].displayName != "" {
		t.Errorf("added = %+v, want empty display name (repo falls back to users.display_name)", repo.addedUsers)
	}
}

func TestPreview_404(t *testing.T) {
	app := newInviteTestApp(t, &fakeRepo{byCodeErr: ErrNotFound})

	res := request(t, app, http.MethodGet, "/invites/nope", "")

	if res.StatusCode != http.StatusNotFound {
		t.Fatalf("status = %d, want 404", res.StatusCode)
	}
}

func TestPreview_200_NoMarksOrMembers(t *testing.T) {
	app := newInviteTestApp(t, inviteRepo(t))

	res := request(t, app, http.MethodGet, "/invites/code123", "")

	if res.StatusCode != http.StatusOK {
		t.Fatalf("status = %d, want 200", res.StatusCode)
	}
	b, _ := io.ReadAll(res.Body)
	var got map[string]any
	if err := json.Unmarshal(b, &got); err != nil {
		t.Fatal(err)
	}
	keys := make([]string, 0, len(got))
	for k := range got {
		keys = append(keys, k)
	}
	slices.Sort(keys)
	want := []string{"duration_days", "end_date", "is_member", "start_date", "title", "trip_id"}
	if !slices.Equal(keys, want) {
		t.Errorf("keys = %v, want %v", keys, want)
	}
	if got["is_member"] != false || got["start_date"] != "2026-12-01" {
		t.Errorf("body = %s", b)
	}
}
