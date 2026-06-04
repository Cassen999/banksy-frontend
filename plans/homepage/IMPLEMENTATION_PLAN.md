# Homepage — Implementation Plan

## Summary
Display-only landing page for Banksy. Two layouts: desktop (static background image with transparent overlay area) and mobile (Lottie animation + text below). Conditional message based on auth state. No data fetching, no mutations.

---

## Files to create / modify

| Action | Path | Notes |
|--------|------|-------|
| Install dep | `lottie-react` | Lottie animation for mobile view |
| Create | `src/components/Homepage/HomepagePage.test.tsx` | Written before implementation |
| Create | `src/components/Homepage/HomepagePage.tsx` | Route-level component |
| Create | `src/components/Homepage/homepage.scss` | Component styles |
| Modify | `src/styles/index.scss` | Import homepage.scss |
| Modify | `src/App.tsx` | Replace placeholder with `<HomepagePage />` at `/` |
| Modify | `_dev/ARCHITECTURE.md` | Document new component |

---

## Component: `HomepagePage`

Layer: **Layer 1 — Page/View**  
Path: `src/components/Homepage/HomepagePage.tsx`

### Props
None — reads `user` from `useAuth()` directly.

### Auth logic
```ts
const { user } = useAuth()
const isLoggedIn = user !== null
```

### Desktop layout (≥1024px)
- Root element: full-viewport `div.homepage` with `stonks.png` as `background-image`
- Inner `div.homepage__overlay` absolutely positioned over the right 30% of the image (right: 0, width: 30%, full height)
- Inside overlay: `h1` with conditional text:
  - Logged out: `"Please log in to be finance guy"`
  - Logged in: `"Welcome to "` followed by `<img src={banksyLogo} alt="Banksy" />`
- Overlay content vertically and horizontally centered

> Note: The 30% width is based on the described transparent area. The overlay will need visual verification after first render in case the exact edge needs minor tuning.

### Mobile layout (<1024px base styles)
- Root element: full-viewport `div.homepage`
- Top section `div.homepage__animation`: 65% viewport height (`65vh`), Lottie player renders `budget-animation.json`, `loop={true}`, `autoplay={true}`
- Bottom section `div.homepage__message`: remaining ~35%, flex-centered
- Inside message: `h1` with conditional text:
  - Logged out: `"Please log in to be finance guy"`
  - Logged in: `"Welcome to Banksy, where dreams are dreams"`
- `font-size` sized to fit without scrolling (use `clamp()` or a viewport-relative unit)

### Accessibility
- `<h1>` on every layout — only one `<h1>` per page (arch rule enforced)
- Lottie container: `aria-hidden="true"` (decorative animation)
- Banksy logo `<img>` has `alt="Banksy"` so the h1 reads naturally as "Welcome to Banksy"

---

## SCSS structure (`homepage.scss`)

```scss
.homepage {
  // base (mobile): flex column, full viewport height

  &__animation {
    // height: 65vh; overflow: hidden
    // aria-hidden decoration
  }

  &__message {
    // flex: 1; display flex, align/justify center
    // h1 font-size: clamp(1.5rem, 5vw, 2.5rem)
  }

  @include bp('desktop') {
    // background-image: url(stonks.png), cover
    // position: relative

    &__animation { display: none; }

    &__overlay {
      // position: absolute; top: 0; right: 0
      // width: 30%; height: 100%
      // display flex, align/justify center
    }

    &__message {
      // reset mobile styles
    }
  }
}
```

---

## Dependency

```
npm install lottie-react
```

`lottie-react` is the standard React wrapper for Lottie animations. It renders `.json` Lottie files via `<Lottie animationData={...} />`.

---

## Route change

Replace in `App.tsx`:
```tsx
// before
<Route path="/" element={<p>Welcome to Banksy</p>} />

// after
<Route path="/" element={<HomepagePage />} />
```
