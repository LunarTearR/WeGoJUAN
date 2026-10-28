# Sheet

One component for day panels and confirmations that adapts per device: bottom sheet on phones, dialog or floating panel on tablets, drawer on PC, the right screen on a Surface Duo.

- **Provide:** `open`, `title`, `onClose`, `children`, optional `footer` (buttons, laid out evenly), `icon` (a StatusIcon kind for the header: `free` / `busy` / `unknown` for my day, `confirmed` on a confirmed date), `placement` (`'center'` for confirmations, the default; `'side'` for a calendar day), `inline` (position inside a container instead of the viewport, for previews).
- `center`: bottom sheet on compact, a centred 480px dialog from medium up, centred on the left screen in split.
- `side`: bottom sheet on compact; a panel floating above the bottom (560 max) on medium; a non-modal right-hand drawer on expanded that takes the aside's place; the whole right screen in split.
- Day panel: `StatusPicker` → Reason field (busy, personal calendar only) → until-date → friends' status pills → "ยังไม่ระบุ: …". Save sits in the footer.
- Confirmations (delete, leave, remove, new link): plain title as a question, one sentence on what is lost, footer with a `danger` button and a `secondary` "ยกเลิก". No icons on destructive sheets.
- Render it inside `AppShell` so it knows the layout. Closes on the scrim, the close button and Esc.
