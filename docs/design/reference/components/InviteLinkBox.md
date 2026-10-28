# InviteLinkBox

The invite link card: copy it, share it to the group chat, and (organizer) replace it.

- **Provide:** `url`, optional `onShare` (show it when `navigator.share` exists: on phones that is the main path), `canReplace` + `onReplace` + `replacing` (organizer), `onCopy`, `copied` (to force the copied state).
- Copy turns the button teal with "คัดลอกแล้ว!" for about 2.4 seconds.
- Replacing the link always confirms in a `Sheet`: "สร้างลิงก์ใหม่? ลิงก์เดิมจะใช้ไม่ได้ทันที".
