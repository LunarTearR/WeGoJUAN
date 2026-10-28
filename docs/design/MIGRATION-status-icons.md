# Migration: Faces → StatusIcon (lucide-react)

The design system replaced the five Face drawings with `StatusIcon`: a lucide-react icon inside a round badge. This file lists every change the web app needs. The design files (`docs/design/`, `web/src/design/`, the skill) are already updated; this is about the code in `web/src`.

## What changed in the design system

**New kinds** (`StatusKind`), replacing `Mood`:

| kind | lucide-react icon | circle class | replaces |
|---|---|---|---|
| `finding` | `CalendarClock` | `wg-status--finding` (`sand` + `ink-muted`) | `unknown` face on trips / re-push / re-sync / no match |
| `confirmed` | `Ticket` | `wg-status--confirmed` (`orange` + `on-orange`) | `party` face |
| `calendar` | `Calendar` | `wg-status--calendar` (`sand` + `ink-muted`) | `sleepy` face (empty states, create intro) |
| `free` | `Check` | `wg-status--free` (`free-soft` + `free`) | `free` face |
| `busy` | `X` | `wg-status--busy` (`mist` + `mist-ink`) | `busy` face |
| `unknown` | `MoreHorizontal` | `wg-status--unknown` (white, dashed `line-strong`) | `unknown` face for a person |

- **CSS** (`web/src/design/components.css`): all `.wg-face*` rules are gone; `.wg-status*` added, plus `.wg-pill--outline`, `.wg-pill--status`, the `wg-stamp` animation, and white circles inside banners. The selected ไม่ว่าง option in StatusPicker is now light grey (`mist`), the selected ไม่ระบุ option has a dashed edge, and busy names in SuggestionCard are `mist-ink`.
- **Tokens:** new `sand`, `mist`, `mist-line`, `mist-ink` (in `tokens.css`, and as `bg-sand`, `bg-mist`, `text-mist-ink`… in `tailwind-theme.css`).
- **Size → icon size / strokeWidth** (keep it in one place, inside `StatusIcon`): circle ≤20 → icon `round(size*0.62)`, stroke 3 · ≤32 → `round(size*0.56)`, 2.5 · ≤48 → `round(size*0.52)`, 2.25 · larger → `round(size*0.5)`, 2.
- Reference implementation: `StatusIcon` in `docs/design/reference/bundle.js`; guidelines in `docs/design/reference/components/StatusIcon.md`; target pictures in `docs/design/screens/` (`StatusIcon.png`, `Screen*.png`).

## Code changes in web/src

1. `npm i lucide-react` in `web/`.
2. **New** `components/ui/status-icon.tsx`: `export type StatusKind = 'finding' | 'confirmed' | 'calendar' | 'free' | 'busy' | 'unknown'`, a map kind → `{ Icon: CalendarClock | Ticket | Calendar | Check | X | MoreHorizontal, label: 'กำลังหาวัน' | 'ยืนยันแล้ว' | 'ปฏิทิน' | 'ว่าง' | 'ไม่ว่าง' | 'ยังไม่ระบุ' }`, props `{ kind, size = 32, title?, stamp?, className? }`. Render `<span className={cx('wg-status', 'wg-status--' + kind, stamp && 'wg-status--stamp', className)} style={{ width: size, height: size }} role/aria-label as Face did><Icon size={iconSize} strokeWidth={stroke} aria-hidden /></span>`. Same `title` rule as Face: undefined = decorative, '' = Thai label, text = read as is.
3. **Delete** `components/ui/face.tsx` and every import of it.
4. Update each usage:

| File | Today | Becomes |
|---|---|---|
| `components/ui/status-picker.tsx` | `key: Mood`, `<Face mood={o.key} size={28} />` | `key: StatusKind` (`free` / `busy` / `unknown`), `<StatusIcon kind={o.key} size={28} />` |
| `components/ui/pill.tsx` | `face?: Mood`, `<Face size={16} />`, tones incl. `free`/`busy` for friends | `status?: StatusKind`, `<StatusIcon kind={status} size={18} />`; tone defaults to `'outline'` when `status` is set, else `'orange'`; add `'outline'` to the tone union; add class `wg-pill--status` when `status` is set |
| `components/ui/banner.tsx` | `mood?: Mood \| null`, `BANNER_MOOD` | `icon?: StatusKind \| null`, `BANNER_ICON = { info: 'confirmed', honey: 'finding', success: 'free', danger: 'busy' }` |
| `components/ui/empty-state.tsx` | `mood = 'sleepy'` | `icon: StatusKind = 'calendar'` |
| `components/ui/sheet.tsx` | `face?: Mood` | `icon?: StatusKind` (still never on destructive confirmations) |
| `components/layout/side-nav.tsx` | rail mark `<Face mood="party" size={40} />`; recent trip `mood: Mood` | `<StatusIcon kind="confirmed" size={40} title="WeGoJUAN" />`; `status: 'finding' \| 'confirmed'`, `<StatusIcon kind={trip.status} size={24} />` |
| `app/routes/app-layout.tsx` | `mood: trip.confirmed_start ? 'party' : 'unknown'` | `status: trip.confirmed_start ? 'confirmed' : 'finding'` |
| `app/routes/trip-detail.tsx` (หาทริปนี้ไม่เจอ), `app/routes/not-found.tsx` (หลงทางแล้ว) | `mood="unknown"` | `icon="busy"` |
| `app/routes/join.tsx` | invalid link `mood="unknown"`; hero `<Face mood="party" size={88} />` | `icon="busy"`; `<StatusIcon kind="finding" size={88} />` (the `Invite` response has no confirmed dates, so don't change the API for this) |
| `features/trip/components/trip-card.tsx` | `<Face mood={confirmedLabel ? 'party' : 'unknown'} size={44} />` | `<StatusIcon kind={confirmedLabel ? 'confirmed' : 'finding'} size={44} />` |
| `features/trip/components/trip-list.tsx` | `mood="sleepy"` | drop it (default `calendar`) |
| `features/trip/components/suggestion-list.tsx` | `mood="unknown"` | `icon="finding"` |
| `features/trip/components/suggestion-card.tsx` | `<Face mood={f.status} size={28} title={label} />` | `<StatusIcon kind={f.status} size={28} title={label} />` |
| `features/trip/components/day-panel.tsx` | `face={isConfirmed ? 'party' : undefined}`; `<Pill tone={f.status} face={f.status}>` | `icon={isConfirmed ? 'confirmed' : undefined}`; `<Pill status={f.status}>` (white pill with the badge) |
| `features/trip/components/confirmed-dates.tsx` | `<Face mood="unknown" size={40} />`, `<Face mood="party" size={56} hop />` | `<StatusIcon kind="finding" size={40} />`, `<StatusIcon kind="confirmed" size={56} stamp />` |
| `features/trip/components/confirmed-offer-banner.tsx` | `mood={changed ? 'unknown' : undefined}` | `icon={changed ? 'finding' : undefined}` |
| `features/trip/components/create-trip-form.tsx` | `<Face mood="free" size={44} />` | `<StatusIcon kind="calendar" size={44} />` |
| `features/trip/components/push-panel.tsx` | `<Face mood="free" size={32} />` | `<StatusIcon kind="free" size={32} />` |
| `features/availability/components/busy-summary.tsx` | `<Face mood="free" size={28} />` | `<StatusIcon kind="free" size={28} />` |

5. Search for leftovers and fix them too: `grep -rn "Face\|Mood\|mood\|face=\|wg-face\|hop" web/src` should return nothing related.

## Not changed

- Calendar cells keep the rose hatch for busy days and the rose square Initials for busy friends.
- The favicon and home-screen icon (`web/public/favicon.svg` and its PNGs) stay as they are.
- Copy is the same apart from the Icon column in `copy.md`.

## Check

- `cd web && npm run lint && npm run build`
- Open the app and compare with `docs/design/screens/StatusIcon.png`, `ScreenTrips.png`, `ScreenTrip.png`, `ScreenCalendar.png`, `ScreenIPhone.png` and `ScreenDesktop.png` at 375, 820 and 1440px.
- Keyboard and screen reader: members in a suggested window still read "{name} ว่าง / ไม่ว่าง / ยังไม่ระบุ".
