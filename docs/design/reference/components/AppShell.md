# AppShell

The responsive frame for every screen: it picks the layout (compact, medium, expanded, split) from its own width and swaps the navigation to match.

- **Provide:** `children` (usually a `PageLayout`), `active` (`'trips'` · `'calendar'`), `onCreate`, `user` (display name), optional `trips` (`[{ key, title, mood, href | onClick, active }]`, the sidebar's recent trips, three at most), `items`, `createLabel`, `bottomNav` (`false` inside a trip and on screens with a sticky footer), `split` (`'auto'` by default: on when the device reports two viewport segments), `contained` (lay out inside a fixed-size box instead of the viewport, for mockups), `style`.
- Navigation per layout: compact → `BottomNav`; medium → nav rail with the round create button; expanded → sidebar with a block สร้างทริป button and recent trips; split → `BottomNav` on the left screen.
- It provides the layout to children: `WeGoJUAN.useLayout()` returns `'compact' | 'medium' | 'expanded' | 'split'`. Use it for decisions CSS can't make (where the suggestions block goes, how many friend badges fit).
- Render `Sheet`s inside the shell (not in a portal to `body`), so they pick up the layout.
- Safe areas come from `env(safe-area-inset-*)`; set `viewport-fit=cover` on the page. Mockups can override `--wg-safe-top` and friends through `style`.
