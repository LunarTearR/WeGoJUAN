# StatusIcon

A lucide-react icon inside a round badge that shows a trip's status or a member's availability.

- **Provide:** `kind`, optional `size` (circle diameter, default 32), `title` (pass one when the icon stands alone, e.g. a member in a suggested window: "Nat ว่าง"; omit it when a word sits beside it; an empty string uses the default Thai label), `stamp` (one stamp-in animation, for the moment dates are confirmed).
- Trip status: `finding` = `CalendarClock` on `sand` (กำลังหาวัน) · `confirmed` = `Ticket` on `orange` (ยืนยันแล้ว) · `calendar` = `Calendar` on `sand` (nothing here yet: empty states).
- Member availability: `free` = `Check` on `free-soft` · `busy` = `X` on `mist` (light grey) · `unknown` = `MoreHorizontal` on white with a dashed `line-strong` edge.
- Sizes: 18 in pills, 24 in nav lists, 28 in the picker and suggested windows, 32 in banners and sheet headers, 40–56 on cards, 72–88 in empty states and heroes. The stroke steps from 3 (small) to 2 (large) so it always looks about 2px.
- In the app, build it on `lucide-react`: map `kind` → `{ Icon, className }` and render `<span className={'wg-status wg-status--' + kind}><Icon size={iconSize} strokeWidth={stroke} aria-hidden /></span>`. The geometry in `bundle.js` is lucide's own, so it matches.
- Don't use the icons on their own for status, don't recolour a kind, and don't use `busy` for errors in forms (use `danger` text).
