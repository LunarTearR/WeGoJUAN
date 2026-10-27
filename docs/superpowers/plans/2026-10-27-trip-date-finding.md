# Trip Date Finding (core loop) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the date-finding core loop end to end: log in on the web → Personal Calendar → Organizer creates a Trip → Members join by Invite Link (as User or Guest) → everyone marks days on the Trip → ranked suggested Windows.

**Architecture:** Go/Fiber backend with one package per domain area (`user`, `availability`, `trip`), each split into domain types / service (logic, tested with fake repos) / Postgres repository (pgx, thin SQL) / handler (Fiber, tested with `app.Test`). The `event` package is replaced by `trip`. A Trip stores its own Marks per Member and never reads a Personal Calendar (ADR-0001). The React web app (Vite proxy → same origin, so the httpOnly session cookie just works) adds one feature folder per area.

**Tech Stack:** Go 1.26, Fiber v3, pgx v5, goose migrations, Postgres 17; React 19, react-router 8, TanStack Query 5, Tailwind 4, TypeScript 6.

**Spec:** `CONTEXT.md` (glossary — all names come from here) and `docs/adr/0001-trips-hold-snapshot-marks.md`. Slices map to the grilled breakdown: Task 1 = slice #1, Task 2 = #3, Task 3 = #2, Task 4 = #4, Task 5 = #5, Task 6 = #6, Task 7 = #7. (#3 runs before #2 because deleting `event` is what frees `availability.ListByUsers` for removal.)

## Global Constraints

- Code and UI use the `CONTEXT.md` terms only: Trip (never Event), Organizer (never Owner), Member, User, Guest, Mark, Free/Busy/Unknown, Date Range, Duration, Window, Available, Invite Link.
- A Mark status is exactly `"free"` or `"busy"`. No `"maybe"`. A day with no Mark is Unknown and is never treated as Free.
- API dates are `"YYYY-MM-DD"` strings (`time.DateOnly`), parsed to UTC midnight in Go. Web keeps them as `ISODate` strings and never does `new Date("YYYY-MM-DD")`.
- "Today" means the date in Thailand (fixed UTC+7, no DST).
- Errors go through `fiber.NewError(code, msg)` → `{"error": msg}`. A Trip the viewer is not a Member of returns **404** (never 403), so its existence doesn't leak.
- Date Range: start ≥ today at creation, end ≥ start, at most 365 days. Duration: 1 ≤ Duration ≤ number of days in the Date Range. Title: trimmed, 1–100 runes. Member display name: trimmed, 1–50 runes, unique per Trip case-insensitively.
- Code comments in Thai, matching the existing code. UI copy in Thai.
- Migrations: goose `-- +goose Up` / `-- +goose Down`, files `backend/migrations/0000N_<name>.sql`, continuing from `00002`.
- Go tests: stdlib `testing` with fake repositories, no DB in unit tests. Web has no unit-test framework, and this plan does not add one. Web is verified with `npm run build`, `npm run lint`, and a browser E2E pass.
- One commit per task, conventional message, ending with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. No push.

## Review Focus

1. **Timezone edge on "today":** at 23:30 UTC it is already the next day in Thailand. A Trip starting "today (Thai)" must be accepted, and Windows starting "yesterday (Thai)" must be skipped. Pinned in Task 2 (`TestToday_UsesThailandDate`) and Task 7 (`TestSuggestions_SkipsWindowsStartingBeforeToday`).
2. **Malformed path IDs** (`/trips/not-a-uuid`) must give 404, not 500. Pinned in Task 2 (`TestGetTrip_MalformedID_404`).
3. **Duplicate days in one PUT body** (`[{"day":"2026-12-05",...},{"day":"2026-12-05",...}]`) must give 400, not a Postgres "cannot affect row a second time" 500. Huge bodies (>366 changes) must give 400. Pinned in Task 3 (`TestParseChanges`).
4. **Display names differing only by case or whitespace** (`"Nat"` vs `" nat "`) count as taken. The handler trims, and the DB index is on `lower(display_name)`. Pinned in Task 4 (`TestJoin_TrimsDisplayName`) and Task 6 (`TestJoinAsGuest_NameTaken_409`).
5. **Open redirect through `?next=`:** `next=//evil.com` or `next=https://evil.com` must land on `/`. Pinned in Task 1 E2E step (no web unit tests).

---

## Shared API contract (built up across tasks)

| Method & path | Body | Response | Task |
|---|---|---|---|
| `GET /api/v1/users/me` | — | `{id, display_name, email}` / 401 | exists |
| `POST /api/v1/users/register` | `{display_name, email, password}` | 201 | exists |
| `POST /api/v1/users/login` | `{email, password}` | me + session cookie | exists |
| `POST /api/v1/users/logout` | — | 204 | exists |
| `GET /api/v1/availability?from&to` | — | `[{day, status}]` | 3 |
| `PUT /api/v1/availability` | `[{day, status: "free"\|"busy"\|null}]` | 204 | 3 |
| `POST /api/v1/trips` | `{title, start_date, end_date, duration_days}` | 201 `TripJSON` | 2 |
| `GET /api/v1/trips` | — | `[TripJSON]` (User's trips) | 2 |
| `GET /api/v1/trips/:id` | — | `{trip: TripJSON, members: [MemberJSON], me: MemberJSON}` | 2 |
| `GET /api/v1/invites/:code` | — | `{trip_id, title, start_date, end_date, duration_days, is_member}` | 4 |
| `POST /api/v1/invites/:code/join` | `{display_name?}` | `{trip_id, member: MemberJSON}` / 409 | 4 (User), 6 (Guest) |
| `GET /api/v1/trips/:id/marks` | — | `[{member_id, day, status}]` | 5 |
| `PUT /api/v1/trips/:id/marks/me` | `[{day, status\|null}]` | 204 | 5 |
| `GET /api/v1/trips/:id/suggestions` | — | `[{start, end, available: [member_id], busy: [...], unknown: [...]}]` | 7 |

`TripJSON = {id, title, start_date, end_date, duration_days, organizer_id, invite_code}`
`MemberJSON = {id, display_name, is_organizer, is_guest}` (`is_guest` is always false until Task 6)

## E2E environment (used by every task's verify step)

- Postgres: `make db` from the repo root starts it on `localhost:5434` and runs `goose up`. Re-run it after adding a migration.
- API: `make air` hot-reloads `backend/` on `:8080` using `backend/.env`. It may already be running. Check with `ss -ltnp | grep 8080`.
- Web: `cd web && npm run dev` (background) → `http://localhost:5173`, which proxies `/api` to `:8080`.
- Drive the browser with the Playwright MCP tools. Create test Users with `curl -X POST localhost:8080/api/v1/users/register -H 'Content-Type: application/json' -d '{"display_name":"ploy","email":"ploy@test.dev","password":"Secret#123"}'` (same pattern for `nat@test.dev`).

## Before Task 1

- [ ] Commit the docs from the grilling session plus this plan:

```bash
git add CONTEXT.md docs/
git commit -m "docs: add domain glossary, snapshot-marks ADR, and core-loop plan"
```

---

### Task 1: Sign up & log in from the web (slice #1)

Backend is unchanged: the `/users` endpoints already exist.

**Files:**
- Create: `web/src/features/auth/types.ts`, `web/src/features/auth/api/get-me.ts`, `web/src/features/auth/api/login.ts`, `web/src/features/auth/api/register.ts`, `web/src/features/auth/api/logout.ts`, `web/src/features/auth/components/login-form.tsx`, `web/src/features/auth/components/register-form.tsx`, `web/src/features/auth/components/require-user.tsx`, `web/src/features/auth/utils/safe-next.ts`, `web/src/app/routes/login.tsx`, `web/src/app/routes/register.tsx`
- Modify: `web/src/app/router.tsx`, `web/src/components/layout/app-shell.tsx`

**Interfaces:**
- Produces:
  - `type Me = { id: string; display_name: string; email: string }`
  - `useMe(): UseQueryResult<Me | null>` with queryKey `['me']`, `retry: false`. A 401 resolves to `null`; other errors throw.
  - `useLogin()`: mutation `({email, password}) => Me`. On success it does `setQueryData(['me'], me)`.
  - `useRegister()`: mutation `({display_name, email, password}) => Me`. It registers, then logs in, then sets `['me']`.
  - `useLogout()`: mutation. On success it calls `queryClient.clear()` and then `setQueryData(['me'], null)`.
  - `<RequireUser />`: layout route. While pending it shows loading. If `null`, it renders `<Navigate to={"/login?next=" + encodeURIComponent(pathname + search)} replace />`. Otherwise it renders `<Outlet />`.
  - `safeNext(next: string | null): string`: returns `next` only if it starts with `/` and not `//`. Otherwise it returns `"/"`.

- [ ] **Step 1: Implement the auth feature files listed above.** Each API file follows the `get-my-marks.ts` pattern (an `apiFetch` function plus a hook). The forms show `ApiError.message` under the submit button. After login or register, navigate to `safeNext(searchParams.get('next'))`. The register form links to `/login` and back, keeping `next`.
- [ ] **Step 2: Wire routes.** `router.tsx`: add `login` and `register` routes, and wrap the index `CalendarRoute` in a `RequireUser` layout route. `app-shell.tsx`: on the right, show `me.display_name` and a "ออกจากระบบ" button when logged in, or a "เข้าสู่ระบบ" link when not, next to `ApiStatus`. Add a nav link "ปฏิทินของฉัน" → `/`.
- [ ] **Step 3: Build and lint**

Run: `cd web && npm run build && npm run lint`
Expected: exits 0, no type errors, no lint errors.

- [ ] **Step 4: E2E check**
  1. Open `/` while logged out. Expect a redirect to `/login?next=%2F`.
  2. Register `ploy@test.dev` through the form. Expect to land on `/` showing "ปฏิทินของฉัน", with "ploy" in the header.
  3. Log out. Expect `/` to redirect to login again.
  4. Log in with a wrong password. Expect the error text "invalid email or password".
  5. Open `/login?next=//evil.com` and log in. Expect to land on `/` on localhost (Review Focus 5).

- [ ] **Step 5: Commit**

```bash
git add web/src
git commit -m "feat(web): sign up, log in and log out"
```

---

### Task 2: Organizer creates a Trip (slice #3; replaces `event` with `trip`)

**Files:**
- Delete: `backend/internal/event/` (whole package), `web/src/features/event/`, `web/src/app/routes/event-detail.tsx`
- Create: `backend/migrations/00003_create_trips.sql`, `backend/internal/trip/trip.go`, `backend/internal/trip/dates.go`, `backend/internal/trip/service.go`, `backend/internal/trip/repository.go`, `backend/internal/trip/handler.go`, `backend/internal/trip/service_test.go`, `backend/internal/trip/handler_test.go`
- Modify: `backend/cmd/api/main.go` (drop event wiring, mount `/trips`), `backend/internal/availability/service.go` + `repository.go` (remove `ListByUsers`, which is orphaned by deleting `event`)
- Create (web): `web/src/lib/date.ts`, `web/src/features/trip/types.ts`, `web/src/features/trip/api/create-trip.ts`, `web/src/features/trip/api/get-my-trips.ts`, `web/src/features/trip/api/get-trip.ts`, `web/src/features/trip/components/create-trip-form.tsx`, `web/src/features/trip/components/trip-list.tsx`, `web/src/features/trip/components/member-list.tsx`, `web/src/app/routes/trips.tsx`, `web/src/app/routes/trip-new.tsx`, `web/src/app/routes/trip-detail.tsx`
- Modify (web): `web/src/app/router.tsx`, `web/src/components/layout/app-shell.tsx` (nav link "ทริปของฉัน" → `/trips`)

**Interfaces:**
- Produces (Go, package `trip`):

```go
var (
    ErrNotFound    = errors.New("trip not found")
    ErrInvalidTrip = errors.New("invalid trip") // wrapped: fmt.Errorf("%w: <reason>", ErrInvalidTrip)
)

type Trip struct {
    ID, OrganizerID      uuid.UUID
    Title                string
    StartDate, EndDate   time.Time // Date Range, UTC midnight
    DurationDays         int
    InviteCode           string
    CreatedAt            time.Time
}
type NewTrip struct { Title string; StartDate, EndDate time.Time; DurationDays int }
type Member struct {
    ID, TripID  uuid.UUID
    UserID      uuid.UUID // uuid.Nil = Guest (Task 6)
    DisplayName string
    JoinedAt    time.Time
}
func (m Member) IsGuest() bool
type Viewer struct { UserID uuid.UUID } // Task 6 adds GuestTokenHash
type Detail struct { Trip Trip; Members []Member; Me Member }

type Repository interface {
    Create(ctx context.Context, t Trip) (Trip, error) // one tx: insert trip + Organizer's member row (name from users.display_name)
    FindByID(ctx context.Context, id uuid.UUID) (Trip, error)
    ListByUser(ctx context.Context, userID uuid.UUID) ([]Trip, error) // trips the User is a Member of, newest first
    FindMember(ctx context.Context, tripID uuid.UUID, v Viewer) (Member, error) // ErrNotFound if not a Member
    Members(ctx context.Context, tripID uuid.UUID) ([]Member, error) // ordered by joined_at
}

func NewService(repo Repository) *Service // s.now = time.Now; tests overwrite s.now
func (s *Service) Create(ctx context.Context, organizerID uuid.UUID, in NewTrip) (Trip, error)
func (s *Service) ListMine(ctx context.Context, userID uuid.UUID) ([]Trip, error)
func (s *Service) Get(ctx context.Context, tripID uuid.UUID, v Viewer) (Detail, error)

func Today(now time.Time) time.Time   // Thailand date as UTC midnight (dates.go)
func rangeDays(from, to time.Time) int // inclusive day count (dates.go)
func NewHandler(svc *Service, auth *auth.Manager) *Handler // RegisterRoutes: POST "/", GET "/", GET "/:id", all requireAuth for now
```

- Produces (web): `type Trip`, `type Member`, `type TripDetail` matching TripJSON/MemberJSON. `useCreateTrip()`, `useMyTrips()` (key `['trips']`), `useTrip(id)` (key `['trips', id]`). In `lib/date.ts`: `todayISO(): ISODate` (local date) and `eachDay(from: ISODate, to: ISODate): ISODate[]` (UTC arithmetic via `Date.UTC`, inclusive).

- [ ] **Step 1: Migration `00003_create_trips.sql`**

```sql
-- +goose Up
CREATE TABLE trips (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizer_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title         VARCHAR(100) NOT NULL,
    start_date    DATE NOT NULL,
    end_date      DATE NOT NULL,
    duration_days INT NOT NULL,
    invite_code   TEXT NOT NULL UNIQUE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (start_date <= end_date),
    CHECK (duration_days BETWEEN 1 AND end_date - start_date + 1)
);
CREATE TABLE trip_members (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id      UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    display_name VARCHAR(50) NOT NULL,
    joined_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (trip_id, user_id)
);
CREATE UNIQUE INDEX trip_members_trip_display_name ON trip_members (trip_id, lower(display_name));
-- +goose Down
DROP TABLE IF EXISTS trip_members;
DROP TABLE IF EXISTS trips;
```

Run: `make db`. Expected: `goose: successfully migrated database to version: 3`.

- [ ] **Step 2: Write failing tests** in `service_test.go` (fake repo records `created []Trip`; `s.now` fixed to `2026-11-01T05:00:00Z`):
  - `TestToday_UsesThailandDate`: `Today(2026-11-01T23:30:00Z)` == `2026-11-02` UTC midnight; `Today(2026-11-01T16:59:00Z)` == `2026-11-01`.
  - `TestCreate_Validation` (table): each case → `errors.Is(err, ErrInvalidTrip)` and nothing passed to repo: title `"   "`; title of 101 runes; start `2026-10-31` (before today); end before start; Date Range of 366 days; duration 0; duration 4 with a 3-day range.
  - `TestCreate_OK`: title `"  Chiang Mai  "`, `2026-12-01..2026-12-20`, duration 3 → repo got `Title == "Chiang Mai"`, `OrganizerID == organizerID`, `len(InviteCode) == 22`; and a second create gets a different code.
  - `TestCreate_StartTodayThai_OK`: `s.now = 2026-11-01T23:30:00Z`, start `2026-11-02` → no error.
  - `TestGet_NonMember_NotFound`: fake `FindMember` returns `ErrNotFound` → `Get` returns `ErrNotFound`.
- [ ] **Step 3: Run** `cd backend && go test ./internal/trip/ -run 'TestToday|TestCreate|TestGet'`. Expected: FAIL (does not compile).
- [ ] **Step 4: Implement** `trip.go`, `dates.go`, and `service.go`. Thailand is `time.FixedZone("ICT", 7*60*60)`. The invite code is 16 bytes from `crypto/rand`, encoded with `base64.RawURLEncoding`. `Get` calls `FindMember` first, then `FindByID` and `Members`.
- [ ] **Step 5: Run** the same command. Expected: PASS.
- [ ] **Step 6: Write failing handler tests** in `handler_test.go`. Use the same `newTestApp`/`request` helper style as `user/handler_test.go`. For login, `newTestApp` also registers `POST /test-login/:id`, which calls `m.Login(c, c.Params("id"))`, and the helper `loginAs(t, app, userID) *http.Cookie` returns its cookie. Later tasks reuse `loginAs`.
  - `TestTripRoutes_RequireLogin`: POST `/trips`, GET `/trips`, GET `/trips/<uuid>` with no cookie → 401.
  - `TestCreateTrip_BadDate_400`: `start_date: "2026/12/01"` → 400.
  - `TestCreateTrip_Invalid_400`: duration 0 → 400, body `error` starts with `"invalid trip"`.
  - `TestCreateTrip_201`: response JSON has `start_date == "2026-12-01"`, `duration_days == 3`, a non-empty `invite_code`, and `organizer_id` equal to the logged-in user.
  - `TestGetTrip_MalformedID_404`: GET `/trips/not-a-uuid` → 404 (Review Focus 2).
  - `TestGetTrip_200`: body has `trip.title`, `members[0].is_organizer == true`, `me.id == members[0].id`.
- [ ] **Step 7: Run** `go test ./internal/trip/`. Expected: FAIL.
- [ ] **Step 8: Implement** `handler.go` and `repository.go`. Map errors: `ErrInvalidTrip` → 400 with `err.Error()`, `ErrNotFound` → 404. In `repository.go`, `Create` uses `pgx.BeginFunc`, and the member insert is `INSERT INTO trip_members (trip_id, user_id, display_name) SELECT $1, id, display_name FROM users WHERE id = $2`. Delete `internal/event/`. Remove `ListByUsers` from availability. Update `main.go` so `Mount{Prefix: "/trips", Routes: trip.NewHandler(tripSvc, authManager)}` replaces both the `/events` mount and the availability → event wiring.
- [ ] **Step 9: Run** `go build ./... && go vet ./... && go test ./...`. Expected: all PASS.
- [ ] **Step 10: Web.** Delete `features/event` and the `event-detail` route. Implement the web files listed above:
  - `create-trip-form`: title, `<input type="date">` for start and end (`min={todayISO()}`), and a number input for Duration (`min=1`). On success, navigate to `/trips/:id`.
  - `trips` route: lists `useMyTrips()` and links to `/trips/new`.
  - `trip-detail`: shows the title, Date Range, Duration, and `member-list` (marking the Organizer).
  - `router.tsx`: `trips`, `trips/new` and `trips/:tripId` go inside `RequireUser`.
- [ ] **Step 11: Run** `cd web && npm run build && npm run lint`. Expected: exits 0.
- [ ] **Step 12: E2E check.** Logged in as ploy:
  1. Create "เชียงใหม่", Dec 1–20, 3 days. Expect to land on the detail page with ploy listed as Organizer.
  2. Submit a Duration of 30 for a 20-day range. Expect the error "invalid trip: …".
  3. `/trips` lists the trip.
- [ ] **Step 13: Commit**

```bash
git add -A backend web/src
git commit -m "feat: Organizer creates a Trip (replace event package with trip)"
```

---

### Task 3: Personal Calendar — mark days Free / Busy / clear (slice #2)

**Files:**
- Create: `backend/migrations/00004_create_availability.sql`, `backend/internal/availability/changes.go`, `backend/internal/availability/changes_test.go`, `backend/internal/availability/service_test.go`, `backend/internal/availability/handler_test.go`
- Modify: `backend/internal/availability/availability.go` (remove `StatusMaybe`), `service.go`, `repository.go`, `handler.go`
- Create (web): `web/src/features/availability/api/save-my-marks.ts`, `web/src/features/availability/utils/next-status.ts`
- Modify (web): `web/src/features/availability/types.ts` (`Status = 'free' | 'busy'`), `web/src/features/availability/components/month-calendar.tsx`, `web/src/app/routes/calendar.tsx`

**Interfaces:**
- Produces (Go, package `availability`; Task 5 reuses `ChangeRequest`/`ParseChanges`/`ParseDay`):

```go
const MaxChanges = 366
var ErrInvalidDay = errors.New("invalid day") // wrapped with the reason
type ChangeRequest struct {
    Day    string  `json:"day"`
    Status *Status `json:"status"` // null = clear the Mark (day becomes Unknown)
}
func ParseDay(s string) (time.Time, error) // time.DateOnly → UTC midnight; ErrInvalidDay
func ParseChanges(reqs []ChangeRequest) (set []Mark, clear []time.Time, err error)
// ErrInvalidDay for a bad date, a duplicate day, or len(reqs) > MaxChanges; ErrInvalidStatus for a status other than free/busy

type Repository interface {
    Save(ctx context.Context, userID string, set []Mark, clear []time.Time) error // one tx: upsert set, delete clear
    ListByUser(ctx context.Context, userID string, from, to time.Time) ([]Mark, error) // ordered by day
}
func (s *Service) SetMarks(ctx context.Context, userID string, set []Mark, clear []time.Time) error
func (s *Service) ListByUser(ctx context.Context, userID string, from, to time.Time) ([]Mark, error)
```

- Produces (web): `useSaveMyMarks()`: mutation `(changes: {day: ISODate; status: Status | null}[])`. It invalidates `['availability', 'me']`. Also `nextStatus(s: Status | null): Status | null` (null → free → busy → null).

- [ ] **Step 1: Migration `00004_create_availability.sql`**

```sql
-- +goose Up
CREATE TABLE availability (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    day     DATE NOT NULL,
    status  TEXT NOT NULL CHECK (status IN ('free', 'busy')),
    PRIMARY KEY (user_id, day)
);
-- +goose Down
DROP TABLE IF EXISTS availability;
```

Run: `make db`. Expected: migrated to version 4.

- [ ] **Step 2: Write failing tests**:
  - `TestParseChanges` (table in `changes_test.go`):
    - free + busy + null → 2 set and 1 clear.
    - `"maybe"` → `ErrInvalidStatus`.
    - `"2026-13-01"` → `ErrInvalidDay`.
    - the same day twice → `ErrInvalidDay` (Review Focus 3).
    - 367 entries → `ErrInvalidDay`.
  - `TestSetMarks_PassesSetAndClearToRepo` in `service_test.go`.
  - In `handler_test.go`:
    - `TestListMine_RequiresFromTo_400`
    - `TestListMine_RangeOver366Days_400`
    - `TestListMine_ReturnsDateOnly`: body `[{"day":"2026-12-05","status":"busy"}]`.
    - `TestSetMarks_Maybe_422`
    - `TestSetMarks_DuplicateDay_400`
    - `TestSetMarks_204`
    - `TestAvailability_RequiresLogin_401`: build the handler mounted behind `auth.Require()`, the same way `main.go` does.
- [ ] **Step 3: Run** `cd backend && go test ./internal/availability/`. Expected: FAIL.
- [ ] **Step 4: Implement** `changes.go`, the service, the repository, and the handler.
  - `Save` uses `pgx.BeginFunc`: an `INSERT … ON CONFLICT (user_id, day) DO UPDATE SET status = EXCLUDED.status` per set Mark, then `DELETE … WHERE user_id = $1 AND day = ANY($2)` when clear is non-empty.
  - Handler `listMine`: `from` and `to` are required (`ParseDay`), `from ≤ to`, span ≤ 366 days, else 400.
  - Handler `setMarks`: `ErrInvalidStatus` → 422, `ErrInvalidDay` → 400, success → 204.
- [ ] **Step 5: Run** `go test ./...`. Expected: PASS.
- [ ] **Step 6: Web.**
  - `month-calendar.tsx`: a Sunday-first 7-column grid for the given month, with prev/next month buttons. Day colours: Free = green, Busy = red, Unknown = gray outline. Add a legend "ว่าง / ไม่ว่าง / ยังไม่ระบุ". Tapping a day saves `[{day, status: nextStatus(current)}]`.
  - `calendar.tsx` owns the `{year, month}` state.
  - Remove `'maybe'` from the web types.
- [ ] **Step 7: Run** `cd web && npm run build && npm run lint`. Expected: exits 0.
- [ ] **Step 8: E2E check.** As ploy on `/`:
  1. Tap Dec 10 three times. Expect green, then red, then gray.
  2. Set Dec 10 to red and reload. Expect it still red.
  3. Go to the next month and back. Expect the marks kept.
- [ ] **Step 9: Commit**

```bash
git add -A backend web/src
git commit -m "feat: Personal Calendar with Free/Busy marks"
```

---

### Task 4: User joins a Trip via Invite Link (slice #4)

**Files:**
- Modify: `backend/internal/auth/auth.go` (+ `Optional`), `backend/internal/auth/auth_test.go`, `backend/internal/trip/trip.go`, `service.go`, `repository.go`, `service_test.go`
- Create: `backend/internal/trip/invite_handler.go`, `backend/internal/trip/invite_handler_test.go`
- Modify: `backend/cmd/api/main.go` (mount `/invites`)
- Create (web): `web/src/features/trip/api/get-invite.ts`, `web/src/features/trip/api/join-trip.ts`, `web/src/features/trip/components/invite-link-box.tsx`, `web/src/app/routes/join.tsx`
- Modify (web): `web/src/app/routes/trip-detail.tsx`, `web/src/app/router.tsx`

**Interfaces:**
- Consumes: `trip.Repository`, `Viewer`, and `Member` from Task 2.
- Produces:

```go
// auth
func (m *Manager) Optional() fiber.Handler // valid session → UserID(c) set; otherwise passes with UserID(c) == ""

// trip
var (
    ErrDisplayNameTaken   = errors.New("display name already taken in this trip")
    ErrInvalidDisplayName = errors.New("display name must be 1-50 characters")
)
// Repository additions
FindByInviteCode(ctx context.Context, code string) (Trip, error)
AddUserMember(ctx context.Context, tripID, userID uuid.UUID, displayName string) (Member, error)
// displayName "" → users.display_name; unique violation on trip_members_trip_display_name → ErrDisplayNameTaken
// Service additions
func (s *Service) Preview(ctx context.Context, code string, v Viewer) (t Trip, isMember bool, err error)
func (s *Service) JoinAsUser(ctx context.Context, code string, userID uuid.UUID, displayName string) (Member, error)
// already a Member → returns the existing Member, no insert; displayName is trimmed; non-empty must be 1-50 runes
func NewInviteHandler(svc *Service, auth *auth.Manager) *InviteHandler
// RegisterRoutes: GET "/:code" (Optional), POST "/:code/join" (Require for now)
```

- Produces (web):
  - `useInvite(code)` (key `['invites', code]`) and `useJoinTrip(code)`. On success the join mutation invalidates `['trips']` and navigates to `/trips/:trip_id`.
  - `<InviteLinkBox code>`: shows `${location.origin}/join/${code}` with a copy button.

- [ ] **Step 1: Write failing tests**:
  - Auth:
    - `TestOptional_ValidCookie_SetsUserID`
    - `TestOptional_NoCookie_PassesThrough`
    - `TestOptional_BadCookie_PassesThrough`: 200, and `UserID == ""`.
  - Service:
    - `TestPreview_UnknownCode_NotFound`
    - `TestPreview_IsMember`: the viewer is a Member → `true`.
    - `TestJoinAsUser_AlreadyMember_ReturnsExisting`: the fake records no `AddUserMember` call.
    - `TestJoinAsUser_NameTaken`: the fake returns `ErrDisplayNameTaken` → it propagates.
    - `TestJoinAsUser_DisplayNameTooLong`: 51 runes → `ErrInvalidDisplayName`.
  - Handler:
    - `TestJoin_RequiresLogin_401`
    - `TestJoin_NameTaken_409`
    - `TestJoin_TrimsDisplayName`: `" Nat "` reaches the service as `"Nat"` (Review Focus 4).
    - `TestPreview_404`
    - `TestPreview_200_NoMarksOrMembers`: the body has exactly the keys `trip_id`, `title`, `start_date`, `end_date`, `duration_days`, `is_member`.
- [ ] **Step 2: Run** `cd backend && go test ./internal/auth/ ./internal/trip/`. Expected: FAIL.
- [ ] **Step 3: Implement** `Optional`, the repo and service additions, and `invite_handler.go`. The repo detects the name clash with `pgErr.Code == "23505" && pgErr.ConstraintName == "trip_members_trip_display_name"`. Then mount `server.Mount{Prefix: "/invites", Routes: trip.NewInviteHandler(tripSvc, authManager)}` in `main.go`.
- [ ] **Step 4: Run** `go build ./... && go vet ./... && go test ./...`. Expected: PASS.
- [ ] **Step 5: Web.**
  - `join.tsx` at `/join/:code` is public, outside `RequireUser`. It shows the title, Date Range and Duration.
    - If `is_member`: show a link "ไปที่ทริป".
    - Else if logged in: show a "เข้าร่วมทริป" button. On 409, show a display-name input with the error message and resubmit with `display_name`.
    - Else: show "เข้าสู่ระบบเพื่อเข้าร่วม" → `/login?next=/join/:code`.
  - `trip-detail.tsx` shows `InviteLinkBox` above the member list.
- [ ] **Step 6: Run** `cd web && npm run build && npm run lint`. Expected: exits 0.
- [ ] **Step 7: E2E check.**
  1. Ploy copies the Invite Link of "เชียงใหม่".
  2. Log out, open the link. Expect the preview and a login prompt.
  3. Log in as nat. Expect to be back on `/join/:code` with a join button.
  4. Join. Expect the trip page listing ploy (Organizer) and nat.
  5. Open the link again as nat. Expect "ไปที่ทริป", and no duplicate member.
- [ ] **Step 8: Commit**

```bash
git add -A backend web/src
git commit -m "feat: join a Trip through its Invite Link"
```

---

### Task 5: Members mark days on the Trip + named per-day grid (slice #5)

**Files:**
- Create: `backend/migrations/00005_create_trip_marks.sql`, `backend/internal/trip/marks_handler_test.go`
- Modify: `backend/internal/trip/trip.go`, `service.go`, `repository.go`, `handler.go`, `service_test.go`
- Create (web): `web/src/features/trip/api/get-trip-marks.ts`, `web/src/features/trip/api/save-my-trip-marks.ts`, `web/src/features/trip/components/trip-marks-grid.tsx`
- Modify (web): `web/src/app/routes/trip-detail.tsx`

**Interfaces:**
- Consumes: `availability.Mark`, `availability.ChangeRequest`, `availability.ParseChanges`, `availability.ErrInvalidDay`, and `availability.ErrInvalidStatus` from Task 3. Also `Viewer` and `FindMember` from Task 2.
- Produces:

```go
var ErrDayOutOfRange = errors.New("day is outside the trip's date range")
// Repository additions
ListMarks(ctx context.Context, tripID uuid.UUID) (map[uuid.UUID][]availability.Mark, error) // member ID → Marks
SaveMarks(ctx context.Context, memberID uuid.UUID, set []availability.Mark, clear []time.Time) error // one tx
// Service additions
func (s *Service) Marks(ctx context.Context, tripID uuid.UUID, v Viewer) (map[uuid.UUID][]availability.Mark, error)
func (s *Service) SetMyMarks(ctx context.Context, tripID uuid.UUID, v Viewer, set []availability.Mark, clear []time.Time) error
// Handler routes: GET "/:id/marks", PUT "/:id/marks/me"
```

- Produces (web): `useTripMarks(tripId)` (key `['trips', tripId, 'marks']`) and `useSaveMyTripMarks(tripId)`, which invalidates `['trips', tripId]` (prefix, so marks and later suggestions refresh).

- [ ] **Step 1: Migration `00005_create_trip_marks.sql`**

```sql
-- +goose Up
CREATE TABLE trip_marks (
    member_id UUID NOT NULL REFERENCES trip_members(id) ON DELETE CASCADE,
    day       DATE NOT NULL,
    status    TEXT NOT NULL CHECK (status IN ('free', 'busy')),
    PRIMARY KEY (member_id, day)
);
-- +goose Down
DROP TABLE IF EXISTS trip_marks;
```

Run: `make db`. Expected: migrated to version 5.

- [ ] **Step 2: Write failing tests**:
  - Service:
    - `TestSetMyMarks_DayOutOfRange`: Date Range Dec 1–20, set Dec 21 → `ErrDayOutOfRange`, and nothing is saved. Clearing Nov 30 also → `ErrDayOutOfRange`.
    - `TestSetMyMarks_SavesForViewersMember`: the repo receives the viewer's member ID.
    - `TestMarks_NonMember_NotFound`
  - Handler:
    - `TestGetMarks_200`: `[{"member_id":"…","day":"2026-12-05","status":"free"}]`.
    - `TestPutMyMarks_OutOfRange_400`
    - `TestPutMyMarks_Maybe_422`
    - `TestPutMyMarks_NonMember_404`
    - `TestPutMyMarks_204`
- [ ] **Step 3: Run** `cd backend && go test ./internal/trip/`. Expected: FAIL.
- [ ] **Step 4: Implement** the migration-backed repo methods, the service, and the handler. Error mapping: `ErrDayOutOfRange` / `availability.ErrInvalidDay` → 400, `availability.ErrInvalidStatus` → 422, `ErrNotFound` → 404.
- [ ] **Step 5: Run** `go build ./... && go vet ./... && go test ./...`. Expected: PASS.
- [ ] **Step 6: Web.** Build `trip-marks-grid.tsx`:
  - Rows are `eachDay(start_date, end_date)` and columns are Members, with `display_name` in a sticky header.
  - Cells are coloured like the Personal Calendar.
  - Only the column for `me.id` is clickable. A tap saves `[{day, status: nextStatus(current)}]`.
  - It scrolls vertically, and horizontally when there are many Members.
  - Place it on `trip-detail.tsx` under the member list.
- [ ] **Step 7: Run** `cd web && npm run build && npm run lint`. Expected: exits 0.
- [ ] **Step 8: E2E check.**
  1. Ploy marks Dec 5–7 Free and Dec 10 Busy.
  2. Nat opens the trip. Expect to see ploy's column with those colours, and that ploy's cells can't be clicked.
  3. Nat marks Dec 6 Busy.
  4. Ploy reloads. Expect nat's Dec 6 red.
  5. Expect no rows outside Dec 1–20.
- [ ] **Step 9: Commit**

```bash
git add -A backend web/src
git commit -m "feat: Members mark days on a Trip with a named per-day grid"
```

---

### Task 6: Guest joins via Invite Link, recognised by device (slice #6)

**Files:**
- Create: `backend/migrations/00006_guest_members.sql`, `backend/internal/auth/guest.go`, `backend/internal/auth/guest_test.go`
- Modify: `backend/internal/trip/trip.go` (`Viewer.GuestTokenHash`), `service.go`, `repository.go` (`FindMember` and `Members` handle Guests), `handler.go` (detail/marks routes → `Optional` + guest viewer; `is_guest` in MemberJSON), `invite_handler.go` (join without login = Guest), tests
- Modify (web): `web/src/app/router.tsx` (`trips/:tripId` leaves `RequireUser`), `web/src/app/routes/join.tsx`, `web/src/app/routes/trip-detail.tsx` (404 copy), `web/src/features/trip/components/member-list.tsx` (Guest badge "แขก"), `web/src/features/trip/types.ts` (`is_guest`)

**Interfaces:**
- Produces:

```go
// auth/guest.go
const GuestCookieName = "guest_token"
func (m *Manager) GuestToken(c fiber.Ctx) string               // "" if none
func (m *Manager) EnsureGuestToken(c fiber.Ctx) (string, error) // reuse the existing cookie, else 32 random bytes base64url; HttpOnly, SameSite Lax, Secure = m.secureCookie, MaxAge 1 year
func HashGuestToken(token string) string                        // hex sha256; only the hash is stored

// trip
type Viewer struct { UserID uuid.UUID; GuestTokenHash string } // UserID wins when both are set
// Repository addition
AddGuestMember(ctx context.Context, tripID uuid.UUID, guestTokenHash, displayName string) (Member, error) // ErrDisplayNameTaken on clash
// Service addition
func (s *Service) JoinAsGuest(ctx context.Context, code, guestTokenHash, displayName string) (Member, error)
// displayName required (trimmed, 1-50 runes) → else ErrInvalidDisplayName; same device already a Member → existing Member
```

- [ ] **Step 1: Migration `00006_guest_members.sql`**

```sql
-- +goose Up
ALTER TABLE trip_members ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE trip_members ADD COLUMN guest_token_hash TEXT;
ALTER TABLE trip_members ADD CONSTRAINT trip_members_user_xor_guest
    CHECK ((user_id IS NULL) <> (guest_token_hash IS NULL));
CREATE UNIQUE INDEX trip_members_trip_guest ON trip_members (trip_id, guest_token_hash)
    WHERE guest_token_hash IS NOT NULL;
-- +goose Down
DELETE FROM trip_members WHERE user_id IS NULL;
DROP INDEX IF EXISTS trip_members_trip_guest;
ALTER TABLE trip_members DROP CONSTRAINT IF EXISTS trip_members_user_xor_guest;
ALTER TABLE trip_members DROP COLUMN IF EXISTS guest_token_hash;
ALTER TABLE trip_members ALTER COLUMN user_id SET NOT NULL;
```

Run: `make db`. Expected: migrated to version 6.

- [ ] **Step 2: Write failing tests**:
  - Auth:
    - `TestEnsureGuestToken_IssuesHttpOnlyCookie`
    - `TestEnsureGuestToken_ReusesExisting`: the request already carries the cookie → same value, no new `Set-Cookie`.
    - `TestHashGuestToken_Deterministic`: the hash is 64 hex chars and differs from the token.
  - Service:
    - `TestJoinAsGuest_NameRequired`
    - `TestJoinAsGuest_SameDevice_ReturnsExisting`
    - `TestGet_GuestViewer`: `Viewer{GuestTokenHash: h}` resolves the Guest member.
  - Handler:
    - `TestJoinAsGuest_SetsCookieAnd200`: `member.is_guest == true`.
    - `TestJoinAsGuest_NameTaken_409`: `" ploy "` vs the existing `"Ploy"` (Review Focus 4).
    - `TestGuest_CanReadTripAndMarkOwnDays`: GET `/trips/:id` → 200, PUT `/trips/:id/marks/me` → 204.
    - `TestNoCookies_TripIs404`
    - `TestGuest_CannotCreateTrip_401`
    - `TestGuest_CannotListTrips_401`
- [ ] **Step 3: Run** `cd backend && go test ./internal/auth/ ./internal/trip/`. Expected: FAIL.
- [ ] **Step 4: Implement.**
  - `handler.viewer(c) Viewer`: `UserID` from `auth.UserID(c)`, plus `GuestTokenHash` from `HashGuestToken(GuestToken(c))` when the cookie is present.
  - GET `/:id`, GET `/:id/marks`, PUT `/:id/marks/me` use `Optional`. POST `/` and GET `/` keep `Require`.
  - Join: if `UserID` is set → `JoinAsUser`, else `EnsureGuestToken` → `JoinAsGuest`.
  - `Preview.isMember` considers the guest viewer too.
- [ ] **Step 5: Run** `go build ./... && go vet ./... && go test ./...`. Expected: PASS.
- [ ] **Step 6: Web.**
  - `join.tsx` when logged out: a form "เข้าร่วมแบบไม่สมัครสมาชิก" with a display-name input (show the 409 message), plus the login link.
  - `trips/:tripId` is public. A 404 shows "ไม่พบทริปนี้ หรือคุณยังไม่ได้เป็นสมาชิก".
  - `member-list` shows a "แขก" badge for Guests.
- [ ] **Step 7: Run** `cd web && npm run build && npm run lint`. Expected: exits 0.
- [ ] **Step 8: E2E check.**
  1. In a fresh browser context (no cookies), open ploy's Invite Link.
  2. Join as "Bank". Expect the trip page with a "แขก" badge.
  3. Mark Dec 5 Free, then reload. Expect Bank is still recognised and can edit his column.
  4. Ploy sees Bank's column.
  5. A second fresh context joins as "bank". Expect the 409 message.
- [ ] **Step 9: Commit**

```bash
git add -A backend web/src
git commit -m "feat: Guests join a Trip without an account, recognised by device"
```

---

### Task 7: Suggested Windows ranked on the Trip page (slice #7)

**Files:**
- Create: `backend/internal/trip/matching.go`, `backend/internal/trip/matching_test.go`
- Modify: `backend/internal/trip/trip.go` (`Window`), `service.go`, `handler.go`, `service_test.go`, `handler_test.go`
- Create (web): `web/src/features/trip/api/get-suggestions.ts`, `web/src/features/trip/components/suggestion-list.tsx`
- Modify (web): `web/src/features/trip/types.ts` (`Suggestion`), `web/src/app/routes/trip-detail.tsx`

**Interfaces:**
- Consumes: `Repository.ListMarks`, `Members`, and `FindMember` from Tasks 2 and 5. Also `Today` from Task 2.
- Produces:

```go
type Window struct {
    Start, End                time.Time
    Available, Busy, Unknown  []uuid.UUID // every Member in exactly one, in memberIDs order
}
func SuggestWindows(memberIDs []uuid.UUID, marks map[uuid.UUID][]availability.Mark, from, to time.Time, duration int) []Window
// all Windows of `duration` consecutive days inside [from, to];
// ranked: fewest Busy, then most Available, then earliest Start; nil if duration > rangeDays(from, to)
func (s *Service) Suggestions(ctx context.Context, tripID uuid.UUID, v Viewer) ([]Window, error)
// from = max(trip.StartDate, Today(s.now())) — Windows starting before today are never suggested
// Handler route: GET "/:id/suggestions"
```

- Produces (web): `useSuggestions(tripId)` (key `['trips', tripId, 'suggestions']`, refreshed by the Task 5 prefix invalidation).

- [ ] **Step 1: Write failing tests** in `matching_test.go` (table-driven, Members A–F, days in Dec 2026):
  - `TestSuggestWindows_UnknownBeatsBusy`: Window Dec 5–7 with 4 Available, 0 Busy, 2 Unknown ranks above Window Dec 12–14 with 5 Available, 1 Busy, 0 Unknown. This is the grill scenario.
  - `TestSuggestWindows_TieOnBusy_MoreAvailableFirst`
  - `TestSuggestWindows_FullTie_EarliestFirst`
  - `TestSuggestWindows_BusyOnOneDayWins`: a Member Free on day 1, Unknown on day 2 and Busy on day 3 is Busy.
  - `TestSuggestWindows_NoMarksIsUnknown`: a Member with no Marks is Unknown in every Window, never Available.
  - `TestSuggestWindows_DurationLongerThanRange`: returns empty.
  - `TestSuggestWindows_CoversRangeExactly`: range Dec 1–5, duration 3 → starts Dec 1, 2, 3 only.
  - `TestSuggestWindows_EveryMemberInExactlyOneBucket`: property check over all returned Windows.

  In `service_test.go`:
  - `TestSuggestions_SkipsWindowsStartingBeforeToday`: `s.now = 2026-12-03T18:00:00Z` (Dec 4 in Thailand), Date Range Dec 1–10, duration 2 → the first start is ≥ Dec 4 (Review Focus 1).
  - `TestSuggestions_NonMember_NotFound`

  In `handler_test.go`:
  - `TestGetSuggestions_200`: JSON `start`/`end` are DateOnly strings, and `available` is a list of member IDs.
- [ ] **Step 2: Run** `cd backend && go test ./internal/trip/`. Expected: FAIL.
- [ ] **Step 3: Implement** `SuggestWindows`. Index Marks as `map[memberID]map[day]Status`. For each start day, classify each Member as Busy (any Busy day), else Unknown (any day without a Mark), else Available. Sort with `slices.SortStableFunc`. Then add `Service.Suggestions` and the handler route.
- [ ] **Step 4: Run** `go build ./... && go vet ./... && go test ./...`. Expected: PASS.
- [ ] **Step 5: Web.** `suggestion-list.tsx` shows the top 5 Windows. Each one shows:
  - its date span;
  - "ว่าง N · ติด N · ยังไม่ระบุ N";
  - the names of the Busy and Unknown Members, mapped from `members`.
  - An empty list shows "ยังไม่มีช่วงวันที่เหมาะ — ชวนสมาชิกระบุวันเพิ่ม".
  - Place it at the top of `trip-detail.tsx`, under the title.
- [ ] **Step 6: Run** `cd web && npm run build && npm run lint`. Expected: exits 0.
- [ ] **Step 7: E2E check.** With the Task 5/6 marks (ploy Free Dec 5–7, nat Busy Dec 6, Bank Free Dec 5):
  1. Check the top Window has 0 Busy.
  2. Nat marks Dec 6 Free. Expect the list to update without a reload, and Dec 5–7 to move up.
- [ ] **Step 8: Commit**

```bash
git add -A backend web/src
git commit -m "feat: rank suggested Windows on the Trip page"
```

---

## After Task 7

Stop and check in with the user (agreed scope: core loop #1–#7). The remaining slices #8–#15 (Push, re-sync, confirm, Confirmed-Dates prompt, edit Date Range, member management, leave, Guest sign-up) get their own plan.
