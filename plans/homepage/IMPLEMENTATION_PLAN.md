# Homepage — Implementation Plan

## Summary
Landing page for Banksy. Two layouts: desktop (centered welcome + nav grid, logged-in only) and mobile (nav buttons in a column, logged-in only). No background image. No Lottie animation. No data fetching, no mutations.

---

## Files to modify

| Action | Path | Notes |
|--------|------|-------|
| Modify | `src/components/Homepage/HomepagePage.tsx` | Restructure JSX |
| Modify | `src/components/Homepage/HomepagePage.test.tsx` | Update tests to match new structure |
| Modify | `src/components/Homepage/homepage.scss` | Restyle desktop layout |
| Modify | `plans/homepage/DIAGRAMS.md` | Update layout diagrams |
| Modify | `plans/homepage/TEST_PLAN.md` | Update test cases |
| Modify | `_dev/ARCHITECTURE.md` | Update homepage component docs |

---

## Component: `HomepagePage`

Layer: **Layer 1 — Page/View**
Path: `src/components/Homepage/HomepagePage.tsx`

### Props
None — reads `user` from `useAuth()` directly.

### Auth logic
```ts
const { user } = useAuth()
```

#### JSX structure (logged-in)

```tsx
<div className="homepage">
  <div className="homepage__content">
    <h1 className="homepage__heading">
      Welcome to{' '}
      <img src={banksyLogo} alt="Banksy" className="homepage__logo" />
    </h1>
    <nav className="homepage__nav" aria-label="Main navigation">
      {NAV_ITEMS.map((item) => (
        <Button key={item.label} label={item.label} icon={item.icon} />
      ))}
    </nav>
  </div>
</div>
```

### JSX structure (logged-out)
```tsx
<div className="homepage">
  <div className="homepage__content">
    <h1>Please log in to be finance guy</h1>
  </div>
</div>
```

### Accessibility
- One `<h1>` per page
- Banksy logo `<img>` has `alt="Banksy"` — h1 reads as "Welcome to Banksy"
- Nav wrapped in `<nav aria-label="Main navigation">`

---

## Desktop layout (≥1024px, logged-in)

```
┌─────────────────────────────────────────────────┐
│                                                   │
│        Welcome to [banksy-logo]                   │  ← h1, centered, top
│                                                   │
│        [Dashboard]    [Accounts]                  │
│        [Transactions] [Reports]                   │
│        [Settings]                                 │
│                                                   │
└─────────────────────────────────────────────────┘
```

- `.homepage`: full-width flex-column, `align-items: center`, `justify-content: flex-start`
- `.homepage__content`: flex-column, `align-items: center`, `gap: $spacing-xl`, top padding
- `.homepage__heading`: inline-flex, `align-items: center`, `gap: $spacing-sm`
- `.homepage__nav`: CSS grid, `grid-template-columns: repeat(2, auto)`, `justify-content: center`
  - 5 items auto-flow: col 1 gets rows 1/2/3 (Dashboard, Transactions, Settings), col 2 gets rows 1/2 (Accounts, Reports)
- `.homepage__logo`: `height: 1.2em`, `vertical-align: middle`

---

## Mobile layout (<1024px, logged-in)

- `.homepage__nav`: flex-column, items full width
- No Lottie animation (removed)
- No background image

---

## SCSS structure (`homepage.scss`)

```scss
.homepage {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  height: 100%;
  width: 100%;

  &__content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $spacing-xl;
    padding: $spacing-xl;
    width: 100%;
  }

  &__heading {
    display: inline-flex;
    align-items: center;
    gap: $spacing-sm;
    font-size: clamp(1.25rem, 5vw, 2rem);
    color: var(--color-text);
    margin: 0;
    text-align: center;
  }

  &__logo {
    height: 1.2em;
    vertical-align: middle;
  }

  &__nav {
    display: flex;
    flex-direction: column;
    gap: $spacing-md;
    width: 100%;
  }

  @include bp('desktop') {
    grid-column: 1 / -1;

    &__heading {
      font-size: clamp(1rem, 2vw, 1.75rem);
    }

    &__nav {
      display: grid;
      grid-template-columns: repeat(2, auto);
      width: auto;
    }
  }
}
```

---

## Route
No change — `/` still renders `<HomepagePage />`.
