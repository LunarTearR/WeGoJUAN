# DayCell

One calendar day: my status as the fill, and in trips, my friends' initials.

- **Provide:** `day` (number), `status` (`'free'` · `'busy'` · `null`), `variant` (`personal` · `trip`), `friends` (`[{ name, status }]`, trip only), `maxFriends`, `selected`, `today`, `confirmed`, `reason` (personal only: the private Reason text) or `hasReason`, `outside` (outside the month or the Date Range), `onClick`, `label` / `dateLabel` (for the aria-label).
- Free = solid `free-soft`; Busy = `busy-soft` with a diagonal hatch; Unknown = white with a dashed `line-strong` edge. Three textures, so status never depends on colour alone.
- Confirmed days get an `orange-ink` ring and a small orange dot; the selected day an `ink` outline; today an orange underline under the number.
- Friend badges before "+N": 4 on compact and split, 6 on medium, 8 on expanded (from `useLayout()`), or your `maxFriends`. Only friends who marked the day appear.
- A Reason shows as a dot on small grids and as text in wide ones. It is private: never pass it to a trip cell.
- When the status changes, the fill pops once.
