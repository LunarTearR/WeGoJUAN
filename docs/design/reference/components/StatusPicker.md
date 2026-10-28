# StatusPicker

Three big face buttons for setting my own day: ว่าง, ไม่ว่าง, ไม่ระบุ.

- **Provide:** `value` (`'free'` · `'busy'` · `null`), `onChange(status)`, optional `allowUnknown` (default true), `labels`, `label` (the group's accessible name), `disabled`.
- It is a radio group: the chosen option fills with its status colours and its face pops.
- Use it in the day `Sheet` (personal and trip calendars). After it, show the Reason field only when `busy` is chosen.
- "ไม่ระบุ" clears the mark: the day becomes Unknown. There is no "maybe".
