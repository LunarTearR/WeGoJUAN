package trip

import (
	"net/http"
	"testing"

	"WeGoJUAN-backend/internal/auth"
)

// joinAsGuest เข้าร่วมแบบไม่ login แล้วคืน guest cookie ของเครื่องนี้
func joinAsGuest(t *testing.T, repo *fakeRepo, name string) (*http.Response, *http.Cookie) {
	t.Helper()
	app := newTestApp(t, repo)
	res := request(t, app, http.MethodPost, "/invites/code123/join", `{"display_name":"`+name+`"}`)
	for _, ck := range res.Cookies() {
		if ck.Name == auth.GuestCookieName {
			return res, &http.Cookie{Name: ck.Name, Value: ck.Value}
		}
	}
	return res, nil
}

func guestRepo(t *testing.T) *fakeRepo {
	repo, _ := decemberTrip(t)
	repo.trip.InviteCode = "code123"
	repo.byCode = repo.trip
	return repo
}

func TestJoinAsGuest_SetsCookieAnd200(t *testing.T) {
	res, ck := joinAsGuest(t, guestRepo(t), "Bank")

	if res.StatusCode != http.StatusOK {
		t.Fatalf("status = %d, want 200", res.StatusCode)
	}
	if ck == nil {
		t.Fatal("guest join did not set a guest cookie")
	}
	got := decode[joinResponse](t, res)
	if !got.Member.IsGuest || got.Member.IsOrganizer || got.Member.DisplayName != "Bank" {
		t.Errorf("member = %+v", got.Member)
	}
}

func TestJoinAsGuest_NoName_400(t *testing.T) {
	res, _ := joinAsGuest(t, guestRepo(t), "")

	if res.StatusCode != http.StatusBadRequest {
		t.Fatalf("status = %d, want 400", res.StatusCode)
	}
}

func TestJoinAsGuest_NameTaken_409(t *testing.T) {
	repo := guestRepo(t)
	repo.addErr = ErrDisplayNameTaken

	res, _ := joinAsGuest(t, repo, " ploy ")

	if res.StatusCode != http.StatusConflict {
		t.Fatalf("status = %d, want 409", res.StatusCode)
	}
}

func TestGuest_CanReadTripAndMarkOwnDays(t *testing.T) {
	repo := guestRepo(t)
	app := newTestApp(t, repo)
	res := request(t, app, http.MethodPost, "/invites/code123/join", `{"display_name":"Bank"}`)
	var ck *http.Cookie
	for _, c := range res.Cookies() {
		if c.Name == auth.GuestCookieName {
			ck = &http.Cookie{Name: c.Name, Value: c.Value}
		}
	}
	if ck == nil {
		t.Fatal("no guest cookie")
	}
	guestID := decode[joinResponse](t, res).Member.ID

	res = request(t, app, http.MethodGet, "/trips/"+repo.trip.ID.String(), "", ck)
	if res.StatusCode != http.StatusOK {
		t.Fatalf("GET trip status = %d, want 200", res.StatusCode)
	}
	if me := decode[detailResponse](t, res).Me; me.ID != guestID || !me.IsGuest {
		t.Errorf("me = %+v, want the Guest", me)
	}

	res = request(t, app, http.MethodPut, "/trips/"+repo.trip.ID.String()+"/marks/me", `[{"day":"2026-12-05","status":"free"}]`, ck)
	if res.StatusCode != http.StatusNoContent {
		t.Fatalf("PUT marks status = %d, want 204", res.StatusCode)
	}
	if repo.savedFor != guestID {
		t.Errorf("saved for %v, want Guest %v", repo.savedFor, guestID)
	}

	res = request(t, app, http.MethodGet, "/trips/"+repo.trip.ID.String()+"/marks", "", ck)
	if res.StatusCode != http.StatusOK {
		t.Fatalf("GET marks status = %d, want 200", res.StatusCode)
	}
}

func TestNoCookies_TripIs404(t *testing.T) {
	repo := guestRepo(t)
	app := newTestApp(t, repo)

	for _, path := range []string{"/trips/" + repo.trip.ID.String(), "/trips/" + repo.trip.ID.String() + "/marks"} {
		res := request(t, app, http.MethodGet, path, "")
		if res.StatusCode != http.StatusNotFound {
			t.Errorf("GET %s status = %d, want 404", path, res.StatusCode)
		}
	}
}

func TestGuest_CannotCreateTrip_401(t *testing.T) {
	repo := guestRepo(t)
	_, ck := joinAsGuest(t, repo, "Bank")

	res := request(t, newTestApp(t, repo), http.MethodPost, "/trips", validTripBody, ck)

	if res.StatusCode != http.StatusUnauthorized {
		t.Fatalf("status = %d, want 401", res.StatusCode)
	}
}

func TestGuest_CannotListTrips_401(t *testing.T) {
	repo := guestRepo(t)
	_, ck := joinAsGuest(t, repo, "Bank")

	res := request(t, newTestApp(t, repo), http.MethodGet, "/trips", "", ck)

	if res.StatusCode != http.StatusUnauthorized {
		t.Fatalf("status = %d, want 401", res.StatusCode)
	}
}
