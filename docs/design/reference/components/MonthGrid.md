# MonthGrid

A Sunday-first month grid with Thai weekday names; you render each day, and the grid grows with its own width.

- **Provide:** `year`, `month` (1–12), `renderDay(isoDate, dayOfMonth)` returning a `DayCell`.
- Weekends (อา, ส) are tinted `orange-ink` in the header.
- The grid is its own size container: under 520px (phones, ~45px cells) short weekday names and a `space-1` gap; from 520px (tablet column, Duo screen) a `space-2` gap and taller trip days; from 680px (PC main column) full weekday names (อาทิตย์ … เสาร์), 104px trip days and Reasons written inside busy days.
- Give it the full width of its column: on phones edge to edge inside the gutter, on PC the whole main column.
