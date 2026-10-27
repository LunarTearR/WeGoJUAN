# Trip Push, Confirm & Manage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish the date-finding MVP with slices #8–#15:
- Push from the Personal Calendar, plus the re-sync prompt.
- The Organizer confirms dates, and Users are offered to mark them Busy.
- The Organizer edits the Date Range, manages Members, the Invite Link and the Trip.
- Members leave.
- A Guest who signs up keeps their place.

**Architecture:** Same layering as the core loop (`trip` package: domain / service with fake repos / thin pgx repo / Fiber handler; web feature folders composed in `src/app/routes`).
- **Push and the Confirmed-Dates offer are the only places a Trip touches a Personal Calendar.** They go through a `Calendar` interface that `availability.Service` satisfies, and only on the User's own explicit action (ADR-0001: snapshot, never a live read).
- **Prompts are derived, not stored as flags:**
  - "push again" comes from `trip_members.pushed_at` vs `trips.date_range_changed_at`;
  - the "mark Busy?" offer comes from `trips.confirmed_start` vs `trip_members.offer_answered_start`.

**Tech Stack:** Go 1.26, Fiber v3, pgx v5, goose, Postgres 17; React 19, react-router 8, TanStack Query 5, Tailwind 4.

**Spec:** `CONTEXT.md` (Push, Trip-only Mark, Confirmed Dates, Finding Dates / Confirmed, Organizer, Invite Link, Member, Guest), `docs/adr/0001-trips-hold-snapshot-marks.md`. Previous plan for patterns: `docs/superpowers/plans/2026-10-27-trip-date-finding.md`. Task N here = slice #(N+7).

## Global Constraints

Everything in the previous plan's Global Constraints still holds (CONTEXT.md terms only, DateOnly strings, Thailand "today", 404 for non-Members, Thai comments/UI copy, goose migrations continuing from `00006`, one commit per task, trailer `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`), plus:

- **Organizer-only actions** done by another Member → **403** `"only the organizer can do this"`.
- **User-only actions** (Push, the Confirmed-Dates offer) done by a Guest → **403** `"only signed-up users can do this"`.
- A **Window** is valid when `start ≥ trip.StartDate`, `start + Duration − 1 ≤ trip.EndDate`, and `start ≥ today (Thailand)`.
- **Push copies the Personal Calendar's state for each picked day.** A picked day that is Unknown on the calendar clears the Trip's Mark. Unpicked days are untouched; they become Trip-only Marks.
- **Static routes are registered before `/:id`.** These are `/trips/resync` and `/trips/claim-guest`.
- **Every new state-changing endpoint that takes a body requires `Content-Type: application/json`.** This is the same CSRF reasoning as the join fix.

## Review Focus

1. **Push and Trip-only Marks:**
   - An unpicked differing day keeps the Trip's Mark.
   - A picked day that is Unknown on the calendar clears it, rather than leaving it.
   - Days outside the Date Range are rejected.
   - Pinned in Task 1 (`TestPush_AppliesOnlyPickedDays`, `TestPush_PickedUnknownClears`).
2. **Shrinking the Date Range under Confirmed Dates:** the Confirmed Dates are cleared in the same update. This must not trip the DB CHECK and turn into a 500. Pinned in Task 5 (`TestUpdateDates_ClearsConfirmedThatNoLongerFits`) plus the live curl smoke.
3. **Authorization edges:**
   - A non-Organizer Member calling Organizer endpoints gets 403.
   - A Guest calling Push or the offer gets 403.
   - A removed Member's old cookie gets 404.
   - The Organizer leaving gets 400.
   - Pinned in Tasks 3, 6 and 7.
4. **Route shadowing:** `GET /trips/resync` and `POST /trips/claim-guest` must not be swallowed by `/:id` (it would give "trip not found"). Pinned in Task 2 and Task 8 handler tests.
5. **Replaced Invite Link:** the old code returns 404 on both preview and join. A removed Member can rejoin with the new code. Pinned in Task 6 (`TestReplaceInviteLink_OldCodeDead`) and the E2E check.

---

## Shared API contract (additions)

| Method & path | Who | Body | Response | Task |
|---|---|---|---|---|
| `GET /trips/:id/push-preview` | User Member | — | `[{day, trip_status, calendar_status}]` (null = Unknown; only days that differ) | 1 |
| `POST /trips/:id/push` | User Member | `{days: [day]}` | 204 | 1 |
| `GET /trips/resync?days=d1,d2` | User | — | `[TripJSON]` (trips I pushed to whose Date Range contains any day) | 2 |
| `PUT /trips/:id/confirmed` | Organizer | `{start}` | 200 `TripJSON` | 3 |
| `DELETE /trips/:id/confirmed` | Organizer | — | 204 | 3 |
| `POST /trips/:id/confirmed-offer` | User Member | `{accept: bool}` | 204 | 4 |
| `PATCH /trips/:id` | Organizer | `{start_date, end_date, duration_days}` | 200 `TripJSON` | 5 |
| `DELETE /trips/:id/members/:memberId` | Organizer (not self) | — | 204 | 6 |
| `POST /trips/:id/invite-link` | Organizer | — | 200 `{invite_code}` | 6 |
| `DELETE /trips/:id` | Organizer | — | 204 | 6 |
| `DELETE /trips/:id/members/me` | Member except Organizer | — | 204 / 400 | 7 |
| `POST /trips/claim-guest` | User with a guest cookie | — | 200 `{claimed: n}` | 8 |

Changes to existing shapes:
- `TripJSON` gains `confirmed_start`, `confirmed_end` (both `null` while the Trip is Finding Dates). Task 3.
- `GET /trips/:id` detail gains `prompts: {repush: bool, confirmed_offer: bool}`. `repush` arrives in Task 5 and `confirmed_offer` in Task 4. Both are `false` for Guests.

## E2E environment

Same as before. Scripts live in the session scratchpad `e2e/` folder and reuse `lib.mjs` (`launch`, `check`, `loginPage`, `apiLogin`, `apiCreateTrip`, `apiJoin`, `tapUntil`). Run `make db` after each migration. `make air` hot-reloads the API on `:8080` and Vite serves `:5173`.

---

### Task 1: Push from the Personal Calendar, picking days (slice #8)

**Files:**
- Create: `backend/migrations/00007_member_pushed_at.sql`, `backend/internal/trip/push.go`, `backend/internal/trip/push_test.go`, `backend/internal/trip/push_handler_test.go`
- Modify: `trip/trip.go` (`Member.PushedAt`, `ErrGuestNotAllowed`), `trip/service.go` (`Calendar` interface, `NewService(repo, cal)`), `trip/repository.go` (scan `pushed_at`, `SetPushedAt`), `trip/handler.go` (2 routes), `trip/service_test.go` (`newTestService` passes a fake calendar), `cmd/api/main.go`
- Create (web): `web/src/features/trip/api/get-push-preview.ts`, `web/src/features/trip/api/push-to-trip.ts`, `web/src/features/trip/components/push-panel.tsx`
- Modify (web): `web/src/features/trip/types.ts` (`PushDay`), `web/src/app/routes/trip-detail.tsx`

**Interfaces:**

```go
// trip
var ErrGuestNotAllowed = errors.New("only signed-up users can do this")
type Calendar interface { // satisfied by *availability.Service
    ListByUser(ctx context.Context, userID string, from, to time.Time) ([]availability.Mark, error)
    SetMarks(ctx context.Context, userID string, set []availability.Mark, clear []time.Time) error
}
func NewService(repo Repository, cal Calendar) *Service
type PushDay struct { Day time.Time; Trip, Calendar *availability.Status } // nil = Unknown
func (s *Service) PushPreview(ctx context.Context, tripID uuid.UUID, v Viewer) ([]PushDay, error) // ordered by day; only days that differ
func (s *Service) Push(ctx context.Context, tripID uuid.UUID, v Viewer, days []time.Time) error  // days must be in Date Range; recomputes from the calendar at apply time
// Repository addition
SetPushedAt(ctx context.Context, memberID uuid.UUID, at time.Time) error
```

Web:
- `usePushPreview(tripId, enabled)` uses key `['trips', tripId, 'push-preview']`.
- `usePushToTrip(tripId)` invalidates `['trips', tripId]`.
- `<PushPanel trip me onDone>`:
  - lists every differing day as "วันที่ · ในทริป: X → ปฏิทิน: Y" with a checkbox, ticked by default;
  - has the button "อัปเดตวันที่เลือก";
  - shows "ทริปตรงกับปฏิทินแล้ว" when nothing differs.

- [ ] **Step 1: Migration `00007_member_pushed_at.sql`**

```sql
-- +goose Up
ALTER TABLE trip_members ADD COLUMN pushed_at TIMESTAMPTZ;
-- +goose Down
ALTER TABLE trip_members DROP COLUMN IF EXISTS pushed_at;
```

Run `make db`. Expected: version 7.

- [ ] **Step 2: Failing tests.**
  - `push_test.go`. The fake calendar has `marks []availability.Mark` and records `ListByUser` calls. The trip is Dec 1–20.
    - `TestPushPreview_OnlyDifferingDays`:
      - trip: Dec 5 Free;
      - calendar: Dec 5 Free, Dec 6 Busy, Dec 25 Busy (outside range).
      - Expect exactly `[{Dec 6, Trip: nil, Calendar: busy}]`.
    - `TestPushPreview_GuestForbidden`: a Guest viewer → `ErrGuestNotAllowed`.
    - `TestPush_AppliesOnlyPickedDays`:
      - trip: Dec 5 Free;
      - calendar: Dec 5 Busy, Dec 6 Busy.
      - Push `[Dec 6]` → `SaveMarks` set exactly Dec 6 busy, nothing for Dec 5, and `SetPushedAt` called.
    - `TestPush_PickedUnknownClears`: trip Dec 5 Busy, calendar has nothing → push `[Dec 5]` → `SaveMarks` clear = `[Dec 5]`.
    - `TestPush_DayOutOfRange`: `[Dec 21]` → `ErrDayOutOfRange`, nothing saved.
  - `push_handler_test.go`:
    - `TestPushPreview_200`: JSON `[{"day":"2026-12-06","trip_status":null,"calendar_status":"busy"}]`.
    - `TestPush_Guest_403`
    - `TestPush_NonJSON_415`
    - `TestPush_204`
- [ ] **Step 3: Run** `cd backend && go test ./internal/trip/`. Expected: FAIL (does not compile).
- [ ] **Step 4: Implement** `push.go`, plus the repo, handler and main wiring. `main.go` becomes `trip.NewService(trip.NewRepository(db), availabilitySvc)`. Every existing `newTestService` call gets a `&fakeCalendar{}`.
- [ ] **Step 5: Run** `go build ./... && go vet ./... && go test ./...`. Expected: PASS.
- [ ] **Step 6: Web.**
  - On the trip page, a User sees the button "อัปเดตจากปฏิทินของฉัน", which toggles `PushPanel`.
  - `?push=1` opens it on load.
  - Guests don't see the button.
- [ ] **Step 7: Run** `cd web && npm run build && npx oxlint`. Expected: clean.
- [ ] **Step 8: E2E.** Ploy's calendar has Dec 5 Free and Dec 6 Busy; a new trip runs Dec 1–20.
  1. Open the panel. Expect 2 rows.
  2. Untick Dec 6 and apply. Expect the grid to show Dec 5 Free and Dec 6 Unknown.
  3. Reopen the panel. Expect exactly the Dec 6 row, which proves Dec 6 is now a Trip-only gap.
- [ ] **Step 9: Commit** `feat: Push Personal Calendar marks into a Trip, picking days`.

---

### Task 2: Re-sync prompt after editing the Personal Calendar (slice #9)

**Files:**
- Modify: `trip/service.go` (`TripsToResync`), `trip/repository.go` (`ListPushedOverlapping`), `trip/handler.go` (`GET /resync`, registered before `/:id`), tests
- Create (web): `web/src/features/trip/api/get-resync-trips.ts`, `web/src/features/trip/components/resync-banner.tsx`
- Modify (web): `web/src/features/availability/components/month-calendar.tsx` (`onSaved(days)` prop), `web/src/app/routes/calendar.tsx`

**Interfaces:**

```go
func (s *Service) TripsToResync(ctx context.Context, userID uuid.UUID, days []time.Time) ([]Trip, error)
// Repository addition — trips where this User's member has pushed_at set and start_date <= any day <= end_date
ListPushedOverlapping(ctx context.Context, userID uuid.UUID, days []time.Time) ([]Trip, error)
```

Web:
- `useResyncTrips(days: ISODate[])` uses key `['trips', 'resync', days]` and is disabled when `days` is empty.
- `<ResyncBanner days>` lists "ปฏิทินเปลี่ยนแล้ว — อัปเดตไปยังทริป: [title]". Each title links to `/trips/:id?push=1`. There's a dismiss "ปิด" that clears the days.
- `MonthCalendar` calls `onSaved([day])` after each successful save. The calendar route collects the unique days in state.

- [ ] **Step 1: Failing tests.**
  - `TestTripsToResync_PassesDaysToRepo`
  - `TestTripsToResync_NoDays_Empty`: returns nil without calling the repo.
  - `TestResync_RouteNotShadowedById`: `GET /trips/resync?days=2026-12-05` logged in → 200 with a JSON array, not 404 "trip not found".
  - `TestResync_BadDay_400`
  - `TestResync_RequiresLogin_401`
- [ ] **Step 2: Run** the trip tests. Expected: FAIL.
- [ ] **Step 3: Implement** the service, repo and handler. The repo SQL is:

```sql
SELECT t.* … FROM trips t
JOIN trip_members m ON m.trip_id = t.id
WHERE m.user_id = $1 AND m.pushed_at IS NOT NULL
  AND EXISTS (SELECT 1 FROM unnest($2::date[]) d WHERE d BETWEEN t.start_date AND t.end_date)
ORDER BY t.start_date
```

  Days come from `availability.ParseDay`, with at most `availability.MaxChanges` of them.
- [ ] **Step 4: Run** the full Go suite. Expected: PASS.
- [ ] **Step 5: Web.** Implement the files above. The banner sits above the calendar.
- [ ] **Step 6: Run** the web build and lint. Expected: clean.
- [ ] **Step 7: E2E.**
  1. Ploy pushes to trip A (Dec 1–20).
  2. On `/`, tap Dec 8. Expect a banner naming trip A.
  3. Click the trip A link. Expect `/trips/:id?push=1` with the panel open, showing Dec 8.
  4. Tap a January day. Expect no banner for trip A.
- [ ] **Step 8: Commit** `feat: prompt to re-sync Trips after editing the Personal Calendar`.

---

### Task 3: Organizer confirms a Window (slice #10)

**Files:**
- Create: `backend/migrations/00008_trip_confirmed_start.sql`, `backend/internal/trip/confirm_test.go`
- Modify: `trip/trip.go` (`Trip.ConfirmedStart *time.Time`, `ConfirmedEnd()`, `ErrNotOrganizer`, `ErrInvalidWindow`), `trip/service.go` (`Confirm`, `ClearConfirmed`), `trip/repository.go` (`tripColumns` + `SetConfirmed`), `trip/handler.go` (routes, `TripJSON` fields)
- Modify (web): `features/trip/types.ts`, `features/trip/components/suggestion-list.tsx` (Organizer "เลือกช่วงนี้" button per Window), `features/trip/api/confirm-dates.ts` (new), `features/trip/components/confirmed-dates.tsx` (new), `app/routes/trip-detail.tsx`

**Interfaces:**

```go
var (
    ErrNotOrganizer  = errors.New("only the organizer can do this")
    ErrInvalidWindow = errors.New("not a valid window for this trip")
)
func (t Trip) ConfirmedEnd() *time.Time // nil while Finding Dates
func (s *Service) Confirm(ctx context.Context, tripID uuid.UUID, v Viewer, start time.Time) (Trip, error)
func (s *Service) ClearConfirmed(ctx context.Context, tripID uuid.UUID, v Viewer) error
// Repository addition
SetConfirmed(ctx context.Context, tripID uuid.UUID, start *time.Time) error // nil clears
```

Web:
- `useConfirmDates(tripId)` (PUT) and `useClearConfirmed(tripId)` (DELETE). Both invalidate `['trips', tripId]`.
- `<ConfirmedDates trip members marks isOrganizer>`:
  - shows "ยืนยันแล้ว: start ถึง end", or "กำลังหาวัน" (Finding Dates);
  - lists Members who are Busy on any Confirmed day in red: "ไม่ว่างในวันที่ยืนยัน: …";
  - the Organizer also gets "ยกเลิกวันที่ยืนยัน".

- [ ] **Step 1: Migration `00008_trip_confirmed_start.sql`**

```sql
-- +goose Up
ALTER TABLE trips ADD COLUMN confirmed_start DATE;
ALTER TABLE trips ADD CONSTRAINT trips_confirmed_fits
    CHECK (confirmed_start IS NULL OR (confirmed_start >= start_date AND confirmed_start + duration_days - 1 <= end_date));
-- +goose Down
ALTER TABLE trips DROP CONSTRAINT IF EXISTS trips_confirmed_fits;
ALTER TABLE trips DROP COLUMN IF EXISTS confirmed_start;
```

- [ ] **Step 2: Failing tests** (`confirm_test.go`):
  - `TestConfirm_OrganizerOnly`: a non-Organizer Member → `ErrNotOrganizer`.
  - `TestConfirm_InvalidWindow` (table):
    - start before the Date Range;
    - start + Duration past the end;
    - start before today (Thailand).
    - Each case → `ErrInvalidWindow`, and nothing is saved.
  - `TestConfirm_OK`: the repo gets the start; the returned `ConfirmedEnd` = start + Duration − 1.
  - `TestClearConfirmed_OrganizerOnly`
  - Handler:
    - `TestConfirmRoute_NonOrganizer_403`
    - `TestConfirmRoute_200`: `confirmed_start`/`confirmed_end` are DateOnly strings.
    - `TestTripJSON_FindingDates_NullConfirmed`
- [ ] **Step 3: Run** the trip tests. Expected: FAIL.
- [ ] **Step 4: Implement.** Organizer check: `me.UserID == t.OrganizerID`. Error mapping: `ErrNotOrganizer` / `ErrGuestNotAllowed` → 403, `ErrInvalidWindow` → 400.
- [ ] **Step 5: Run** the full Go suite. Expected: PASS.
- [ ] **Step 6: Web.** Implement as listed.
  - Each Window card gets "เลือกช่วงนี้" for the Organizer only (`me.is_organizer`).
  - `ConfirmedDates` sits under the title. It reuses `useTripMarks` data, and the route passes the marks in.
- [ ] **Step 7: Run** the web build and lint. Expected: clean.
- [ ] **Step 8: E2E.**
  1. Ploy confirms the top Window. Expect "ยืนยันแล้ว" showing the dates.
  2. Nat (a Member) has no select buttons, and his `PUT /confirmed` → 403.
  3. Nat marks a confirmed day Busy. Expect a warning naming nat.
  4. Ploy clears the dates. Expect "กำลังหาวัน".
- [ ] **Step 9: Commit** `feat: Organizer confirms a Window as the Trip's Confirmed Dates`.

---

### Task 4: Offer to mark Confirmed Dates Busy on the Personal Calendar (slice #11)

**Files:**
- Create: `backend/migrations/00009_member_offer_answered.sql`, `backend/internal/trip/offer_test.go`
- Modify: `trip/trip.go` (`Member.OfferAnsweredStart *time.Time`), `trip/service.go` (`AnswerConfirmedOffer`, plus the prompt logic in `Get`), `trip/repository.go` (scan + `SetOfferAnswered`), `trip/handler.go` (route; `prompts` in detail)
- Create (web): `features/trip/api/answer-confirmed-offer.ts`, `features/trip/components/confirmed-offer-banner.tsx`
- Modify (web): `features/trip/types.ts` (`prompts`), `app/routes/trip-detail.tsx` (banner, then `ResyncBanner` for the confirmed days after accepting)

**Interfaces:**

```go
type Prompts struct { Repush, ConfirmedOffer bool } // Detail gains Prompts
func (s *Service) AnswerConfirmedOffer(ctx context.Context, tripID uuid.UUID, v Viewer, accept bool) error
// accept → cal.SetMarks(userID, Busy for every Confirmed day, nil); always → repo.SetOfferAnswered(member, confirmed_start)
// Repository addition
SetOfferAnswered(ctx context.Context, memberID uuid.UUID, start time.Time) error
```

`ConfirmedOffer` is true when all of these hold:
- the viewer's Member is a User;
- the trip has `confirmed_start`;
- the Member's `OfferAnsweredStart` is nil, or differs from `confirmed_start`.

So changing the Confirmed Dates asks again. Old Busy Marks are never removed (spec Q14).

- [ ] **Step 1: Migration `00009_member_offer_answered.sql`.** It adds `trip_members.offer_answered_start DATE`. The Down migration drops it.
- [ ] **Step 2: Failing tests:**
  - `TestGet_ConfirmedOffer_ShownUntilAnswered`
  - `TestGet_ConfirmedOffer_ReshownAfterDatesChange`
  - `TestGet_ConfirmedOffer_NeverForGuests`
  - `TestAnswerOffer_AcceptWritesBusyToCalendar`: Confirmed Dec 5–7 → the fake calendar gets set = Dec 5, 6, 7 busy, and clear = nil.
  - `TestAnswerOffer_DeclineWritesNothing`: the answer is still recorded.
  - `TestAnswerOffer_NotConfirmed_400`
  - `TestAnswerOfferRoute_Guest_403`
- [ ] **Step 3: Run.** Expected: FAIL.
- [ ] **Step 4: Implement.** `Get` computes `Prompts.ConfirmedOffer`. `Prompts.Repush` stays false until Task 5.
- [ ] **Step 5: Run** the full Go suite. Expected: PASS.
- [ ] **Step 6: Web.**
  - The banner reads "ทริปนี้ยืนยันวันแล้ว (start ถึง end) — ทำเครื่องหมายไม่ว่างในปฏิทินของฉันไหม?" with buttons [ใช่] and [ไม่].
  - After [ใช่], show `<ResyncBanner days={confirmed days}>`, so other pushed trips get the normal re-sync prompt.
- [ ] **Step 7: Run** the web build and lint. Expected: clean.
- [ ] **Step 8: E2E.**
  1. Ploy confirms Dec 5–7.
  2. Nat sees the offer and answers [ใช่]. Expect Dec 5–7 Busy on his `/` calendar.
  3. Reload the trip. Expect no offer.
  4. Ploy changes the dates to Dec 12–14. Expect nat to see the offer again.
  5. A Guest never sees it.
- [ ] **Step 9: Commit** `feat: offer to mark Confirmed Dates Busy on the Personal Calendar`.

---

### Task 5: Organizer edits Date Range / Duration (slice #12)

**Files:**
- Create: `backend/migrations/00010_trip_date_range_changed_at.sql`, `backend/internal/trip/update_dates_test.go`
- Modify: `trip/trip.go`, `trip/service.go` (`UpdateDates`, `Prompts.Repush`), `trip/repository.go` (`UpdateDates`), `trip/handler.go` (`PATCH /:id`)
- Create (web): `features/trip/api/update-trip-dates.ts`, `features/trip/components/edit-dates-form.tsx`, `features/trip/components/repush-banner.tsx`
- Modify (web): `app/routes/trip-detail.tsx`

**Interfaces:**

```go
type DatesUpdate struct { StartDate, EndDate time.Time; DurationDays int }
func (s *Service) UpdateDates(ctx context.Context, tripID uuid.UUID, v Viewer, in DatesUpdate) (Trip, error)
// Repository addition — one UPDATE sets dates, duration, confirmed_start (possibly NULL) and date_range_changed_at
UpdateDates(ctx context.Context, t Trip) (Trip, error)
```

Rules:
- Organizer only.
- Validation is the same as Create, except a start in the past is allowed only when it equals the current start.
- `ConfirmedStart` becomes nil when the Window no longer fits.
- `DateRangeChangedAt = now` only when a day is **added**, i.e. the new start is earlier or the new end is later.
- `Prompts.Repush` is true when all of these hold:
  - the viewer is a User Member;
  - `PushedAt != nil`;
  - `DateRangeChangedAt != nil`;
  - `DateRangeChangedAt` is after `PushedAt`.

- [ ] **Step 1: Migration `00010`.** It adds `trips.date_range_changed_at TIMESTAMPTZ`, with a Down migration.
- [ ] **Step 2: Failing tests:**
  - `TestUpdateDates_OrganizerOnly`
  - `TestUpdateDates_Validation`: duration greater than the range; a new past start; the unchanged past start → OK.
  - `TestUpdateDates_ClearsConfirmedThatNoLongerFits` (Review Focus 2)
  - `TestUpdateDates_KeepsConfirmedThatStillFits`
  - `TestUpdateDates_ExtendSetsChangedAt_ShrinkDoesNot`
  - `TestGet_Repush_AfterExtendSincePush`
  - `TestPatchTrip_NonJSON_415`
  - `TestPatchTrip_NonOrganizer_403`
- [ ] **Step 3: Run.** Expected: FAIL.
- [ ] **Step 4: Implement.**
- [ ] **Step 5: Run** the full Go suite. Expected: PASS.
- [ ] **Step 6: Web.**
  - The Organizer gets "แก้ไขช่วงวัน", which toggles `EditDatesForm` prefilled with the current values.
  - `RepushBanner` shows when `prompts.repush`: "ช่วงวันของทริปเปลี่ยน — อัปเดตจากปฏิทินของฉันอีกครั้ง?" It opens `PushPanel`.
- [ ] **Step 7: Run** the web build and lint. Expected: clean.
- [ ] **Step 8: E2E.**
  1. Nat pushes.
  2. Ploy extends the end to Dec 25. Expect the grid to show 25 rows, with the new days Unknown.
  3. Nat sees the repush banner, and the panel lists his calendar's Dec 21–25 marks.
  4. Ploy confirms Dec 18–20, then shrinks the end to Dec 15. Expect the Confirmed Dates cleared and no error.
- [ ] **Step 9: Commit** `feat: Organizer edits a Trip's Date Range and Duration`.

---

### Task 6: Organizer removes a Member, replaces the Invite Link, deletes the Trip (slice #13)

**Files:**
- Create: `backend/internal/trip/manage_test.go`
- Modify: `trip/trip.go` (`ErrCannotRemoveSelf`), `trip/service.go` (`RemoveMember`, `ReplaceInviteLink`, `Delete`), `trip/repository.go` (`DeleteMember`, `SetInviteCode`, `Delete`), `trip/handler.go` (3 routes)
- Create (web): `features/trip/api/manage-trip.ts` (`useRemoveMember`, `useReplaceInviteLink`, `useDeleteTrip`)
- Modify (web): `features/trip/components/member-list.tsx` (Organizer "นำออก"), `features/trip/components/invite-link-box.tsx` ("สร้างลิงก์ใหม่"), `app/routes/trip-detail.tsx` ("ลบทริป", behind `window.confirm`, then navigate to `/trips`)

**Interfaces:**

```go
var ErrCannotRemoveSelf = errors.New("the organizer cannot remove themselves")
func (s *Service) RemoveMember(ctx context.Context, tripID uuid.UUID, v Viewer, memberID uuid.UUID) error // member's trip_marks cascade
func (s *Service) ReplaceInviteLink(ctx context.Context, tripID uuid.UUID, v Viewer) (string, error)
func (s *Service) Delete(ctx context.Context, tripID uuid.UUID, v Viewer) error
// Repository additions
DeleteMember(ctx context.Context, tripID, memberID uuid.UUID) error // ErrNotFound if not in this trip
SetInviteCode(ctx context.Context, tripID uuid.UUID, code string) error
Delete(ctx context.Context, tripID uuid.UUID) error
```

- [ ] **Step 1: Failing tests:**
  - `TestRemoveMember_OrganizerOnly`
  - `TestRemoveMember_Self_Rejected`
  - `TestRemoveMember_OtherTrip_NotFound`
  - `TestReplaceInviteLink_NewCodeDiffers`
  - `TestDelete_OrganizerOnly`
  - Handler:
    - `TestReplaceInviteLink_OldCodeDead`: after replacing, `GET /invites/<old>` → 404 and `POST /invites/<old>/join` → 404. Uses the fake's `byCode` map.
    - `TestRemoveMemberRoute_403_404_204`
    - `TestDeleteTripRoute_204`
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement.** The fake repo's `FindByInviteCode` moves to a `codes map[string]Trip`; existing tests seed it from `byCode`.
- [ ] **Step 4: Run** the full Go suite. Expected: PASS.
- [ ] **Step 5: Web.** Implement as listed.
- [ ] **Step 6: Run** the web build and lint. Expected: clean.
- [ ] **Step 7: E2E.**
  1. Ploy removes the Guest Bank. Bank's reload shows the 404 copy, and his column is gone for ploy.
  2. Ploy replaces the link. The old link shows "ลิงก์เชิญนี้ใช้ไม่ได้…". Bank rejoins with the new link under the same name "Bank".
  3. Ploy deletes the trip. Expect `/trips` without it.
- [ ] **Step 8: Commit** `feat: Organizer removes Members, replaces the Invite Link, deletes a Trip`.

---

### Task 7: Member leaves a Trip (slice #14)

**Files:**
- Modify: `trip/trip.go` (`ErrOrganizerCannotLeave`), `trip/service.go` (`Leave`), `trip/handler.go` (`DELETE /:id/members/me`, registered **before** `/:id/members/:memberId`), tests
- Modify (web): `features/trip/api/manage-trip.ts` (`useLeaveTrip`), `app/routes/trip-detail.tsx` ("ออกจากทริป" for non-Organizers behind `window.confirm`; then a User goes to `/trips` and a Guest to `/`)

**Interfaces:**

```go
var ErrOrganizerCannotLeave = errors.New("the organizer cannot leave; delete the trip instead")
func (s *Service) Leave(ctx context.Context, tripID uuid.UUID, v Viewer) error // reuses repo.DeleteMember
```

- [ ] **Step 1: Failing tests:**
  - `TestLeave_Member_DeletesOwnRow`
  - `TestLeave_Organizer_Rejected`
  - `TestLeave_Guest_OK`
  - `TestLeaveRoute_NotShadowedByMemberID`: `DELETE /trips/:id/members/me` → 204, not a uuid-parse 404.
  - `TestLeaveRoute_Organizer_400`
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** the full Go suite. Expected: PASS.
- [ ] **Step 5: Web.** Implement as listed.
- [ ] **Step 6: Run** the web build and lint. Expected: clean.
- [ ] **Step 7: E2E.**
  1. Nat leaves. Expect `/trips` without the trip, and ploy's grid without nat.
  2. Nat rejoins through the link under the name "nat". Expect it to work, which shows the name was freed.
  3. Ploy has no leave button, and her API call gets 400.
- [ ] **Step 8: Commit** `feat: Members leave a Trip`.

---

### Task 8: Guest signs up and keeps their place and Marks (slice #15)

**Files:**
- Modify: `trip/service.go` (`ClaimGuestMemberships`), `trip/repository.go` (`ClaimGuest`), `trip/handler.go` (`POST /claim-guest`, registered before `/:id`), tests
- Modify (web): `web/src/features/auth/api/login.ts`, `web/src/features/auth/api/register.ts`. After a successful login, call `POST /api/v1/trips/claim-guest` and ignore failures, then invalidate everything except `['me']`.

**Interfaces:**

```go
func (s *Service) ClaimGuestMemberships(ctx context.Context, userID uuid.UUID, guestTokenHash string) (int, error)
// Repository addition — converts this device's Guest rows to the User, skipping Trips where the User is already a Member:
// UPDATE trip_members SET user_id = $1, guest_token_hash = NULL
// WHERE guest_token_hash = $2 AND trip_id NOT IN (SELECT trip_id FROM trip_members WHERE user_id = $1)
ClaimGuest(ctx context.Context, userID uuid.UUID, guestTokenHash string) (int, error)
```

`Service.findMember`'s Guest fallback stays, for the skipped already-a-Member case.

- [ ] **Step 1: Failing tests:**
  - `TestClaimGuest_PassesHash`
  - `TestClaimGuest_NoGuestCookie_ZeroWithoutRepoCall`
  - `TestClaimRoute_NotShadowedById`: `POST /trips/claim-guest` → 200 `{claimed: n}`.
  - `TestClaimRoute_RequiresLogin_401`
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** the full Go suite. Expected: PASS.
- [ ] **Step 5: Web.** Implement as listed.
- [ ] **Step 6: Run** the web build and lint. Expected: clean.
- [ ] **Step 7: E2E.**
  1. In a fresh context, join as the Guest "Bank" and mark Dec 5.
  2. Register an account in the same context. Expect `/trips` to list the trip, and the "แขก" badge to be gone.
  3. Log in from a *new* context with the same account. Expect the trip to open with Bank's Dec 5 mark, which proves this works across devices now.
- [ ] **Step 9: Commit** `feat: a Guest who signs up keeps their place and Marks`.

---

## After Task 8

Final whole-branch review (fresh reviewer, Opus), fix pass, then the finishing-a-development-branch menu.
