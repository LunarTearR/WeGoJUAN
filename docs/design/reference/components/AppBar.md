# AppBar

The top bar: the wordmark on home tabs, or back + trip title inside a trip.

- **Provide:** for a tab, nothing (or `homeHref`) and `actions` (the user's avatar); inside a trip, `title`, optional `subtitle` (the Date Range and Duration), `onBack`, `actions` (secondary sm Buttons and a "more" IconButton for organizer tools).
- On phones it is sticky, `cream`, with a `line` hairline, and pads itself below the status bar / Dynamic Island (`--wg-safe-top`).
- Inside `AppShell` from medium up, the home variant hides (the rail or sidebar carries the brand) and a trip's AppBar becomes the page header without a hairline, with more room above.
- Titles truncate to one line on every width.
