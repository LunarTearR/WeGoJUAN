# Microcopy

Ready-made Thai lines for every state in the app. The first column is the plain label or title; the second is the line that carries the personality. Keep the domain terms exactly as written.

## Trips list (ทริปของฉัน)

| State | Title / label | Second line | Face |
|---|---|---|---|
| Greeting | ทริปของฉัน | สวัสดี {name} วันนี้ชวนใครไปไหนดี? | — |
| Empty | ยังไม่มีทริปเลย | แก๊งเงียบไปนานแล้วนะ ชวนกันไปไหนสักที่ไหม? · CTA: สร้างทริปแรก | `sleepy` |
| Start from calendar | เริ่มจากปฏิทินก่อนก็ได้ | ระบุวันว่างในปฏิทินของฉันครั้งเดียว ใช้ได้กับทุกทริป · CTA: ระบุวันว่าง | `sleepy` |
| Loading | — | กำลังโหลดทริป… | — |

## Creating & joining

| State | Title / label | Second line | Face |
|---|---|---|---|
| Create intro | สร้างทริป | ตั้งชื่อ เลือกช่วงวันที่เปิดให้เลือก แล้วส่งลิงก์เข้ากลุ่ม ที่เหลือเราช่วยหาวันให้ | `free` |
| Trip name | ชื่อทริป | placeholder: เช่น ทะเลกันมั้ย แก๊ง | — |
| Duration | ไปกี่วัน | ไปติดกันกี่วัน เช่น 3 = ศุกร์ถึงอาทิตย์ | — |
| Invite landing | {organizer} ชวนคุณไปเที่ยว! | {title} · เลือกได้ {range} · ไป {n} วัน · อยู่ในทริปแล้ว {count} คน | `party` |
| Guest name | ชื่อที่ใช้ในทริปนี้ | placeholder: เพื่อน ๆ เรียกคุณว่าอะไร? | — |
| Guest note | — | ระบบจำคุณได้เฉพาะเครื่องนี้ สมัครทีหลังได้ วันว่างไม่หาย | — |
| Name taken | — | ชื่อนี้มีคนใช้ในทริปแล้ว ลองตั้งชื่ออื่น | — |
| Invalid link | ลิงก์เชิญนี้ใช้ไม่ได้แล้ว | อาจถูกเปลี่ยนไปแล้ว ลองขอลิงก์ใหม่จากผู้จัดนะ | `unknown` |

## Inside a trip

| State | Title / label | Second line | Face |
|---|---|---|---|
| Finding dates | กำลังหาวัน | ช่วยกันระบุวันว่าง แล้วผู้จัดจะเลือกช่วงที่ลงตัวที่สุด | `unknown` |
| Confirmed | ยืนยันแล้ว! | {dates} · จดไว้เลย ห้ามเทนะ | `party` (hop) |
| Busy on confirmed days | — | ไม่ว่างในวันที่ยืนยัน: {names} | — |
| Confirm offer | กันวันไว้ในปฏิทินของฉันไหม? | จะทำเครื่องหมายไม่ว่าง {dates} จะได้ไม่ซ้อนกับนัดอื่น · กันวันไว้เลย / ไม่ต้อง | `party` |
| Offer changed (409) | — | วันที่ยืนยันเพิ่งเปลี่ยน ดูวันใหม่แล้วตอบอีกครั้งนะ | `unknown` |
| Re-push | ช่วงวันของทริปเปลี่ยนแล้ว | อัปเดตจากปฏิทินของฉันอีกรอบไหม? · อัปเดต | `unknown` |
| Re-sync | ปฏิทินเปลี่ยนแล้ว | อัปเดตไปยังทริปเหล่านี้ด้วยไหม? | `unknown` |
| Suggestions heading | ช่วงวันที่แนะนำ | {n} ช่วง | — |
| Best window | ลงตัวที่สุด | — | — |
| Everyone free | — | ว่างครบทุกคน! ไปกันเลย | — |
| Counts | — | ว่าง {a} · ติด {b} · ยังไม่ระบุ {u} | — |
| No match | ยังหาวันที่ลงตัวไม่เจอ | ชวนเพื่อนมาระบุวันเพิ่มอีกนิด เดี๋ยวก็เจอ · CTA: ชวนเพื่อนมาระบุวัน | `unknown` |
| Loading suggestions | — | กำลังหาวันที่ทุกคนว่าง… | — |
| Loading marks | — | กำลังนับหัวเพื่อน… | — |
| Calendar hint | วันว่างของสมาชิก | แตะวันเพื่อตั้งวันของฉัน แล้วดูว่าใครว่างบ้าง | — |
| Push panel | อัปเดตจากปฏิทินของฉัน | วันที่ทริปไม่ตรงกับปฏิทินของคุณ ติ๊กวันที่จะอัปเดตตามปฏิทิน | — |
| Push: in sync | — | ทริปตรงกับปฏิทินแล้ว | `free` |
| Invite box | ชวนเพื่อนเข้าทริป | ใครได้ลิงก์นี้ก็เข้าทริปได้ทันที | — |
| Copied | คัดลอกแล้ว! | — | — |
| Share | แชร์เข้ากลุ่มแชต | — | — |

## Calendars

| State | Title / label | Second line | Face |
|---|---|---|---|
| My calendar | ปฏิทินของฉัน | ตั้งครั้งเดียว ใช้ได้กับทุกทริป | — |
| Reason field | เหตุผล (ไม่บังคับ · เห็นแค่คุณ) | placeholder: เช่น ทำงาน, งานแต่งเพื่อน | — |
| Until-date | ถึงวันที่ (ไม่บังคับ) | ตั้งหลายวันพร้อมกันได้ | — |
| Save | บันทึก (จะเปลี่ยน {n} วัน) | — | — |
| Busy summary | ไม่ว่างเดือนนี้ | pill: เห็นแค่คุณ | — |
| Busy summary empty | — | เดือนนี้ว่างยาว ๆ เลย | `free` |

## Navigation (all devices)

| Where | Label |
|---|---|
| Bottom nav (phone), sidebar (PC) | ทริปของฉัน · ปฏิทินของฉัน |
| Nav rail (tablet) | ทริป · ปฏิทิน |
| Create button (round, rail and bottom nav) | aria-label: สร้างทริป |
| Sidebar block button | สร้างทริป |
| Sidebar recent trips heading | ทริปล่าสุด |
| PC trip header actions | แก้ไขช่วงวัน · ชวนเพื่อน · ตัวเลือกทริป (more) |
| Show more windows | ดูเพิ่มอีก {n} ช่วง |
| Day drawer (PC), after saving a calendar day used by a trip | ทริปที่อาจต้องอัปเดต · {trip} ใช้วันนี้จากปฏิทินของคุณ บันทึกแล้วเราจะชวนอัปเดตให้ |

## Errors & serious moments (no jokes)

| State | Title | Body | Button |
|---|---|---|---|
| Save failed | อุ๊ย บันทึกไม่สำเร็จ | {error message} | ลองอีกครั้ง |
| Load failed | โหลดไม่สำเร็จ | {error message} | ลองอีกครั้ง |
| Trip not found | หาทริปนี้ไม่เจอ | อาจถูกลบไปแล้ว หรือคุณยังไม่ได้เป็นสมาชิก | กลับไปที่ทริปของฉัน |
| Page not found | หลงทางแล้ว | หน้านี้ไม่มีอยู่จริง | กลับไปที่ทริปของฉัน |
| Delete trip | ลบทริป "{title}"? | สมาชิกและวันว่างในทริปจะหายไปทั้งหมด ย้อนกลับไม่ได้ | ลบทริป (danger) / ยกเลิก |
| Leave trip | ออกจากทริปนี้? | วันว่างที่คุณระบุในทริปนี้จะหายไป | ออกจากทริป (danger) / ยกเลิก |
| Remove member | นำ {name} ออกจากทริป? | วันว่างที่เขาระบุในทริปนี้จะหายไปด้วย | นำออก (danger) / ยกเลิก |
| New invite link | สร้างลิงก์ใหม่? | ลิงก์เดิมจะใช้ไม่ได้ทันที | สร้างลิงก์ใหม่ / ยกเลิก |
