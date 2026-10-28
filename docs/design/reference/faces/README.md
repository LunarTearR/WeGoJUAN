# Faces

The five Face moods as standalone 32×32 SVGs with the palette's hex colours baked in, for places that can only take an `<img>` (favicon, link previews, emails, app icons). In the app, use the `Face` component instead: it reads the tokens.

- `face-free.svg` — ว่าง / Available. `free-soft` fill, `free` ink.
- `face-busy.svg` — ไม่ว่าง. `busy-soft` fill, `busy` ink, white sweat drop.
- `face-unknown.svg` — ยังไม่ระบุ. White fill, dashed `line-strong` edge, `ink-muted` features.
- `face-party.svg` — Confirmed / a win. `orange` fill, `on-orange` ink. Use as the interim favicon.
- `face-sleepy.svg` — nothing here yet. `peach-100` fill, `orange-ink` ink.

Don't recolour them by hand: if the palette changes, regenerate them from the `Face` drawing.
