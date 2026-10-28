# Face

The brand's emotion: five round faces that react to what happens (free, busy, unknown, party, sleepy).

- **Provide:** `mood`, `size` (default 32), optional `title` (pass one when the face carries meaning on its own, e.g. a person's status in a SuggestionCard; omit it when a word sits beside it), `hop` (one gentle hop on mount, for Confirmed moments).
- `free` ว่าง · `busy` ไม่ว่าง · `unknown` ยังไม่ระบุ / not decided · `party` Confirmed or a win · `sleepy` nothing here yet.
- One face per card, banner or sheet header. 16–28px in pills and lists, 32–44px in cards, 56–88px in heroes and empty states.
- Colours come from tokens, so faces always match. For `<img>` use (favicon, link previews), the Faces assets are the same drawings with hex colours.
- Don't use faces as decoration with no meaning, and don't invent moods in place.
