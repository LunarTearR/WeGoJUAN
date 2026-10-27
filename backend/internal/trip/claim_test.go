package trip

import (
	"context"
	"net/http"
	"strings"
	"testing"

	"WeGoJUAN-backend/internal/auth"
)

func TestClaimGuest_PassesHash(t *testing.T) {
	repo := &fakeRepo{claimN: 2}

	n, err := newTestService(repo, defaultNow).ClaimGuestMemberships(context.Background(), natID, bankHash)

	if err != nil || n != 2 || repo.claimedFor != natID || repo.claimedHash != bankHash {
		t.Fatalf("n = %d err = %v claimed for %v hash %q", n, err, repo.claimedFor, repo.claimedHash)
	}
}

func TestClaimGuest_NoGuestCookie_ZeroWithoutRepoCall(t *testing.T) {
	repo := &fakeRepo{claimN: 5}

	n, err := newTestService(repo, defaultNow).ClaimGuestMemberships(context.Background(), natID, "")

	if err != nil || n != 0 || repo.claimCalls != 0 {
		t.Fatalf("n = %d err = %v calls = %d, want 0 without a repo call", n, err, repo.claimCalls)
	}
}

func TestClaimRoute_NotShadowedById(t *testing.T) {
	repo := &fakeRepo{claimN: 1}
	app := newTestApp(t, repo)
	guest := &http.Cookie{Name: auth.GuestCookieName, Value: strings.Repeat("g", 43)}

	res := request(t, app, http.MethodPost, "/trips/claim-guest", "", loginAs(t, app, natID), guest)

	if res.StatusCode != http.StatusOK {
		t.Fatalf("status = %d, want 200 (not swallowed by /:id)", res.StatusCode)
	}
	if got := decode[struct {
		Claimed int `json:"claimed"`
	}](t, res); got.Claimed != 1 {
		t.Errorf("claimed = %d, want 1", got.Claimed)
	}
	if repo.claimedHash != auth.HashGuestToken(guest.Value) {
		t.Errorf("claimed hash %q, want hash of the guest cookie", repo.claimedHash)
	}
}

func TestClaimRoute_RequiresLogin_401(t *testing.T) {
	app := newTestApp(t, &fakeRepo{})

	res := request(t, app, http.MethodPost, "/trips/claim-guest", "", &http.Cookie{Name: auth.GuestCookieName, Value: strings.Repeat("g", 43)})

	if res.StatusCode != http.StatusUnauthorized {
		t.Fatalf("status = %d, want 401", res.StatusCode)
	}
}
