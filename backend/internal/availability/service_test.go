package availability

import (
	"context"
	"testing"
	"time"
)

type fakeRepo struct {
	savedUser  string
	savedSet   []Mark
	savedClear []time.Time

	listed []Mark
}

func (r *fakeRepo) Save(ctx context.Context, userID string, set []Mark, clear []time.Time) error {
	r.savedUser, r.savedSet, r.savedClear = userID, set, clear
	return nil
}

func (r *fakeRepo) ListByUser(ctx context.Context, userID string, from, to time.Time) ([]Mark, error) {
	return r.listed, nil
}

func day(s string) time.Time {
	d, _ := time.Parse(time.DateOnly, s)
	return d
}

func TestSetMarks_PassesSetAndClearToRepo(t *testing.T) {
	repo := &fakeRepo{}
	set := []Mark{{Day: day("2026-12-05"), Status: StatusBusy}}
	clear := []time.Time{day("2026-12-06")}

	if err := NewService(repo).SetMarks(context.Background(), "user-1", set, clear); err != nil {
		t.Fatal(err)
	}

	if repo.savedUser != "user-1" || len(repo.savedSet) != 1 || len(repo.savedClear) != 1 || !repo.savedClear[0].Equal(day("2026-12-06")) {
		t.Errorf("saved user=%q set=%v clear=%v", repo.savedUser, repo.savedSet, repo.savedClear)
	}
}
