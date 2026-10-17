# Drawer Escape ownership

Verified locally on 2026-10-16. Not published or deployed.

## Bug and fix

The shared drawer listener handled Escape even after a Radix dropdown had consumed
it. One key press consequently dismissed both the status menu and its parent drawer.
The menu is portalled and has role `menu`, so the existing other-dialog guard alone
could not protect the drawer.

`handleDrawerEscape` now respects `event.defaultPrevented`, preserving the existing
other-dialog guard. The first Escape closes the topmost popup; a subsequent separate
Escape closes the drawer. Tracker and Match details share this hook. All Jobs does
not have this drawer. Tab handling, focus restoration and breakpoints are unchanged.
No dependencies, API contracts, tracker storage format or collector behavior changed.

## Verification

- Ten regression cases cover consumed/unhandled Escape, successive key presses,
  duplicate handling, another dialog, the current drawer, a portalled menu and
  unrelated keys. Before the guard, four cases failed; afterwards all ten passed.
- Complete frontend suite: 111 tests in 23 files; ESLint and the TypeScript/Vite
  production build passed on the existing Node 22.23.3 runtime.
- Real local browser with synthetic data: Tracker and Matches at 1280px and 390px,
  status menu closes first and drawer closes second. Tracker was checked in light
  and dark themes. Keyboard-opened menu returns focus to its trigger after Escape.
- Ctrl+/ palette over Tracker closes without dismissing the underlying drawer;
  the next Escape closes that drawer. Mobile pages had no horizontal overflow.
- Browser checks exercise the actual React/Radix integration; unit tests exercise
  the extracted event policy without adding a DOM dependency.

Screenshot: ignored local `work/drawer-escape-fixed-20261016.jpg`, captured after
the first Escape with the menu closed and Match details still visible.

The temporary loopback API uses in-memory SQLite and synthetic records, not live
collectors or notifications. One synthetic match was saved in the localhost-only
test tracker; the production site's browser storage was not accessed. No production
checks or backend test rerun were needed for this frontend-only fix.
Temporary browser viewport was reset and the task tab closed. The verified task-owned
Vite and fixture API listeners on ports 5176 and 8766 were stopped after verification.
Both repositories passed `git diff --check`; unrelated worktree changes were preserved.
