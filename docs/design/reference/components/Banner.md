# Banner

An inline message with a face, a title, a line of text and optional actions.

- **Provide:** `tone` (`info` peach · `honey` heads-up · `success` teal · `danger` rose), `title`, `children` (one or two sentences), optional `actions` (sm Buttons), `mood` (override the default face, or `null` for none), `onDismiss`.
- Defaults: `info` → party face (confirm offer), `honey` → unknown face (re-push, re-sync), `success` → free face (saved), `danger` → busy face (errors).
- Put banners right under the trip status, newest first, at most two on a screen.
- `danger` is announced with `role="alert"`. Its text explains plainly; the opener can be soft ("อุ๊ย บันทึกไม่สำเร็จ").
