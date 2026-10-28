# PageLayout

Places a page's header, main column and aside for each layout.

- **Provide:** `children` (the main column, stacked at `space-6`), optional `header` (an `AppBar`, or a title block on tab pages), `aside` (secondary content), `asideLabel` (its accessible name).
- compact: header, main, then the aside below it. medium: the same in one centred `content-max` column. expanded: main beside a `aside-width` aside, capped at `page-max`. split: header and main on the left screen, the aside on the right screen.
- When a side `Sheet` is docked on expanded, the aside steps aside for it and the main column keeps its full width.
- Trip page: main = `ConfirmedDates`, banners, the member calendar; aside = suggested windows, members, invite link. My calendar: main = the month; aside = the private busy summary.
