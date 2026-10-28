# MemberChip

One trip member: avatar, name, role pills, and the organizer's remove button.

- **Provide:** `name`, optional `isOrganizer` (ผู้จัด pill), `isGuest` (แขก pill), `isMe` (orange outline + "(คุณ)"), `onRemove` (shows a close button; only for the organizer, never on themselves), `removing`.
- Lay them out in a wrapping `ul.wg-members` list.
- Removing someone always confirms in a `Sheet` first: "นำ {name} ออกจากทริป? วันว่างที่เขาระบุในทริปนี้จะหายไปด้วย".
