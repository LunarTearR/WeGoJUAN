# Pill

A small rounded label for status and roles.

- **Provide:** `children` (one to four words), `tone`, optional `icon` (an Icon name) or `status` (a StatusIcon kind, drawn as an 18px badge at the start).
- Tones: `solid` (orange: ยืนยันแล้ว, ผู้จัด, ลงตัวที่สุด) · `orange` (soft tint: เห็นแค่คุณ) · `neutral` (กำลังหาวัน, แขก) · `outline` (white with a hairline: the default when `status` is set, for a friend's status in the day sheet: `{ status: 'free' }` Nat) · `free` / `busy` (tinted, for single words) · `honey` (waiting for a re-sync).
- Pills are read-only. Never make one look like a button.
