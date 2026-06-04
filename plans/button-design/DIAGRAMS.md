# Button Design — Diagrams

## CSS Variable Flow

```
root.scss
  :root                   → --shadow-float: 0 4px 20px rgba(0,0,0,0.20)
  [data-theme='dark']     → --shadow-float: 0 4px 20px rgba(0,0,0,0.6)
         │
         ▼
primeReactOverrides.scss
  .p-button               → box-shadow: var(--shadow-float)
  .p-menubar              → box-shadow: var(--shadow-float)
         │
         ├─ All <Button /> components (including hamburger, auth button)
         └─ All <Menubar /> components (including header nav)
```

## Hamburger Button — Before / After

```
BEFORE                                    AFTER
──────────────────────────────────────    ──────────────────────────────────────
<button                                   <Button
  className="header__hamburger"             icon="pi pi-bars"
  onClick={...}                             rounded
  aria-label={...}                          text
  aria-expanded={...}                       onClick={...}
  aria-controls="app-sidebar"              aria-label={...}
>                                           aria-expanded={...}
  <i className="pi pi-bars" />              aria-controls="app-sidebar"
</button>                                   className="header__hamburger"
                                          />

Native <button> + inline icon             PrimeReact <Button> — inherits
No box-shadow                             global .p-button box-shadow
```

## Style Ownership After Change

| Rule | Owned by |
|------|----------|
| Box-shadow (all buttons + menubar) | `primeReactOverrides.scss` via `var(--shadow-float)` |
| Shadow values (light / dark) | `root.scss` |
| Hamburger touch target (44px min) | `appHeader.scss .header__hamburger` |
| Hamburger focus ring | `appHeader.scss .header__hamburger:focus-visible` |
| Hamburger appearance (bg, border, radius, hover) | PrimeReact Button `text` + `rounded` props |
