# Implementation Plan — New Login Flow

## Overview
Overhaul authentication UX: global viewport mask for unauthenticated users on all routes, dedicated Settings page with logout, reusable AuthButton component, homepage moved to `/dashboard`, mobile header logo removed, login/logout events wired to the notification system.

---

## New Files

| File | Purpose |
|------|---------|
| `src/components/AuthButton/AuthButton.tsx` | Reusable login/logout button (extracted from AppHeader) |
| `src/components/AuthButton/AuthButton.test.tsx` | Tests for AuthButton |
| `src/components/AuthButton/authButton.scss` | Auth button styles (moved from appHeader.scss) |
| `src/components/ViewportMask/ViewportMask.tsx` | Full-viewport auth gate — spinner during load, login prompt + failure detection when no user |
| `src/components/ViewportMask/ViewportMask.test.tsx` | Tests for ViewportMask |
| `src/components/ViewportMask/viewportMask.scss` | Mask overlay styles |
| `src/components/Settings/SettingsPage.tsx` | Settings page — logout only for now |
| `src/components/Settings/SettingsPage.test.tsx` | Tests for SettingsPage |
| `src/components/Settings/settings.scss` | Settings page styles |

---

## Modified Files

### `App.tsx`
- Add `<Navigate from="/" to="/dashboard" replace />` as the first route
- Rename `/` route to `/dashboard`
- Add `/settings` route → `SettingsPage`

### `src/components/Layout/Layout.tsx`
- Update `NAV_ITEMS`:
  - Dashboard: add `url: '/dashboard'`, `command: () => navigate('/dashboard')`
  - Settings: add `url: '/settings'`, `command: () => navigate('/settings')`
- Render `<ViewportMask />` as a sibling to the layout div (outside, so it is not inert)
- Apply HTML `inert` attribute to the layout root div when `!user`
- Add `useEffect` that detects successful login via `sessionStorage` flag and triggers success toast

### `src/components/AppHeader/AppHeader.tsx`
- Remove `authButton` JSX and the `handleLogin`/`handleLogout` functions
- Remove mobile logo (`header__app-logo-link` + `header__app-logo` image)
- Remove all logo imports (`banksyAppLogo`, `banksyAppLogoDark`)
- Mobile header: hamburger button only
- Desktop header: brand logo + nav Menubar; keep welcome text, remove auth button

### `src/components/AppHeader/appHeader.scss`
- Remove `&__auth-button`, `&__mobile-auth`, `&__app-logo-link`, `&__app-logo` blocks
- Styles move to `authButton.scss`

### `src/components/Homepage/HomepagePage.tsx`
- Remove the unauthenticated branch (`user ? (...) : <h1>Please log in...</h1>`)
- Remove `useAuth` import (no longer needed)
- Always render the full homepage content

### `src/styles/root.scss`
- Add `--color-mask-bg` to `:root` (light mode: `rgba(255, 255, 255, 0.88)`)
- Add `--color-mask-bg` to `[data-theme='dark']` (dark mode: `rgba(0, 0, 0, 0.88)`)

### `_dev/ARCHITECTURE.md`
- Document `AuthButton`, `ViewportMask`, `SettingsPage`

---

## Component Detail

### `AuthButton`
```tsx
// Uses forwardRef<HTMLButtonElement> so callers can hold a ref to the DOM button
// Reads useAuth() for user state
// handleLogin(): sets sessionStorage.setItem('banksy_login_pending', '1') then redirects
// handleLogout(): redirects to backend /logout (no flag — logout is always synchronous)
// Props: none public (ref only via forwardRef)
// Renders: <Button ref={ref} label={user ? 'Logout' : 'Login'} rounded className="auth-button" />
```

### `ViewportMask`
```tsx
// Reads useAuth() → { user, isLoading }
// Reads useNotify() → { triggerToast }
// showMask = !user (null on load → mask shows immediately, no content flash)
// Holds loginButtonRef = useRef<HTMLButtonElement>(null) passed to <AuthButton ref={loginButtonRef} />
//
// useEffect on [isLoading, user]:
//   if (!isLoading && !user && sessionStorage.getItem('banksy_login_pending')) {
//     sessionStorage.removeItem('banksy_login_pending')
//     triggerToast({ severity: 'error', summary: 'Something went wrong, please try to login again' })
//     loginButtonRef.current?.focus()
//   }
//
// When showMask + isLoading  → <ProgressSpinner /> only
// When showMask + !isLoading → "Please login to be finance guy" + <AuthButton ref={loginButtonRef} />
// position: fixed; inset: 0; z-index: 1000; background: var(--color-mask-bg)
```

### `Layout` — success toast
```tsx
// useEffect on [isLoading, user]:
//   if (!isLoading && user && sessionStorage.getItem('banksy_login_pending')) {
//     sessionStorage.removeItem('banksy_login_pending')
//     triggerToast({ severity: 'success', summary: 'Login Successful', detail: 'Welcome to Banksy!' })
//   }
// Called without a duration so triggerToast uses its default (3000ms)
```

### `SettingsPage`
```tsx
// Simple page — heading "Settings" + <AuthButton />
// AuthButton handles logout inline; no props needed
```

### Layout render structure (with mask)
```tsx
<>
  <div className="layout" {...(!user ? { inert: '' } : {})}>
    {/* AppHeader, AppSidebar, Toast, main content */}
  </div>
  <ViewportMask />   {/* renders null when user is present */}
</>
```

---

## Login Notification — sessionStorage Flow

The backend OAuth redirect carries no success/error signal in the URL. Detection uses a `sessionStorage` flag:

```
User clicks Login
  → AuthButton.handleLogin() sets sessionStorage['banksy_login_pending'] = '1'
  → window.location.href = .../oauth2/authorization/google
  → [OAuth flow]
  → Backend redirects browser back to frontend
  → App remounts, fetchMe() runs

fetchMe() resolves:
  ├── user found → Layout useEffect fires → success toast → clear flag
  └── user null  → ViewportMask useEffect fires → error toast → clear flag → focus login button
```

---

## Order of Implementation
1. `root.scss` — add mask CSS vars
2. `AuthButton` component + SCSS (move styles from appHeader.scss; add sessionStorage flag; add forwardRef)
3. `ViewportMask` component + SCSS (spinner, login prompt, failure detection, focus)
4. `SettingsPage` component + SCSS
5. `AppHeader` — remove auth button + mobile logo; update SCSS
6. `HomepagePage` — remove unauthenticated branch
7. `Layout` — update NAV_ITEMS, add ViewportMask + inert + success toast
8. `App` — update routes
9. `_dev/ARCHITECTURE.md`
