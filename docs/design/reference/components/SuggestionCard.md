# SuggestionCard

One suggested window: rank, dates, a face for every member, and the organizer's pick button.

- **Provide:** `rank` (1-based), `rangeLabel`, `durationDays`, `available` / `busy` / `unknown` (name arrays: together every member exactly once), `canConfirm` (organizer), `onConfirm`, `confirming`, `isConfirmed`.
- Rank 1 is the "ลงตัวที่สุด" card: orange border, sparkle pill, primary button. The others are quiet with a secondary button.
- The big stat is Available / members. When nobody is busy or unknown, the counts line becomes "ว่างครบทุกคน! ไปกันเลย".
- Busy names are listed in `busy`, unknown names in `ink-muted`. Show the top 3 on a phone, then a "ดูเพิ่ม" ghost button.
