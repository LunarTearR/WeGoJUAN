# StatusPicker

Three big buttons for setting my own day, each with its status icon: ว่าง (Check), ไม่ว่าง (X), ไม่ระบุ (…).

- **Provide:** `value` (`'free'` · `'busy'` · `null`), `onChange(status)`, optional `allowUnknown` (default true), `labels`, `label` (the group's accessible name), `disabled`.
- It is a radio group: the chosen option takes the icon's minimalist colours (soft green, light grey `mist`, white with a dashed edge) and its icon pops.
- Use it in the day `Sheet` (personal and trip calendars). After it, show the Reason field only when `busy` is chosen.
- "ไม่ระบุ" clears the mark: the day becomes Unknown. There is no "maybe".
