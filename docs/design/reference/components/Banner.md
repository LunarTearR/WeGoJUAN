# Banner

An inline message with a status icon, a title, a line of text and optional actions.

- **Provide:** `tone` (`info` peach · `honey` heads-up · `success` teal · `danger` rose), `title`, `children` (one or two sentences), optional `actions` (sm Buttons), `icon` (a StatusIcon kind to override the default, or `null` for none), `onDismiss`.
- Defaults: `info` → `confirmed` ticket (confirm offer), `honey` → `finding` calendar-clock (re-push, re-sync), `success` → `free` check (saved), `danger` → `busy` X (errors). Use `calendar` for gentle nudges with nothing urgent ("เริ่มจากปฏิทินก่อนก็ได้").
- On the tinted banner the icon's circle turns white so it stays visible; the confirmed ticket stays orange.
- Put banners right under the trip status, newest first, at most two on a screen.
- `danger` is announced with `role="alert"`. Its text explains plainly; the opener can be soft ("อุ๊ย บันทึกไม่สำเร็จ").
