# Icon

Line icons on a 24px grid with a 2px round stroke, drawn in `currentColor`.

- **Provide:** `name` (trip, calendar, plus, users, copy, share, refresh, flag, sparkle, lock, edit, trash, exit, check, close, more, chevron-left, chevron-right), optional `size` (default 24) and `title` (makes it a labelled image; otherwise it is hidden from screen readers).
- `flag` = Confirmed, `sparkle` = the best window, `lock` = private (Reason). Keep those meanings.
- Use 20px inside md buttons, 18px in sm buttons, 14px in pills.
- Status (trip state, availability) is never an `Icon`: use `StatusIcon`. New icons come from lucide-react, the same family as the status icons.
