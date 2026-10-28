# ConfirmedDates

The trip's state at the top of its screen: a dashed "กำลังหาวัน" card, or the orange "ยืนยันแล้ว!" card with a hopping party face.

- **Provide:** `confirmedLabel` (leave it out while Finding Dates), `busyNames` (members busy on the confirmed days), `isOrganizer` + `onClear` + `clearing` (the "ยกเลิกวันที่ยืนยัน" link), optional `note` / `hint`.
- This is the biggest orange moment in the app. Keep it the only orange card on the screen.
- Busy-on-confirmed names show in `danger` text so the organizer can follow up.
