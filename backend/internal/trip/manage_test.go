package trip

import (
	"context"
	"errors"
	"net/http"
	"testing"

	"github.com/google/uuid"
)

func TestRemoveMember_OrganizerOnly(t *testing.T) {
	repo, _ := decemberTrip(t)

	err := newTestService(repo, defaultNow).RemoveMember(context.Background(), repo.trip.ID, Viewer{UserID: natID}, uuid.New())

	if !errors.Is(err, ErrNotOrganizer) || len(repo.deletedMembers) != 0 {
		t.Fatalf("err = %v deleted = %v, want ErrNotOrganizer and nothing deleted", err, repo.deletedMembers)
	}
}

func TestRemoveMember_Self_Rejected(t *testing.T) {
	repo := organizerTrip(t)

	err := newTestService(repo, defaultNow).RemoveMember(context.Background(), repo.trip.ID, Viewer{UserID: organizerID}, repo.member.ID)

	if !errors.Is(err, ErrCannotRemoveSelf) || len(repo.deletedMembers) != 0 {
		t.Fatalf("err = %v deleted = %v, want ErrCannotRemoveSelf", err, repo.deletedMembers)
	}
}

func TestRemoveMember_OtherTrip_NotFound(t *testing.T) {
	repo := organizerTrip(t)
	repo.deleteErr = ErrNotFound

	err := newTestService(repo, defaultNow).RemoveMember(context.Background(), repo.trip.ID, Viewer{UserID: organizerID}, uuid.New())

	if !errors.Is(err, ErrNotFound) {
		t.Fatalf("err = %v, want ErrNotFound", err)
	}
}

func TestReplaceInviteLink_NewCodeDiffers(t *testing.T) {
	repo := organizerTrip(t)
	repo.trip.InviteCode = "code123"

	code, err := newTestService(repo, defaultNow).ReplaceInviteLink(context.Background(), repo.trip.ID, Viewer{UserID: organizerID})

	if err != nil || code == "code123" || len(code) != 22 || len(repo.setCodes) != 1 || repo.setCodes[0] != code {
		t.Fatalf("code = %q err = %v saved = %v", code, err, repo.setCodes)
	}
}

func TestDelete_OrganizerOnly(t *testing.T) {
	repo, _ := decemberTrip(t)
	if err := newTestService(repo, defaultNow).Delete(context.Background(), repo.trip.ID, Viewer{UserID: natID}); !errors.Is(err, ErrNotOrganizer) {
		t.Fatalf("member err = %v, want ErrNotOrganizer", err)
	}

	repo = organizerTrip(t)
	if err := newTestService(repo, defaultNow).Delete(context.Background(), repo.trip.ID, Viewer{UserID: organizerID}); err != nil {
		t.Fatal(err)
	}
	if len(repo.deletedTrips) != 1 || repo.deletedTrips[0] != repo.trip.ID {
		t.Errorf("deleted = %v", repo.deletedTrips)
	}
}

func TestReplaceInviteLink_OldCodeDead(t *testing.T) {
	repo := organizerTrip(t)
	repo.trip.InviteCode = "code123"
	repo.codes = map[string]Trip{"code123": repo.trip}
	app := newTestApp(t, repo)
	ck := loginAs(t, app, organizerID)

	res := request(t, app, http.MethodPost, "/trips/"+repo.trip.ID.String()+"/invite-link", "", ck)
	if res.StatusCode != http.StatusOK {
		t.Fatalf("replace status = %d, want 200", res.StatusCode)
	}
	newCode := decode[struct {
		InviteCode string `json:"invite_code"`
	}](t, res).InviteCode

	if res := request(t, app, http.MethodGet, "/invites/code123", ""); res.StatusCode != http.StatusNotFound {
		t.Errorf("old preview status = %d, want 404", res.StatusCode)
	}
	if res := request(t, app, http.MethodPost, "/invites/code123/join", `{"display_name":"Bank"}`); res.StatusCode != http.StatusNotFound {
		t.Errorf("old join status = %d, want 404", res.StatusCode)
	}
	if res := request(t, app, http.MethodGet, "/invites/"+newCode, ""); res.StatusCode != http.StatusOK {
		t.Errorf("new preview status = %d, want 200", res.StatusCode)
	}
}

func TestRemoveMemberRoute_403_404_204(t *testing.T) {
	repo, _ := decemberTrip(t)
	app := newTestApp(t, repo)
	path := "/trips/" + repo.trip.ID.String() + "/members/"

	if res := request(t, app, http.MethodDelete, path+uuid.NewString(), "", loginAs(t, app, natID)); res.StatusCode != http.StatusForbidden {
		t.Errorf("member status = %d, want 403", res.StatusCode)
	}

	repo = organizerTrip(t)
	app = newTestApp(t, repo)
	ck := loginAs(t, app, organizerID)
	if res := request(t, app, http.MethodDelete, path+"not-a-uuid", "", ck); res.StatusCode != http.StatusNotFound {
		t.Errorf("bad id status = %d, want 404", res.StatusCode)
	}
	if res := request(t, app, http.MethodDelete, path+uuid.NewString(), "", ck); res.StatusCode != http.StatusNoContent {
		t.Errorf("organizer status = %d, want 204", res.StatusCode)
	}
	if res := request(t, app, http.MethodDelete, path+repo.member.ID.String(), "", ck); res.StatusCode != http.StatusBadRequest {
		t.Errorf("remove self status = %d, want 400", res.StatusCode)
	}
}

func TestDeleteTripRoute_204(t *testing.T) {
	repo := organizerTrip(t)
	app := newTestApp(t, repo)

	res := request(t, app, http.MethodDelete, "/trips/"+repo.trip.ID.String(), "", loginAs(t, app, organizerID))

	if res.StatusCode != http.StatusNoContent || len(repo.deletedTrips) != 1 {
		t.Fatalf("status = %d deleted = %v, want 204 and deleted", res.StatusCode, repo.deletedTrips)
	}
}
