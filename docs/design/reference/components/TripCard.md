# TripCard

A trip in "ทริปของฉัน": its mood, title, date range, state and who's in it.

- **Provide:** `title`, `rangeLabel` (the Date Range, e.g. "1–20 ธ.ค."), `durationDays`, `confirmedLabel` (only when Confirmed), `members` (names), and `href` or `onClick`.
- The face tells the state at a glance: `party` when Confirmed, `unknown` while Finding Dates. The pill repeats it in words.
- The whole card is one tap target with a chevron. Keep titles to one line (they truncate).
