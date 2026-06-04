# Button Design — Implementation Plan

## Goal
Apply a consistent floating box-shadow to all PrimeReact `<Button>` and Menubar elements across light and dark modes. Extract the shadow into a reusable CSS custom property and update the mobile hamburger button to use PrimeReact `<Button>`.

---

## Files Changed

| File | Change |
|------|--------|
| `src/styles/root.scss` | Add `--shadow-float` custom property (light + dark values) |
| `src/styles/primeReactOverrides.scss` | Apply `var(--shadow-float)` to `.p-button` and `.p-menubar`; remove stale dark-mode box-shadow rule |
| `src/components/AppHeader/appHeader.scss` | Remove `box-shadow` from `.header__nav .p-menubar` (light + dark); trim hamburger styles superseded by PrimeReact Button |
| `src/components/AppHeader/AppHeader.tsx` | Replace native `<button>` hamburger with `<Button icon="pi pi-bars" rounded text>` |

---

## Step-by-Step

### 1 — Add CSS variable to `root.scss`

In `:root`:
```css
--shadow-float: 0 4px 20px rgba(0, 0, 0, 0.20);
```

In `[data-theme='dark']`:
```css
--shadow-float: 0 4px 20px rgba(0, 0, 0, 0.6);
```

### 2 — Update `primeReactOverrides.scss`

Add global rules (outside any `[data-theme]` block — the variable switches automatically):
```css
.p-button {
  box-shadow: var(--shadow-float);
}

.p-menubar {
  box-shadow: var(--shadow-float);
}
```

Remove the now-redundant dark-mode-only block:
```css
/* DELETE */
[data-theme='dark'] {
  .p-menubar {
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.6);
  }
  ...
}
```
The divider rules in that block are kept; only the `.p-menubar` shadow line is removed.

### 3 — Update `appHeader.scss`

Remove `box-shadow` from `.header__nav .p-menubar` (line 125 — light mode).

Remove the entire `[data-theme='dark'] .header__nav .p-menubar` box-shadow override (lines 174–179). If that block contained only the shadow, remove the block; otherwise remove only the box-shadow declaration.

Replace the `.header__hamburger` block with a leaner version that covers only what PrimeReact Button does not — minimum touch target size and the focus-visible ring:
```scss
&__hamburger {
  min-width: 44px;
  min-height: 44px;

  &:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }
}
```
(PrimeReact Button handles background, border, border-radius, cursor, transition, hover state via its own styles.)

### 4 — Update `AppHeader.tsx`

Replace:
```tsx
<button
  className="header__hamburger"
  onClick={onSidebarToggle}
  aria-label={isSidebarOpen ? 'Close navigation menu' : 'Open navigation menu'}
  aria-expanded={isSidebarOpen}
  aria-controls="app-sidebar"
>
  <i className="pi pi-bars" aria-hidden="true" />
</button>
```

With:
```tsx
<Button
  icon="pi pi-bars"
  rounded
  text
  onClick={onSidebarToggle}
  aria-label={isSidebarOpen ? 'Close navigation menu' : 'Open navigation menu'}
  aria-expanded={isSidebarOpen}
  aria-controls="app-sidebar"
  className="header__hamburger"
/>
```

The `text` prop gives an icon-only button with no fill/border. The `rounded` prop applies the pill border-radius. The box-shadow is inherited from the global `.p-button` rule added in step 2.

---

## What Is NOT Changing

- No new components, hooks, or services
- No routing changes
- No changes to test setup or mocks
- `_dev/ARCHITECTURE.md` update required only if the component's public interface or behaviour changes (it does not — props are identical)
