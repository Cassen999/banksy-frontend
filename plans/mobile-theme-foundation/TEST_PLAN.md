# Test Plan — mobile-theme-foundation

## Scope

Only `ThemeContext.tsx` requires a test file. All other changed files are either
markdown, in `src/styles/` (skip directory), `index.html`, or in the explicit skip
list (`main.tsx`).

---

## ThemeContext.test.tsx

### Setup

- Mock `window.matchMedia` to control `prefers-color-scheme`
- Mock `localStorage` with `getItem` / `setItem` spies
- Mock `document.documentElement.setAttribute`
- Provide a minimal test consumer component that calls `useTheme()`

---

### Test Cases

#### Initialisation — no stored preference

| # | Scenario | Expected |
|---|---|---|
| 1 | System is `light`, no localStorage entry | theme is `'light'` |
| 2 | System is `dark`, no localStorage entry | theme is `'dark'` |

#### Initialisation — stored preference overrides system

| # | Scenario | Expected |
|---|---|---|
| 3 | System is `dark`, localStorage has `'light'` | theme is `'light'` |
| 4 | System is `light`, localStorage has `'dark'` | theme is `'dark'` |

#### Toggle

| # | Scenario | Expected |
|---|---|---|
| 5 | Theme is `light`, user calls `toggleTheme()` | theme becomes `'dark'` |
| 6 | Theme is `dark`, user calls `toggleTheme()` | theme becomes `'light'` |
| 7 | `toggleTheme()` called | `localStorage.setItem('theme', <new value>)` called |
| 8 | `toggleTheme()` called | `document.documentElement.setAttribute('data-theme', <new value>)` called |

#### System preference change

| # | Scenario | Expected |
|---|---|---|
| 9 | System switches to `dark`, no user override stored | theme updates to `'dark'` |
| 10 | System switches to `light`, user override stored as `'dark'` | theme stays `'dark'` (user preference wins) |

#### Error boundary

| # | Scenario | Expected |
|---|---|---|
| 11 | `useTheme()` called outside `ThemeProvider` | throws `'useTheme must be used within ThemeProvider'` |

---

## Coverage Target

Line ≥ 80%, branch ≥ 80% — enforced by the definition-of-done hook.
