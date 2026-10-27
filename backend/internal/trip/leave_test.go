package trip

import (
	"context"
	"errors"
	"net/http"
	"testing"

	"github.com/google/uuid"
)

func TestLeave_Member_DeletesOwnRow(t *testing.T) {
	repo, me := decemberTrip(t)

	err := newTestService(repo, defaultNow).Leave(context.Background(), repo.trip.ID, Viewer{UserID: natID})

	if err != nil || len(repo.deletedMembers) != 1 || repo.deletedMembers[0] != me.ID {
		t.Fatalf("err = %v deleted = %v, want own member %v", err, repo.deletedMembers, me.ID)
	}
}

func TestLeave_Organizer_Rejected(t *testing.T) {
	repo := organizerTrip(t)

	err := newTestService(repo, defaultNow).Leave(context.Background(), repo.trip.ID, Viewer{UserID: organizerID})

	if !errors.Is(err, ErrOrganizerCannotLeave) || len(repo.deletedMembers) != 0 {
		t.Fatalf("err = %v deleted = %v, want ErrOrganizerCannotLeave", err, repo.deletedMembers)
	}
}

func TestLeave_Guest_OK(t *testing.T) {
	repo, _ := decemberTrip(t)
	guest := Member{ID: uuid.New(), DisplayName: "Bank"}
	repo.guests = map[string]Member{bankHash: guest}

	err := newTestService(repo, defaultNow).Leave(context.Background(), repo.trip.ID, Viewer{GuestTokenHash: bankHash})

	if err != nil || len(repo.deletedMembers) != 1 || repo.deletedMembers[0] != guest.ID {
		t.Fatalf("err = %v deleted = %v, want Guest %v", err, repo.deletedMembers, guest.ID)
	}
}

func TestLeaveRoute_NotShadowedByMemberID(t *testing.T) {
	repo, me := decemberTrip(t)
	app := newTestApp(t, repo)

	res := request(t, app, http.MethodDelete, "/trips/"+repo.trip.ID.String()+"/members/me", "", loginAs(t, app, natID))

	if res.StatusCode != http.StatusNoContent {
		t.Fatalf("status = %d, want 204 (not parsed as a member id)", res.StatusCode)
	}
	if len(repo.deletedMembers) != 1 || repo.deletedMembers[0] != me.ID {
		t.Errorf("deleted = %v", repo.deletedMembers)
	}
}

func TestLeaveRoute_Organizer_400(t *testing.T) {
	repo := organizerTrip(t)
	app := newTestApp(t, repo)

	res := request(t, app, http.MethodDelete, "/trips/"+repo.trip.ID.String()+"/members/me", "", loginAs(t, app, organizerID))

	if res.StatusCode != http.StatusBadRequest {
		t.Fatalf("status = %d, want 400", res.StatusCode)
	}
}
