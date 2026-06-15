# Dashboard — Implementation Plan

## Scope
Skeleton-only. No functional code. Three layout sections stacked vertically, mobile-first.

## Files Changed

### `src/components/AppHeader/appHeader.scss`
- Remove `border-bottom` from the base `.header` rule
- Add it back inside `@include bp('desktop')` so it only renders on desktop

### `src/components/Homepage/HomepagePage.tsx`
- Delete all existing content (logo, nav buttons, imports)
- Replace with three skeleton sections inside `.dashboard`:
  - `<section class="dashboard__graph" aria-label="Spending trend graph">`
  - `<div class="dashboard__next-deposit" aria-label="Next scheduled deposit">`
  - `<section class="dashboard__accounts" aria-label="Account overview">`

### `src/components/Homepage/homepage.scss`
- Full rewrite for dashboard layout
- `.dashboard`: flex column, full height
- `.dashboard__graph`: `height: calc((100vh - var(--header-height)) * 0.25)`
- `.dashboard__next-deposit`: `min-height` matching PrimeReact Message (~3rem content + padding)
- `.dashboard__accounts`: `flex: 1` to fill remaining space
- On desktop: `grid-column: 1 / -1` (full-width, same as before)

### `src/components/Homepage/HomepagePage.test.tsx`
- Rewrite tests for skeleton structure (renders three sections, correct ARIA labels)

## Routing
Already correct — `App.tsx` has `/` → `/dashboard` redirect and `HomepagePage` on `/dashboard`. No changes needed.

## No New Files
No new components, hooks, services, or contexts.
