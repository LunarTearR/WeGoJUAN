# SideNav

The rail (medium) and sidebar (expanded) navigation that `AppShell` renders; use it directly only when building your own shell.

- **Provide:** `active`, `onCreate`, optional `items` (`{ key, label, short, icon, href | onClick }`: the rail shows `short`, the sidebar `label`), `trips` (recent trips with `status`: `'finding'` or `'confirmed'`, shown as a 24px StatusIcon), `tripsHeading` (default "ทริปล่าสุด"), `user`, `createLabel`, `homeHref`.
- It is hidden on compact and in split; it needs an `.wg-app` container above it to appear.
- Rail: the orange ticket (`confirmed` StatusIcon) as the mark, the round create button, two tabs with short labels, the avatar at the bottom. Sidebar: the Wordmark, a block primary สร้างทริป, full-width tab rows, up to three recent trips, the user's name at the bottom.
- The active tab is `peach-100` with an `orange-ink` label, as in the `BottomNav`.
