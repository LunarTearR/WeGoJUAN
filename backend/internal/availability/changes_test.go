package availability

import (
	"errors"
	"fmt"
	"testing"
	"time"
)

func status(s Status) *Status { return &s }

func TestParseChanges(t *testing.T) {
	tooMany := make([]ChangeRequest, MaxChanges+1)
	start := time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC)
	for i := range tooMany {
		tooMany[i] = ChangeRequest{Day: start.AddDate(0, 0, i).Format(time.DateOnly), Status: status(StatusFree)}
	}

	tests := []struct {
		name      string
		reqs      []ChangeRequest
		wantErr   error
		wantSet   int
		wantClear int
	}{
		{
			name: "free busy and null",
			reqs: []ChangeRequest{
				{Day: "2026-12-05", Status: status(StatusFree)},
				{Day: "2026-12-06", Status: status(StatusBusy)},
				{Day: "2026-12-07", Status: nil},
			},
			wantSet: 2, wantClear: 1,
		},
		{name: "maybe is not a status", reqs: []ChangeRequest{{Day: "2026-12-05", Status: status("maybe")}}, wantErr: ErrInvalidStatus},
		{name: "bad date", reqs: []ChangeRequest{{Day: "2026-13-01", Status: status(StatusFree)}}, wantErr: ErrInvalidDay},
		{
			name: "duplicate day",
			reqs: []ChangeRequest{
				{Day: "2026-12-05", Status: status(StatusFree)},
				{Day: "2026-12-05", Status: nil},
			},
			wantErr: ErrInvalidDay,
		},
		{name: fmt.Sprintf("more than %d entries", MaxChanges), reqs: tooMany, wantErr: ErrInvalidDay},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			set, clear, err := ParseChanges(tt.reqs)

			if tt.wantErr != nil {
				if !errors.Is(err, tt.wantErr) {
					t.Fatalf("err = %v, want %v", err, tt.wantErr)
				}
				return
			}
			if err != nil {
				t.Fatal(err)
			}
			if len(set) != tt.wantSet || len(clear) != tt.wantClear {
				t.Errorf("set=%d clear=%d, want set=%d clear=%d", len(set), len(clear), tt.wantSet, tt.wantClear)
			}
			if set[0].Day != time.Date(2026, 12, 5, 0, 0, 0, 0, time.UTC) || set[0].Status != StatusFree {
				t.Errorf("set[0] = %+v, want 2026-12-05 free at UTC midnight", set[0])
			}
		})
	}
}
