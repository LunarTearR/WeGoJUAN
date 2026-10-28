# Button

The tactile action button: a light-orange primary with a candy lip, a white secondary, and quiet ghost and danger text buttons.

- **Provide:** `children` (a plain verb: "สร้างทริป", "เลือกช่วงนี้"), optional `icon` / `iconEnd` (an `Icon` name), `variant` (`primary` · `secondary` · `ghost` · `danger`), `size` (`md` 48px · `sm` 36px), `block`, `loading`, `done`, `href`, plus any button attribute.
- One `primary` per screen: the thing the screen is for. Everything else is `secondary` or `ghost`.
- `danger` is for destructive actions (ลบทริป, ออกจากทริป, นำออก). Put them at the bottom of a screen or in a confirm `Sheet`, never next to the primary.
- `loading` swaps the label for three bouncing dots; keep an `aria-label` on it. `done` turns the button teal with a pop (e.g. "คัดลอกแล้ว!") for about 2 seconds.
- On phones, a form's main action is `block` in a sticky footer.
- Don't put white text on orange, and don't stack two primaries.
