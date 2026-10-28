# Status icons

The six StatusIcon kinds as standalone 32×32 SVGs with the palette's hex colours baked in, for places that can only take an `<img>`: the favicon, link previews, emails, app icons. In the app, use the `StatusIcon` component (lucide-react) instead: it reads the tokens. Icon geometry is Lucide's (ISC licence).

- `status-finding.svg`: กำลังหาวัน. `CalendarClock` in `ink-muted` on a `sand` circle.
- `status-confirmed.svg`: ยืนยันแล้ว. `Ticket` in `on-orange` on an `orange` circle. Use it as the interim favicon.
- `status-calendar.svg`: nothing here yet. `Calendar` in `ink-muted` on `sand`.
- `status-free.svg`: ว่าง. `Check` in `free` on `free-soft`.
- `status-busy.svg`: ไม่ว่าง. `X` in `mist-ink` on `mist` (light grey).
- `status-unknown.svg`: ยังไม่ระบุ. `MoreHorizontal` in `ink-muted` on white with a dashed `line-strong` edge.

Don't recolour them by hand: if the palette changes, regenerate them from the tokens.
