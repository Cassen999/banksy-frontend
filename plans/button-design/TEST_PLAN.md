# Button Design — Test Plan

## Scope

All changes are either:
- **CSS/SCSS only** — box-shadow variable, global overrides, header style cleanup (not unit-testable)
- **Component swap** — native `<button>` → PrimeReact `<Button>` for the hamburger (same rendered element, same ARIA attributes)

No new behaviour is introduced. No new files are created under `src/`.

---

## Existing Tests That Must Still Pass

All tests in `AppHeader.test.tsx` must continue to pass without modification:

| Suite | Tests | Why they survive the swap |
|-------|-------|--------------------------|
| `hamburger button` | 6 tests | PrimeReact `<Button>` renders a `<button>` element and forwards `aria-label`, `aria-expanded`, `aria-controls` — role-based queries still resolve |
| `logo links` | 1 test | Unaffected |
| `auth button — logged out` | 2 tests | Unaffected |
| `auth button — logged in` | 2 tests | Unaffected |
| `desktop — welcome message` | 2 tests | Unaffected |
| `desktop — menubar` | 2 tests | Unaffected |

---

## Verification Steps

1. Run `npm test` — all existing tests pass
2. Run `npm run build` — no TypeScript or build errors
3. Manual smoke test in browser:
   - Light mode: buttons and menubar show visible elevation shadow
   - Dark mode: buttons and menubar show deeper shadow
   - Mobile hamburger button renders as a rounded PrimeReact button with `pi-bars` icon
   - Hamburger carries the same box-shadow as other buttons
   - No double-shadow on the header nav menubar (global rule only, no duplicate local rule)
