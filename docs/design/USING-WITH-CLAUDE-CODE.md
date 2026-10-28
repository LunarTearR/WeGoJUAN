# Using this design system with Claude Code

1. Unzip this kit at the root of the WeGoJUAN repo. It adds `docs/design/`, `web/src/design/` and `.claude/skills/wegojuan-design/`. Nothing existing is overwritten.
2. Commit it on a branch: `git checkout -b feature/design-system && git add docs/design web/src/design .claude && git commit -m "docs: add WeGoJUAN design system"`.
3. Optional, so every session knows about it: add to `CLAUDE.md` at the repo root:
   `UI work in web/ follows the WeGoJUAN design system: use the wegojuan-design skill (docs/design/README.md).`
4. Start `claude` in the repo root and work in small steps, one PR each:
   1. "Use the wegojuan-design skill. Set up the foundation: styles.css imports, viewport-fit=cover in index.html, and check the fonts load. Don't change components yet."
   2. "Port Button, TextField, Face, Icon, Pill and Banner from docs/design/reference into web/src/components/ui as TypeScript, then swap the existing gray buttons and inputs over."
   3. "Port AppShell, SideNav, BottomNav, AppBar, PageLayout and useLayout, and replace components/layout/app-shell.tsx. Check 375, 820, 1180 and 1440px against docs/design/screens."
   4. "Restyle the personal calendar (MonthGrid, DayCell, StatusPicker, Sheet side panel, busy summary) to match ScreenCalendar.png and ScreenDesktopCalendar.png."
   5. "Restyle the trip page (ConfirmedDates, banners, SuggestionCard, trip calendar, MemberChip, InviteLinkBox) and replace every window.confirm with a confirm Sheet."
   6. "Restyle trips list, create, join, login and register, using the lines in docs/design/copy.md."
5. After each step: `cd web && npm run lint && npm run build`, then look at it in the browser at phone, tablet and PC widths.

To change the design later (a colour, a component), edit it in the design system on claude.ai, then ask for a fresh kit, or ask Claude Code to update `docs/design/tokens.json` and `web/src/design/tokens.css` together.
