# Initials

Two-letter name badges: the tiny free/busy badges inside trip calendar cells, and round avatars.

- **Provide:** `name`; for a cell badge `status` (`free` · `busy`); for an avatar `size` (`md` 32px · `lg` 40px).
- Initials take the first two visible letters, so Thai vowels never split ("ปลาย" → "ปล").
- In a cell, free is a round teal badge and busy is a squarer rose badge (`radius-xs`): shape and colour both differ. Each badge has an aria-label with the full name and status.
- Friends with no mark (Unknown) get no badge in the cell; list them in the day sheet instead.
- `AvatarStack` (also exported) overlaps up to `max` avatars and adds "+N".
