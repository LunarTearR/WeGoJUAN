# WeGoJUAN design system

WeGoJUAN helps a group of friends find the days everyone is free, then lock in the trip. The name is a pun: *we go* + *ชวน* (to invite). The interface should feel like the friend in the group chat who actually gets the trip organised: warm, a little cheeky, never loud. Light orange on warm white, round shapes, and small faces that react to what you do.

**Mobile first, then every screen.** Design each screen at 360–440px wide first: the phone is where the invite link opens and where people mark their days. The same components then stretch to tablets, PCs and dual-screen phones through one `AppShell` and four layout classes (see **Layout across devices**).

## Personality: fun, but not too hot

- **Warm, not spicy.** Orange is a light apricot (`orange`), not a red-orange. The page is `cream`, cards are `surface` (white). Large orange areas are rare: one primary button per screen, the Confirmed card, the floating create button.
- **The fun is in the reactions.** Use a `Face` when something happens (a day is marked, dates are confirmed, a list is empty). Don't use loud gradients, confetti, or more than one exclamation mark on a screen.
- **Tactile, not flashy.** Primary buttons have a 3px "candy lip" (`shadow-lip`) and sink 2px when pressed. Things that change state pop with a small overshoot (`ease-pop`, `duration-pop`). That's the whole motion vocabulary.

## Voice & copy

The UI is in Thai. Write like a friend in the group chat: short sentences, friendly particles (นะ, เลย, กัน), at most one per sentence.

- **Domain terms never change.** Use these exactly, never slang for them: ทริป, ว่าง, ไม่ว่าง, ยังไม่ระบุ, ผู้จัด, แขก, ลิงก์เชิญ, ปฏิทินของฉัน, อัปเดตจากปฏิทินของฉัน, กำลังหาวัน, ยืนยันแล้ว, วันที่ยืนยัน, เหตุผล.
- **Labels stay plain, the fun goes in the second line.** Buttons and headings are plain verbs and nouns ("สร้างทริป", "เลือกช่วงนี้"). The personality goes in hints, empty states and success messages ("แก๊งเงียบไปนานแล้วนะ ชวนกันไปไหนสักที่ไหม?").
- **Celebrate decisions.** An exclamation mark is for real wins only: "ยืนยันแล้ว!", "คัดลอกแล้ว!", "ว่างครบทุกคน! ไปกันเลย".
- **No jokes when something is lost or private.** Errors explain plainly after a soft opener ("อุ๊ย บันทึกไม่สำเร็จ" then the reason). Deleting, leaving or removing someone uses plain, serious copy that says what is lost: "ลบทริป "ทะเลกันมั้ย แก๊ง"? สมาชิกและวันว่างในทริปจะหายไปทั้งหมด". Privacy notes (Reason) are straight: "เห็นแค่คุณ".
- **Faces, not emoji.** Emotion comes from the `Face` component. Don't put emoji in UI strings; they render differently on every phone.
- **Numbers and dates.** Use Arabic numerals and short Thai months with a weekday when space allows: "ศ. 5 – อา. 7 ธ.ค.". Ranges use an en dash. Years follow `th-TH` (พ.ศ.), as the app already does.
- The **Microcopy** section has the ready-made lines for every state.

## Colour

Two jobs, two colour families. **Orange means the trip and its decisions.** **Teal and rose mean people's availability.** Never swap them.

| Meaning | Fill / background | Text & icon | Never |
|---|---|---|---|
| Brand, primary action, the Confirmed trip | `orange` (text `on-orange`), `peach-100` | `orange-ink` | white text on `orange` |
| Free (ว่าง) / Available | `free-soft`, border `free-line` | `free` | as a "success = done" colour for trip decisions |
| Busy (ไม่ว่าง) | `busy-soft` + hatch, border `busy-line` | `busy` | without the hatch or the face |
| Unknown (ยังไม่ระบุ) | `surface` + dashed `line-strong` | `ink` / `ink-muted` | grey fill that looks "disabled" |
| Heads-up (re-sync, re-push) | `honey-soft` | `honey-ink` | for errors |
| Error, destructive | `busy-soft` | `danger` | for warnings |

- Page `cream`; cards, sheets and inputs `surface`; sunken or read-only areas `peach-50`.
- Body text `ink`; secondary text `ink-muted`. Both pass 4.5:1 on every surface and every `-soft` tint.
- Hairlines and card borders `line`. A control's edge that must be seen (inputs, checkboxes, the secondary button, the dashed Unknown day) is `line-strong` (3:1).
- Free and busy are a teal and a rose of the same lightness. They differ by hue toward blue and red, **and** every use also carries a second cue: the face, the hatch (busy days), the badge shape (round free / square-ish busy initials) or the word. Keep that second cue.

## Type

- **Mitr** (`display` family) for the wordmark, page titles, headings, day numbers and big stats. Round and chunky, with friendly Thai shapes. Never set body copy in it.
- **Anuphan** (`sans` family) for everything else. A loopless Thai that stays crisp at 12–16px.
- Styles: `display` (one per screen, the page title), `title` (trip name, sheet title), `heading` (sections, card titles), `body` (default, 16px so iOS never zooms into an input), `body-strong` (button labels, banner titles), `small` (metadata, hints), `caption` (pills, weekday headers, nav labels), `micro` (friend initials in calendar cells only), `day-number`, `stat`.
- Both faces are by Cadson Demak under the SIL Open Font License. The files here are the Thai and Latin subsets merged into one woff2 per weight (400, 500, 600). In the web app you can also install `@fontsource/mitr` and `@fontsource/anuphan`.
- Thai stacks vowels and tone marks above and below. Keep line heights at 1.4 or taller (the styles already do), and don't clip text boxes vertically.

## Layout across devices

Layout follows the width the app actually has, not the device name. `AppShell` measures itself (CSS container queries plus `useLayout()` in React), so a split-screen browser on a PC gets the tablet layout, and an iPhone turned sideways gets the rail.

| Layout | Width | Devices | Navigation | Page | Day panel | Confirm dialog |
|---|---|---|---|---|---|---|
| **compact** | under `bp-medium` (600) | iPhone SE 375, iPhone 16 393, Pro Max 440, Android phones, Surface Duo on one screen (540) | `AppBar` on top, floating `BottomNav` | one column, gutter `space-4` | bottom `Sheet` | bottom `Sheet` |
| **medium** | 600–1023 | iPad mini / Air / Pro in portrait (744–1024), unfolded foldables, iPhone in landscape | nav rail (`rail-width`) with the round create button | one centred column, `content-max` wide | panel floating above the bottom, 560 max | centred dialog, 480 max |
| **expanded** | `bp-expanded` (1024) and up | iPad in landscape (1133–1366), laptops and PCs | sidebar (`sidebar-width`): wordmark, สร้างทริป, tabs, recent trips, the user | `PageLayout` main + aside (`aside-width`), capped at `page-max` | right-hand drawer, non-modal; it takes the aside's place | centred dialog |
| **split** | two viewport segments | Surface Duo and other dual-screen devices when the app spans both screens | `BottomNav` on the left screen only | main on the left screen, aside on the right; nothing crosses the hinge | fills the right screen | centred on the left screen |

### Phones (iPhone first)

- Add `viewport-fit=cover` to the viewport meta tag. `AppBar`, `BottomNav`, `Sheet` and sticky footers then pad themselves with the safe areas (`--wg-safe-top/right/bottom/left`, read from `env(safe-area-inset-*)`): under the Dynamic Island, above the home indicator, clear of the notch in landscape.
- iPhone SE (375 × 667) is the tightest screen: calendar cells stay 44px or wider, and trip cards let the avatars wrap under the pill.
- The main action of a form (สร้างทริป, เข้าร่วมทริป, บันทึก) sits in a sticky footer, full width (`Button block`), in the thumb zone.
- Trip screen order: status (`ConfirmedDates`) → banners → suggested windows (top 3, then "ดูเพิ่ม") → member calendar → members & invite link → leave/delete at the very bottom.
- Hide the `BottomNav` inside a trip and on screens with a sticky footer: the back button is the way out.

### Tablets (iPad)

- **Portrait (medium):** the rail replaces the bottom nav. Pages are one 640px column, so the calendar gets roughly 88px cells: trip days show up to 6 friend badges. Suggested windows can sit two across. The day panel floats above the bottom so the calendar stays visible.
- **Landscape (expanded):** the same as a PC, with touch targets kept at 44px or more.
- Rail labels use the short names (ทริป, ปฏิทิน); the sidebar uses the full ones.

### PC

- The sidebar holds สร้างทริป as a block primary button and the three most recent trips (with their Faces) for one-click switching.
- A trip page puts status, banners and the calendar in the main column and suggested windows, members and the invite link in the aside. Use `useLayout()` to move the suggestions: inline before the calendar on compact and medium, in the aside on expanded and split.
- The calendar grows with its own width: from 680px wide it shows full weekday names, taller trip days with up to 8 friend badges, and the private Reason as text inside each busy day on my own calendar.
- Clicking a day opens the drawer on the right without dimming the page; clicking another day updates it. Esc closes it.
- Hover states only appear on devices with a real pointer (`@media (hover: hover)`), so a tap on a phone never leaves a tint behind. Focus rings stay on for keyboard users everywhere.
- Join and login stay a single centred 480px card on every width.

### Dual-screen (Surface Duo)

- On one screen it is a phone. Spanned across both, `AppShell` turns on split (from `(horizontal-viewport-segments: 2)`; the hinge width comes from `env(viewport-segment-*)`).
- Never put anything across the hinge: the app bar, the calendar and the bottom nav stay on the left screen; the aside or the open day sit on the right screen. Every page should have an aside for split: the trips list pairs with the selected trip's summary, my calendar with the day being edited.
- Galaxy Fold-style foldables unfold to one tall screen (about 700–900px) and simply get the medium layout.

### Everywhere

- Touch targets are at least 44px (`space-12` = 48px for buttons and inputs). Calendar cells keep a `space-1` gap on phones and `space-2` from 520px wide.
- **Replace `window.confirm`.** Delete, leave, remove a member, replace the invite link: confirm in a `Sheet` (bottom on phones, centred dialog from tablet up) with the plain explanation and a `danger` button.
- **Showcases:** the Screens group has the phone flows; Screens · Devices has iPhone SE / 16 / Pro Max, iPad portrait and landscape, PC, and Surface Duo.

## Shape & elevation

- Everything is round: `radius-md` for buttons, inputs, day cells and banners; `radius-lg` for cards; `radius-xl` for the sheet top and bottom nav; `radius-full` for pills, chips, avatars and faces.
- Cards rest on `cream` with a `line` border and `shadow-sm`. Floating things (bottom nav, sheet, create button) use `shadow-md`.
- The candy lip: `shadow-lip` under primary buttons, `shadow-lip-quiet` under secondary buttons and status picker options. Nothing else gets a lip.

## Motion

- `duration-fast` + `ease-out` for press feedback (scale 0.94–0.98 or a 2px sink).
- `duration-pop` + `ease-pop` when a state changes: a day cell's fill, the chosen status face, a copied-link button, a ticked checkbox.
- `duration-sheet` + `ease-out` for sheets sliding up, the PC day drawer sliding in, dialogs and banners appearing.
- The party face hops once when dates are confirmed. Nothing loops except loading dots.
- Under `prefers-reduced-motion`, all motion is off (bundle.css handles it).

## Emotion: the Faces

Five round faces are the brand's emoji. They are drawn from tokens, so they always match the palette.

| Mood | Means | Where |
|---|---|---|
| `free` (smile) | ว่าง / Available | status picker, suggestion faces, friend pills |
| `busy` (><, sweat drop) | ไม่ว่าง | same places, error banners |
| `unknown` (raised brow, dashed) | ยังไม่ระบุ, "hmm, when?" | Finding-dates trips, re-sync banners, no-match empty state |
| `party` (^^, open smile) | Confirmed, a win | Confirmed card and trip cards, the invite landing, confirm-offer banner |
| `sleepy` (zz) | Nothing here yet | Empty trip list, empty states |

Use one face per card or banner, at 28–44px in lists, 56–88px in heroes and empty states. Never use a face as decoration with no meaning, and never draw new moods ad hoc: add them here first.

## Iconography

- Line icons on a 24px grid, 2px stroke, round caps and joins, `currentColor`. Use `Icon` (names: trip, calendar, plus, users, copy, share, refresh, flag, sparkle, lock, edit, trash, exit, check, close, more, chevron-left, chevron-right).
- `flag` marks Confirmed, `sparkle` marks the best window, `lock` marks private things (Reason).
- The app icon is the **brand calendar** (`web/public/favicon.svg`): an `orange` calendar outlined and ringed in `on-orange`, whose `cream` page wears the party Face's smile and blush. It is drawn on a 32px grid so it stays readable at 16px in a browser tab. `favicon-32.png` (transparent) and `apple-touch-icon.png` (180px on `cream`, for "Add to Home Screen") are renders of it: re-render both when the SVG changes. Inside the app, the line `calendar` icon still means ปฏิทินของฉัน.
- There is still no full logo: set the name as the `Wordmark` ("WeGo" in `ink`, "JUAN" in `orange-ink`, Mitr 600).

## Accessibility

- Focus is always visible: `focus-ring` (a 2px `cream` gap, then 2px `orange-ink`), applied as a box-shadow so it follows the radius.
- Each calendar cell's `aria-label` reads the date, my status and "วันที่ยืนยัน" or "มีเหตุผล" when they apply. Each friend's initials badge reads the full name and status.
- Status is never colour alone: face + word in pickers and pills, hatch + face in cells, shape in initials.
- Danger banners use `role="alert"`; everything else uses `role="status"`.

## Using it in the WeGoJUAN web app

Set the viewport in `web/index.html` to `width=device-width, initial-scale=1, viewport-fit=cover`, and wrap the router's layout in `AppShell` (it replaces `AppShell` in `components/layout/app-shell.tsx`: same job, now responsive). The web app uses Tailwind v4 (`web/src/app/styles.css`). Load this system's compiled `tokens.css` (the custom properties and `@font-face` rules generated from `tokens.json`, with the six font files) before `@import "tailwindcss"`, then expose the tokens as utilities:

```css
@theme inline {
  --color-cream: var(--cream);       --color-surface: var(--surface);
  --color-peach-50: var(--peach-50); --color-peach-100: var(--peach-100); --color-peach-200: var(--peach-200);
  --color-orange: var(--orange);     --color-orange-deep: var(--orange-deep);
  --color-orange-ink: var(--orange-ink); --color-on-orange: var(--on-orange);
  --color-ink: var(--ink);           --color-ink-muted: var(--ink-muted);
  --color-line: var(--line);         --color-line-strong: var(--line-strong);
  --color-free: var(--free);         --color-free-soft: var(--free-soft); --color-free-line: var(--free-line);
  --color-busy: var(--busy);         --color-busy-soft: var(--busy-soft); --color-busy-line: var(--busy-line);
  --color-honey-soft: var(--honey-soft); --color-honey-ink: var(--honey-ink); --color-danger: var(--danger);
  /* new names, so nothing points at itself */
  --font-brand: var(--font-display); --font-body: var(--font-sans);
  --radius-control: var(--radius-md); --radius-card: var(--radius-lg); --radius-sheet: var(--radius-xl);
}
```

That gives `bg-cream`, `text-orange-ink`, `bg-free-soft`, `font-brand`, `rounded-card` and so on.

- Swap the gray/green/red classes in `lib/mark.ts` `statusClass()`, `DayPanel` and `CalendarDayPanel` for the Free/Busy/Unknown rules in the Colour table.
- `bg-gray-900 text-white` buttons become primary `Button`s; `border-gray-300` buttons become secondary.
- `ConfirmedDates`, `RepushBanner`, `ResyncBanner` and `ConfirmedOfferBanner` map one-to-one to `ConfirmedDates` and `Banner` (tones `honey`, `honey`, `info`).
- For your own layout inside a page, use Tailwind's container-query variants (`@min-[600px]:`, `@min-[1024px]:`; the shell is already a container) rather than viewport `md:` / `lg:` breakpoints, so everything follows the app's width.
- `components/bundle.js` is plain, readable React. Copy a component's markup and classes, or load `bundle.css` as is.
