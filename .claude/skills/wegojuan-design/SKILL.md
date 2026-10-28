---
name: wegojuan-design
description: Use for any UI work in web/ (screens, components, styling, Thai copy, responsive layout). Applies the WeGoJUAN design system — light orange + white, Faces for emotion, phone/tablet/PC/Surface Duo layouts.
---

# WeGoJUAN design system

The design system for this app lives in the repo. Follow it for every change in `web/` that someone will see.

## Read before you build

1. `docs/design/README.md`: the brand book (personality, colour meanings, type, layout across devices, motion, Faces, accessibility). Read it once per session.
2. `docs/design/copy.md`: the Thai lines for every state. Use them as written; don't invent new wording when a line exists.
3. `docs/design/reference/components/<Component>.md`: the guidelines for the component you are touching.
4. `docs/design/screens/<Name>.png`: the visual target. Look at the matching screenshot before and after you build (Screen*.png are whole screens per device; the rest are single components).
5. `docs/design/reference/bundle.js` + `index.d.ts`: a working React reference implementation (plain `React.createElement`, `wg-` classes) with the exact markup, props and behaviour. Port from it; don't load it at runtime.

## Where things live

| Path | What |
|---|---|
| `web/src/design/tokens.css` | Custom properties (colours, spacing, radius, shadows, durations, easing, layout), the type classes (`display`, `title`, `heading`, `body`, `body-strong`, `small`, `caption`, `micro`, `day-number`, `stat`) and `@font-face` for Mitr and Anuphan. Generated from `docs/design/tokens.json`: change values there first, then mirror them here. |
| `web/src/design/fonts/` | Mitr and Anuphan 400/500/600, Thai + Latin (SIL OFL). |
| `web/src/design/components.css` | The component styles (`wg-*` classes), including the container-query layouts and safe areas. |
| `web/src/design/tailwind-theme.css` | Tailwind utilities pointing at the tokens (`bg-cream`, `text-orange-ink`, `bg-free-soft`, `font-brand`, `rounded-card`…) and the `@medium:` / `@expanded:` container variants. |

`web/src/app/styles.css` must stay exactly:

```css
@import "tailwindcss";
@import "../design/tokens.css" layer(base);
@import "../design/components.css" layer(components);
@import "../design/tailwind-theme.css";
```

The layers matter: Tailwind utilities override component classes, so a one-off `mt-2` on a `wg-` element still works.
`web/index.html` needs `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">` for iPhone safe areas.

## How to build components

- Port each component from `reference/bundle.js` into TypeScript React under `web/src/components/` (shared) or `web/src/features/<area>/components/` (feature-specific), following the repo's existing structure, `@/` imports and Thai code comments.
- Keep the same `wg-` class names and DOM structure so `components.css` styles them. Use props from `reference/index.d.ts`.
- Use Tailwind utilities from `tailwind-theme.css` for page-level spacing and one-offs. Never hard-code a hex colour, font or radius in TSX: use a token utility or `var(--token)`.
- Layout: port `AppShell`, `SideNav`, `PageLayout` and `useLayout()`. Layout follows the shell's width (container queries + a ResizeObserver), never `window.innerWidth` or viewport `md:`/`lg:` breakpoints. Use `@medium:` / `@expanded:` variants for your own responsive tweaks.

### This repo's components → the design system

| Current file (web/src) | Becomes |
|---|---|
| `components/layout/app-shell.tsx` | `AppShell` (+ `SideNav`, `BottomNav`, `AppBar`) |
| `components/ui/text-field.tsx` | `TextField` |
| `components/calendar/month-grid.tsx`, `month-nav.tsx` | `MonthGrid` (outer container + inner grid), `MonthNav` |
| `lib/mark.ts` `statusClass()` | `DayCell` status classes (`wg-day--free/busy/unknown`); remove the green/red Tailwind classes |
| `features/availability/components/month-calendar.tsx` | `MonthGrid` + `DayCell` (personal, with `reason`) + `CalendarLegend` |
| `features/availability/components/calendar-day-panel.tsx` | `Sheet placement="side"` + `StatusPicker` + `TextField` |
| `features/availability/components/busy-summary.tsx` | the "ไม่ว่างเดือนนี้" card (see ScreenCalendar.png, ScreenDesktopCalendar.png) |
| `features/trip/components/trip-list.tsx` | `TripCard` in `wg-card-grid` + `EmptyState` |
| `features/trip/components/trip-calendar.tsx`, `day-panel.tsx` | `MonthGrid` + `DayCell variant="trip"`; `Sheet placement="side"` + `StatusPicker` + friend `Pill`s |
| `features/trip/components/suggestion-list.tsx` | `SuggestionCard` |
| `features/trip/components/confirmed-dates.tsx` | `ConfirmedDates` |
| `repush-banner.tsx`, `resync-banner.tsx` / `confirmed-offer-banner.tsx` | `Banner tone="honey"` / `Banner tone="info"` |
| `invite-link-box.tsx`, `member-list.tsx` | `InviteLinkBox`, `MemberChip` |
| `push-panel.tsx` | `Checkbox` rows inside a `Sheet` |
| create/join/login/register forms | `TextField` + `Button block` in a sticky footer on phones |
| every `window.confirm(...)` | a confirm `Sheet` (center placement) with a `danger` button, copy from copy.md |

## Rules that never bend

- **Colour by meaning:** orange = the trip and its decisions (primary button, Confirmed); teal `free` / rose `busy` = people's availability; honey = heads-up; `danger` = destructive. Text on orange is `on-orange`, never white.
- **Status is never colour alone:** keep the hatch on busy days, the dashed edge on unknown, the round/square initials, and a Face or word in pickers and pills.
- **Thai domain terms are fixed:** ทริป, ว่าง, ไม่ว่าง, ยังไม่ระบุ, ผู้จัด, แขก, ลิงก์เชิญ, ปฏิทินของฉัน, อัปเดตจากปฏิทินของฉัน, กำลังหาวัน, ยืนยันแล้ว, วันที่ยืนยัน, เหตุผล. Personality goes in second lines; no jokes in errors or destructive confirmations.
- **Faces, not emoji.** One Face per card, banner or sheet header.
- **One primary button per screen.** Touch targets 44px or more.
- **Reason is private:** it appears only on the user's own calendar, never in a trip.
- **Nothing crosses the hinge** in split (Surface Duo) layout.

## Check your work

1. `cd web && npm run lint && npm run build`: both clean.
2. Run the app (`make dev`, then http://localhost:5173) and check the screen at 375, 820, 1180 and 1440px wide, plus a 1114px window with split forced, if you touched layout. Compare with the matching `docs/design/screens/*.png`.
3. Keyboard: Tab reaches everything with a visible orange focus ring; Esc closes sheets.
4. No console errors, no hard-coded colours (`grep -rn "#[0-9a-fA-F]\{6\}" web/src --include=*.tsx` should find nothing new).
