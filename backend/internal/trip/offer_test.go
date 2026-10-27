package trip

import (
	"context"
	"errors"
	"net/http"
	"testing"

	"github.com/google/uuid"
)

// confirmedTrip: ทริปของ decemberTrip ที่ยืนยันวัน start แล้ว (viewer = nat)
func confirmedTrip(t *testing.T, start string) (*fakeRepo, Member) {
	repo, me := decemberTrip(t)
	d := mustDay(t, start)
	repo.trip.ConfirmedStart = &d
	return repo, me
}

func getDetail(t *testing.T, repo *fakeRepo, v Viewer) Detail {
	t.Helper()
	d, err := newTestService(repo, defaultNow).Get(context.Background(), repo.trip.ID, v)
	if err != nil {
		t.Fatal(err)
	}
	return d
}

func TestGet_ConfirmedOffer_ShownUntilAnswered(t *testing.T) {
	repo, _ := confirmedTrip(t, "2026-12-05")
	if !getDetail(t, repo, Viewer{UserID: natID}).Prompts.ConfirmedOffer {
		t.Fatal("offer not shown before answering")
	}

	answered := mustDay(t, "2026-12-05")
	repo.member.OfferAnsweredStart = &answered
	if getDetail(t, repo, Viewer{UserID: natID}).Prompts.ConfirmedOffer {
		t.Error("offer still shown after answering")
	}
}

func TestGet_ConfirmedOffer_ReshownAfterDatesChange(t *testing.T) {
	repo, _ := confirmedTrip(t, "2026-12-12")
	answered := mustDay(t, "2026-12-05")
	repo.member.OfferAnsweredStart = &answered

	if !getDetail(t, repo, Viewer{UserID: natID}).Prompts.ConfirmedOffer {
		t.Error("changed Confirmed Dates must ask again")
	}
}

func TestGet_ConfirmedOffer_NeverWhenFindingDates(t *testing.T) {
	repo, _ := decemberTrip(t)

	if getDetail(t, repo, Viewer{UserID: natID}).Prompts.ConfirmedOffer {
		t.Error("no Confirmed Dates → no offer")
	}
}

func TestGet_ConfirmedOffer_NeverForGuests(t *testing.T) {
	repo, _ := confirmedTrip(t, "2026-12-05")
	repo.guests = map[string]Member{bankHash: {ID: uuid.New(), DisplayName: "Bank"}}

	if getDetail(t, repo, Viewer{GuestTokenHash: bankHash}).Prompts.ConfirmedOffer {
		t.Error("Guests have no Personal Calendar → no offer")
	}
}

// ตอบรับ = ไม่ว่างทุกวันใน Confirmed Dates โดย Reason = ชื่อทริป (MarkBusy ไม่ทับ Reason เดิมของ User)
func TestAnswerOffer_UsesMarkBusyWithTitle(t *testing.T) {
	repo, me := confirmedTrip(t, "2026-12-05")

	err := newTestService(repo, defaultNow).AnswerConfirmedOffer(context.Background(), repo.trip.ID, Viewer{UserID: natID}, true, mustDay(t, "2026-12-05"))

	if err != nil {
		t.Fatal(err)
	}
	c := repo.cal
	if c.busyCalls != 1 || c.busyFor != natID.String() || c.busyReason != "Chiang Mai" || len(c.busyDays) != 3 ||
		!c.busyDays[0].Equal(mustDay(t, "2026-12-05")) || !c.busyDays[2].Equal(mustDay(t, "2026-12-07")) {
		t.Fatalf("MarkBusy calls=%d for %q days=%v reason=%q", c.busyCalls, c.busyFor, c.busyDays, c.busyReason)
	}
	if got := repo.offerAnswered[me.ID]; !got.Equal(mustDay(t, "2026-12-05")) {
		t.Errorf("answered = %v, want Dec 5", got)
	}
}

func TestAnswerOffer_DeclineWritesNothing(t *testing.T) {
	repo, me := confirmedTrip(t, "2026-12-05")

	err := newTestService(repo, defaultNow).AnswerConfirmedOffer(context.Background(), repo.trip.ID, Viewer{UserID: natID}, false, mustDay(t, "2026-12-05"))

	if err != nil {
		t.Fatal(err)
	}
	if repo.cal.busyCalls != 0 {
		t.Error("declining must not touch the Personal Calendar")
	}
	if _, ok := repo.offerAnswered[me.ID]; !ok {
		t.Error("decline must still be recorded")
	}
}

func TestAnswerOffer_NotConfirmed_400(t *testing.T) {
	repo, _ := decemberTrip(t)
	app := newTestApp(t, repo)

	res := request(t, app, http.MethodPost, "/trips/"+repo.trip.ID.String()+"/confirmed-offer", `{"accept":true,"start":"2026-12-05"}`, loginAs(t, app, natID))

	if res.StatusCode != http.StatusBadRequest {
		t.Fatalf("status = %d, want 400", res.StatusCode)
	}
}

func TestAnswerOfferRoute_Guest_403(t *testing.T) {
	repo := guestRepo(t)
	d := mustDay(t, "2026-12-05")
	repo.trip.ConfirmedStart = &d
	repo.byCode = repo.trip
	_, ck := joinAsGuest(t, repo, "Bank")

	res := request(t, newTestApp(t, repo), http.MethodPost, "/trips/"+repo.trip.ID.String()+"/confirmed-offer", `{"accept":true,"start":"2026-12-05"}`, ck)

	if res.StatusCode != http.StatusForbidden {
		t.Fatalf("status = %d, want 403", res.StatusCode)
	}
}

func TestDetailJSON_HasPrompts(t *testing.T) {
	repo, _ := confirmedTrip(t, "2026-12-05")
	app := newTestApp(t, repo)

	res := request(t, app, http.MethodGet, "/trips/"+repo.trip.ID.String(), "", loginAs(t, app, natID))

	if got := decode[detailResponse](t, res); !got.Prompts.ConfirmedOffer || got.Prompts.Repush {
		t.Errorf("prompts = %+v, want confirmed_offer only", got.Prompts)
	}
}

// ตอบจากหน้าที่โหลดไว้ตอนวันยืนยันยังเป็นวันเก่า — ห้ามเขียนวันใหม่ที่ User ไม่เคยเห็นลงปฏิทิน
func TestAnswerOffer_StaleStart_Conflict(t *testing.T) {
	repo, _ := confirmedTrip(t, "2026-12-12")

	err := newTestService(repo, defaultNow).AnswerConfirmedOffer(context.Background(), repo.trip.ID, Viewer{UserID: natID}, true, mustDay(t, "2026-12-05"))

	if !errors.Is(err, ErrConfirmedChanged) {
		t.Fatalf("err = %v, want ErrConfirmedChanged", err)
	}
	if repo.cal.busyCalls != 0 || len(repo.offerAnswered) != 0 {
		t.Error("stale answer must write nothing")
	}
}

func TestAnswerOfferRoute_StaleStart_409(t *testing.T) {
	repo, _ := confirmedTrip(t, "2026-12-12")
	app := newTestApp(t, repo)

	res := request(t, app, http.MethodPost, "/trips/"+repo.trip.ID.String()+"/confirmed-offer", `{"accept":true,"start":"2026-12-05"}`, loginAs(t, app, natID))

	if res.StatusCode != http.StatusConflict {
		t.Fatalf("status = %d, want 409", res.StatusCode)
	}
}
