# Implementation Plan — mobile-theme-foundation

## Goal

Establish the mobile-first style foundation and PrimeReact Lara Light Blue theme with
system-preference-aware light/dark mode toggle.

---

## Devices and Breakpoints

Target devices (CSS viewport widths):

| Device | Width | Height | Landscape width |
|---|---|---|---|
| iPhone 14 | 390px | 844px | 844px |
| iPhone 17 | 402px | 874px | 874px |
| Samsung Galaxy S25+ | 412px | 891px | 891px |
| Google Pixel 10 | 412px | 924px | 924px |

Widths below 390px and widths between 925px–1023px are out of scope.

### Breakpoint map (added to `variables.scss`)

```scss
$breakpoints: (
  'mobile-lg':  412px,   // wider Android phones (Pixel 10, S25+)
  'landscape':  844px,   // mobile landscape (844px–924px range)
  'desktop':    1024px,  // desktop and above
);
```

Base styles (no breakpoint) target 390px and above — the smallest in-scope device.
The `landscape` breakpoint exists for minor vertical-space adjustments only; the layout
does not change in landscape (single column is preserved).

---

## Layout Grid

- **Mobile (base → 1023px):** single column, full width
- **Desktop (1024px+):** two-column grid applied to the page body content only.
  Header and sidebar are full-width and are part of the Layout component — they are
  exempt from the two-column grid.

---

## Touch Targets

All interactive elements must meet a **44×44px minimum tap target** (Apple HIG /
Google Material Design / WCAG 2.1 AAA 2.5.5). This applies to buttons, links, form
inputs, icons, and any other tappable element. PrimeReact's default styles generally
meet this — verify during component implementation and override if needed.

---

## Safe Area Insets

The Layout component must apply `env(safe-area-inset-*)` padding to prevent content
from being obscured by the iPhone Dynamic Island or Android edge-to-edge displays.
Add `meta name="viewport"` with `viewport-fit=cover` to `index.html`.

---

## Dark Mode

- Default: system `prefers-color-scheme` media query
- User can override with an in-app toggle (persisted to `localStorage`)
- Implementation: `ThemeContext` in `src/contexts/ThemeContext.tsx`
  - Reads `localStorage.getItem('theme')` on mount; falls back to `window.matchMedia`
  - Sets `document.documentElement.setAttribute('data-theme', 'light' | 'dark')`
  - Swaps the PrimeReact theme `<link>` href between `lara-light-blue` and `lara-dark-blue`
  - Listens to `prefers-color-scheme` changes and updates if no user override is stored

---

## Files Changed

| File | Change | Test required |
|---|---|---|
| `_dev/ARCHITECTURE.md` | Add mobile-first rules section | No (markdown) |
| `src/styles/variables.scss` | Add `$breakpoints` map | No (`src/styles/` skip dir) |
| `src/styles/root.scss` | Add dark mode CSS custom property overrides | No (`src/styles/` skip dir) |
| `src/styles/index.scss` | Add PrimeReact CSS imports | No (`src/styles/` skip dir) |
| `index.html` | Add `viewport-fit=cover` to viewport meta tag | No |
| `src/contexts/ThemeContext.tsx` | New ThemeContext — light/dark toggle | Yes — write test first |
| `src/contexts/ThemeContext.test.tsx` | Tests for ThemeContext | Written before implementation |
| `src/main.tsx` | Wrap app in `ThemeProvider` | No (skip list) |

---

## Implementation Order

1. Update `_dev/ARCHITECTURE.md` — mobile-first rules section
2. Update `src/styles/variables.scss` — add `$breakpoints` map
3. Update `src/styles/root.scss` — add `[data-theme="dark"]` overrides
4. Update `index.html` — add `viewport-fit=cover`
5. Write `src/contexts/ThemeContext.test.tsx`
6. Write `src/contexts/ThemeContext.tsx`
7. Update `src/styles/index.scss` — add PrimeReact CSS imports
8. Update `src/main.tsx` — wrap app in `ThemeProvider`
