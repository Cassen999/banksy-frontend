# Diagrams — mobile-theme-foundation

## Breakpoint Scale

```
      390px          412px                    844px           924px      1024px
        │               │                       │               │           │
────────┼───────────────┼───────────────────────┼───────────────┼───────────┼──────────▶
        │               │                       │               │           │
        │     base      │      mobile-lg         │   landscape   │  (gap)  desktop
        │  (390–411px)  │     (412–843px)        │  (844–924px)  │         (1024px+)
        │               │                       │               │           │
        │  iPhone 14    │  Pixel 10, S25+        │  all devices  │ irrelevant│
        │  iPhone 17    │                        │  in landscape │           │
```

**Notes:**
- Gap (925–1023px) is explicitly out of scope — no breakpoint needed there
- `landscape` breakpoint is for minor vertical-space tweaks only — layout stays single column
- `mobile-lg` exists for subtle width-sensitive adjustments; layout stays single column

---

## Layout Structure

### Mobile (base → 1023px)

```
┌─────────────────────────────┐
│           HEADER            │  full width — part of Layout
├─────────────────────────────┤
│  SIDEBAR (collapsed/drawer) │  full width — part of Layout
├─────────────────────────────┤
│                             │
│       PAGE BODY             │  single column
│       (content area)        │
│                             │
└─────────────────────────────┘
```

### Desktop (1024px+)

```
┌─────────────────────────────────────────┐
│                 HEADER                  │  full width — part of Layout
├──────────┬──────────────────────────────┤
│          │                             │
│ SIDEBAR  │       PAGE BODY             │
│          │   ┌──────────┬──────────┐   │
│          │   │  col 1   │  col 2   │   │  two-column grid (body only)
│          │   └──────────┴──────────┘   │
└──────────┴──────────────────────────────┘
```

---

## Theme Architecture

```
main.tsx
└── ThemeProvider                          (src/contexts/ThemeContext.tsx)
    │  reads: localStorage, prefers-color-scheme
    │  sets:  document.documentElement[data-theme]
    │  swaps: PrimeReact theme <link> href
    │
    └── PrimeReactProvider
        └── BrowserRouter
            └── App
                └── Layout
                    ├── Header
                    ├── Sidebar
                    └── <page body content>
```

---

## Dark Mode Decision Logic

```
on mount:
  stored = localStorage.getItem('theme')
  if stored is 'light' or 'dark'  → use stored
  else if matchMedia('prefers-color-scheme: dark').matches → use 'dark'
  else → use 'light'

on toggleTheme():
  newTheme = current === 'light' ? 'dark' : 'light'
  localStorage.setItem('theme', newTheme)
  document.documentElement.setAttribute('data-theme', newTheme)
  swap PrimeReact <link> href
  setState(newTheme)

on system preference change (listener):
  if localStorage.getItem('theme') is set → ignore (user override wins)
  else → apply new system preference
```

---

## CSS Custom Property Dark Mode Override

```
:root                         → light mode tokens (default)
[data-theme="dark"]           → dark mode token overrides
```

PrimeReact theme swap covers PrimeReact component colours.
`[data-theme="dark"]` in `root.scss` covers our own CSS custom properties.
