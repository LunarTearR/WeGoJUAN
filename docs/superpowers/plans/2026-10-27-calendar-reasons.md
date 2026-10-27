# Calendar Reasons & Trips-first Landing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a User write a private **Reason** on Busy days of their Personal Calendar, edit the calendar through a day panel (with an "until" date for ranges), see a month summary of busy days, and land on ทริปของฉัน after login.

**Architecture:** The Reason is a nullable column on `availability`, only allowed with `busy`. It travels on `availability.Mark` (empty for trip marks, which never store it). The trip package only touches it in two owner-only paths:
- **Accepting the Confirmed-Dates offer:** a new `Calendar.MarkBusy` that fills the trip title without overwriting an existing Reason.
- **Push preview:** shows `calendar_reason` to the owner only.

The web side reuses the shared `MonthGrid`/`MonthNav`.

**Spec:** `CONTEXT.md` (**Reason**, **Push**, **Personal Calendar**), `docs/adr/0001-trips-hold-snapshot-marks.md`. Screen decisions come from the grilling session (2026-10-27):
- `/` → `/trips`; the calendar at `/calendar`.
- The panel has ว่าง / ไม่ว่าง / ไม่ระบุ + Reason (Busy only) + an optional "ถึงวันที่" (until) date.
- A range overwrites every day in it, and the panel shows "จะเปลี่ยน N วัน".
- A month summary list groups consecutive Busy days with the same Reason, plus a dot on days that have a Reason.
- The push panel shows the Reason to its owner.

## Global Constraints

- A **Reason** is trimmed, at most **60** runes, and allowed only with `status: "busy"`. Sending a non-empty Reason with free/null gives **400**. An empty Reason is stored as NULL.
- Changing a day to free, or clearing it, removes its Reason. That follows from the column CHECK and the upsert writing `reason`.
- Trip marks never store a Reason. `PUT /trips/:id/marks/me` ignores it, and Push copies status only.
- The "until" range is at most **366** days (the existing `MaxChanges`).
- Accepting the offer marks each Confirmed day `busy`, with `reason = COALESCE(existing reason, trip title)`.
- Everything else from the previous plans still holds: CONTEXT.md terms, Thai comments and UI, TDD, one commit per task, the `Co-Authored-By` trailer.

## Review Focus

1. A Reason never appears in any response another Member can see: trip marks, suggestions, trip detail. Pinned by `TestTripMarks_NeverCarryReason`.
2. Busy → Free on a day with a Reason drops the Reason, so it doesn't come back when the day is set Busy again. `TestSave_FreeDropsReason` (repo verified live) + E2E.
3. Accepting the offer never overwrites a User's own Reason, but fills empty Busy days and turns Free days Busy with the title. Live SQL check + `TestAnswerOffer_UsesMarkBusyWithTitle`.
4. `/` while logged out still goes through login and then lands on `/trips`. Old `/` links keep working through the redirect. E2E.
5. The "until" date before the selected day, or more than 366 days later, is refused in the panel and never sent. E2E.

---

### Task 1: Reason storage & API (backend)

**Files:** `backend/migrations/00011_availability_reason.sql`, `internal/availability/{availability.go, changes.go, repository.go, handler.go}` + tests.

**Interfaces:**
- `Mark.Reason string` ("" = none; only on the Personal Calendar)
- `ChangeRequest.Reason *string json:"reason"`
- `ErrInvalidReason`
- `const MaxReasonRunes = 60`
- `markResponse.Reason string json:"reason,omitempty"`

- [ ] **Migration:** `ALTER TABLE availability ADD COLUMN reason VARCHAR(60), ADD CONSTRAINT availability_reason_only_busy CHECK (reason IS NULL OR status = 'busy')`. Down drops both.
- [ ] **Failing tests:**
  - `TestParseChanges_Reason` (table):
    - busy + `" workday "` → `"workday"`;
    - busy + 61 runes → `ErrInvalidReason`;
    - free + `"x"` → `ErrInvalidReason`;
    - null + `"x"` → `ErrInvalidReason`;
    - busy without a reason → `""`.
  - `TestListMine_ReturnsReason`: `[{"day":"2026-12-05","status":"busy","reason":"workday"}]`, with the key omitted when empty.
  - `TestSetMarks_InvalidReason_400`
- [ ] **Implement:**
  - The repo upsert writes `reason` (NULLIF empty) on insert and on conflict.
  - `ListByUser` scans `COALESCE(reason, '')`.
- [ ] **Verify:** `go test ./...` passes. Live curl: busy+reason → listed; set free → the Reason is gone; busy again → no Reason.
- [ ] **Commit:** `feat: private Reason on Busy days of the Personal Calendar`

### Task 2: Offer fills trip title; push preview shows Reason (backend)

**Files:** `internal/availability/{service.go, repository.go}`, `internal/trip/{service.go, push.go, handler.go}` + tests, `cmd/api/main.go` (unchanged wiring).

**Interfaces:**
- `availability.Service.MarkBusy(ctx, userID string, days []time.Time, reason string) error`
- `Repository.MarkBusy(...)`: upsert `status='busy'`, `reason = COALESCE(availability.reason, NULLIF($reason,''))`
- `trip.Calendar` becomes `{ ListByUser; MarkBusy }`; `SetMarks` is removed from the interface because no trip code uses it.
- `PushDay.CalendarReason string`
- `pushDayResponse.CalendarReason string json:"calendar_reason,omitempty"`

- [ ] **Failing tests:**
  - `TestAnswerOffer_UsesMarkBusyWithTitle`: the fake calendar gets the days Dec 5–7 and reason = trip title.
  - `TestPushPreview_IncludesOwnReason`
  - `TestTripMarks_NeverCarryReason`: `PUT /trips/:id/marks/me` with a reason → the saved Mark has `Reason == ""`.
  - `TestMarkBusy_PassesReason` (availability service)
- [ ] **Implement:**
  - Trip `SaveMarks` stores status only (already the case). The trip handler zeroes `Reason` after `ParseChanges`.
- [ ] **Verify:** `go test ./...` passes. Live: accept the offer on a day that already has the Reason "workday" → it's kept; on a Free day → becomes Busy with the title.
- [ ] **Commit:** `feat: fill the trip title as Reason when accepting Confirmed Dates; show own Reasons in Push`

### Task 3: Trips-first landing (web)

**Files:** `web/src/app/router.tsx`, `web/src/components/layout/app-shell.tsx`, `web/src/features/trip/components/trip-list.tsx`.

- [ ] **E2E first** (`landing.mjs`):
  - logged-out `/` → `/login?next=%2F`;
  - after login → `/trips`;
  - the logo links to `/trips`;
  - the nav shows ทริปของฉัน, then ปฏิทินของฉัน (`/calendar`);
  - `/calendar` shows the calendar;
  - an empty trips list links to `/calendar`.
- [ ] **Implement:**
  - The index route is `<Navigate to="/trips" replace />` inside `RequireUser`, and the calendar route is `calendar`.
  - The nav order and the brand link change as above.
  - The empty state gets the line "ระบุวันว่างในปฏิทินของฉัน" linking to `/calendar`.
- [ ] **Verify:** build, lint, `landing.mjs` passes.
- [ ] **Commit:** `feat(web): land on ทริปของฉัน; Personal Calendar moves to /calendar`

### Task 4: Calendar day panel, until-date, summary list, push Reason (web)

**Files:**
- Create: `web/src/features/availability/components/calendar-day-panel.tsx`, `web/src/features/availability/components/busy-summary.tsx`, `web/src/features/availability/utils/busy-runs.ts`
- Modify: `month-calendar.tsx`, `types/mark.ts` (`reason?`), `lib/mark.ts` (`applyChanges` carries reason), `app/routes/calendar.tsx` (`onSaved(days[])`), `features/trip/types.ts` + `push-panel.tsx` (`calendar_reason`)

**Interfaces:**
- `busyRuns(marks: Mark[]): { from: ISODate; to: ISODate; reason: string }[]` — consecutive busy days with the same Reason, in day order
- `<CalendarDayPanel day mark onSaved />` — the panel:
  - local status choice and a Reason input (shown only for busy, `maxLength=60`);
  - an optional until date (`min = day`, max = day + 365);
  - a save button "บันทึก (จะเปลี่ยน N วัน)";
  - sends `eachDay(day, until)` changes with `{status, reason}`.

- [ ] **E2E first** (`reasons.mjs`):
  - Tap Dec 15 → ไม่ว่าง, reason "workday", until Dec 19 → save. Expect 5 Busy days and the summary row "15–19 … · workday".
  - The dot shows on the 17th.
  - Set the 17th to ว่าง → the summary splits into 15–16 and 18–19, and the 17th has no dot.
  - The push panel on a trip covering those days shows "(workday)".
  - A friend's trip view has no "workday" anywhere.
- [ ] **Implement:**
  - Tapping a cell selects a day (no more cycling).
  - The panel and summary go below the grid.
  - Tapping a summary row selects its first day.
- [ ] **Update older E2E scripts:**
  - `tapUntil` clicks the panel's status button and then "บันทึก…" when present;
  - the scripts that opened `/` for the calendar now open `/calendar`;
  - task1 expects ทริปของฉัน after register.
- [ ] **Verify:** build, lint, `reasons.mjs` and every E2E script pass.
- [ ] **Commit:** `feat(web): Personal Calendar day panel with Reason, until-date and busy summary`

## After Task 4

Fresh Opus review of the whole branch → fix pass → PR to `dev`.
