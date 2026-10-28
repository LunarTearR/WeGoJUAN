# BottomNav

The phone's floating tab bar: ทริปของฉัน, a round orange create button, ปฏิทินของฉัน.

- **Provide:** `active` (`'trips'` · `'calendar'`), `onCreate`, optional `items` (two `{ key, label, icon, href | onClick }`), `createLabel`, `static` (render in flow instead of fixed, for previews).
- `AppShell` renders it for you on compact (and on the left screen in split); it is hidden from medium up, where the rail or sidebar takes over.
- It floats `space-3` above the home indicator (`--wg-safe-bottom`). The shell gives the page room to scroll clear of it.
- Hide it inside a trip and on screens with a sticky form footer (create trip, join).
