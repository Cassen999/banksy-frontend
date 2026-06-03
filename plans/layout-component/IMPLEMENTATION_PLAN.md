# Implementation Plan — Layout Component

## Overview

A full-app shell that enforces consistent structure, navigation, and auth state across all pages. Renders a mobile-only sliding sidebar, a responsive header (mobile and desktop variants), and a body section that wraps page content in all future page-level context providers.

---

## HTML Hierarchy Decision

`<h1>` lives in the **body/page content area**, not the header. The `<header>` element receives `role="banner"` and holds the logo, navigation, and login/logout control. Every page rendered inside `<main>` must begin with its own `<h1>`. This must be consistent across all future pages.

```
<header role="banner">   ← landmark: logo, nav, auth button
<main>                   ← landmark: page content begins here
  <h1>Page Title</h1>
  …page body…
</main>
```

---

## New Files (test-first order)

| # | Test file | Implementation file |
|---|-----------|---------------------|
| 1 | `src/services/authService.test.ts` | `src/services/authService.ts` |
| 2 | `src/contexts/contextTests/AuthContext.test.tsx` | `src/contexts/AuthContext.tsx` |
| 3 | `src/components/AppSidebar/AppSidebar.test.tsx` | `src/components/AppSidebar/AppSidebar.tsx` |
| — | — | `src/components/AppSidebar/appSidebar.scss` |
| 4 | `src/components/AppHeader/AppHeader.test.tsx` | `src/components/AppHeader/AppHeader.tsx` |
| — | — | `src/components/AppHeader/appHeader.scss` |
| 5 | `src/components/Layout/Layout.test.tsx` | `src/components/Layout/Layout.tsx` |
| — | — | `src/components/Layout/layout.scss` |

---

## Modified Files

| File | Change |
|------|--------|
| `src/utils/auth.ts` | Add `registerClearUser(fn)` to allow `handleUnauthorized` to clear auth state without a circular import |
| `src/App.tsx` | Wrap routes in `<AuthProvider>` + `<Layout>` |
| `src/styles/index.scss` | Add `@use` for `appSidebar`, `appHeader`, and `layout` SCSS |
| `_dev/ARCHITECTURE.md` | Document all new components, context, and service |
| `_dev/COMPONENTS.md` | Add registry entries |

---

## Component Architecture

```
App.tsx
└── AuthProvider                     (src/contexts/AuthContext.tsx)
    └── Layout                       (src/components/Layout/Layout.tsx)
        ├── AppHeader                (src/components/AppHeader/AppHeader.tsx)
        │   ├── [mobile] ☰ trigger
        │   ├── [mobile] banksy-app-logo.png → /
        │   ├── [mobile] Login / Logout pill button
        │   ├── [desktop] banksy-logo.png → /
        │   ├── [desktop] Menubar (PrimeReact) — start: banksy-app-logo.png
        │   └── [desktop] Welcome [Name] + Login / Logout button
        ├── AppSidebar               (src/components/AppSidebar/AppSidebar.tsx) [mobile only]
        │   ├── X close button       ← slides in/out with sidebar
        │   ├── [pi-user] FirstName LastName
        │   ├── Divider (PrimeReact)
        │   ├── PanelMenu / list of nav items
        │   └── <small> © Banksy (centered, pinned to bottom)
        ├── Sidebar overlay / backdrop
        └── <main>
            └── {children}           ← page-level context providers go here in future
```

---

## Shared Navigation Items

Five placeholder `MenuItem` items are defined once in `Layout` and passed as props to both `AppHeader` (desktop Menubar) and `AppSidebar`. The PrimeReact `MenuItem` type is used directly — no custom wrapper.

```ts
const NAV_ITEMS: MenuItem[] = [
  { label: 'Dashboard', icon: 'pi pi-home' },
  { label: 'Accounts',  icon: 'pi pi-wallet' },
  { label: 'Transactions', icon: 'pi pi-list' },
  { label: 'Reports',   icon: 'pi pi-chart-bar' },
  { label: 'Settings',  icon: 'pi pi-cog' },
];
```

---

## `authService.ts`

Plain async functions, both using `apiClient`.

```ts
fetchMe(): Promise<iUser>
// GET /api/auth/me — throws on any non-2xx

logout(): Promise<void>
// POST /api/auth/logout — throws on non-2xx
```

Note: `fetchMe` is called once on app load inside `AuthProvider`. If the session is missing, the backend returns a 302 redirect to `/login` which resolves as an error in Axios (cross-origin redirect chain fails) — the catch block sets `user` to `null`. The 401 interceptor on `apiClient` is NOT expected to fire for this specific call (backend returns 302, not 401), so no special bypass is needed.

---

## `AuthContext.tsx`

```ts
interface iAuthContextValue {
  user: iUser | null;
  isLoading: boolean;
  clearUser: () => void;
}
```

**Provider behavior:**
1. On mount: calls `authService.fetchMe()` inside a `useEffect`. Sets `user` from result; on any error sets `user: null`.
2. Calls `registerClearUser(clearUser)` so `handleUnauthorized()` in `auth.ts` can clear state without a circular import.
3. Provides `clearUser` (sets `user` to `null`) for the logout flow.

**`registerClearUser` pattern in `auth.ts`:**
```ts
let _clearUser: (() => void) | null = null;

export function registerClearUser(fn: () => void): void {
  _clearUser = fn;
}

export function handleUnauthorized(): void {
  _clearUser?.();
  window.location.href = `${import.meta.env.VITE_API_BASE_URL}/oauth2/authorization/google`;
}
```

---

## `AppSidebar` Component

**Props:**
```ts
interface iAppSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  items: MenuItem[];
}
```

**Behavior:**
- Rendered in `Layout` on all breakpoints but hidden via CSS (`display: none`) on desktop (1024px+).
- Full-viewport-height panel, fixed-position, slides in from the left using `transform: translateX(-100%)` → `translateX(0)`. Transition: `transform 300ms ease`.
- Top of panel: X button (`pi pi-times`) — this is the button that "slides out alongside" the sidebar. Clicking X calls `onClose`.
- Below X: user icon (`pi pi-user`) followed by `firstName lastName` from `useAuth()`. If user is null: show placeholder text (e.g. "Guest").
- PrimeReact `Divider` below the user row.
- Nav items rendered as a `<nav>` with an accessible list.
- `<small>` copyright pinned to the bottom via flexbox (`margin-top: auto`).
- Accessible: `role="dialog"`, `aria-modal="true"`, `aria-label="Navigation menu"`.
- Body scroll locked when `isOpen` is true (toggle `overflow: hidden` on `<body>`).

**Overlay/Backdrop:**
- Rendered in `Layout` (not inside the sidebar panel itself) as a full-screen semi-transparent div when `isOpen` is true.
- `onClick` → `onClose`.
- `aria-hidden="true"` (the dialog handles focus management).

---

## `AppHeader` Component

**Props:**
```ts
interface iAppHeaderProps {
  isSidebarOpen: boolean;
  onSidebarToggle: () => void;
  items: MenuItem[];
}
```

**Reads from context:** `useAuth()` for `user`, logout trigger.

**Logout flow (both mobile and desktop):**
1. Call `authService.logout()`.
2. Call `clearUser()` from `useAuth()`.
3. Navigate to `/login` via `window.location.href = \`${import.meta.env.VITE_API_BASE_URL}/login\``.

**Login flow:**
- `window.location.href = \`${import.meta.env.VITE_API_BASE_URL}/login\`` — Spring Security redirects browser to Google OAuth.

### Mobile Header (base → 1023px)

Single row:
```
[☰ button]  [banksy-app-logo.png → /]          [Login|Logout pill]
```
- ☰ button: `pi pi-bars`, `aria-label="Open navigation menu"`, `aria-expanded={isSidebarOpen}`, `aria-controls="app-sidebar"`. When sidebar is open the header button is visually behind the sidebar (the X inside the sidebar is the close control).
- App logo: `<Link to="/">`, `aria-label="Banksy — go to home page"`, image has `alt=""`.
- Login/Logout: PrimeReact `Button`, `rounded`, severity `primary`. Label toggled by `user !== null`.

### Desktop Header (1024px+)

Single row:
```
[banksy-logo.png → /]    [Menubar (floating pill)]    [Welcome Name!?] [Login|Logout]
```
- Banksy logo: `<Link to="/">`, `aria-label="Banksy — go to home page"`. Image `alt=""`. Left-aligned.
- PrimeReact `Menubar`:
  - `model={items}` for nav items.
  - `start` prop: `<Link to="/" aria-label="Banksy logo — go to home page"><img src={banksyAppLogo} alt="" aria-hidden="true" /></Link>`. The `<Link>` is keyboard-focusable and within the tab order.
  - Pill styling: SCSS overrides `.p-menubar` with `border-radius: 9999px` and `box-shadow: 0 4px 20px rgba(0,0,0,0.15)`. Applied via SCSS selector targeting the component's class.
- User section: `<span>Welcome {firstName} {lastName}!</span>` — renders only when `user !== null`.
- Login/Logout: PrimeReact `Button`, `rounded`, severity `primary`. 1rem gap between user section and button.

---

## `Layout` Component

**Props:** `{ children: ReactNode }`

**State:** `isSidebarOpen: boolean` via `useState(false)`.

**Body (children wrapper):**
- Children are rendered directly inside `<main>` for now. When future page-level contexts are added, they are wrapped here — outside of `AuthProvider` (App.tsx level) and `ThemeProvider` (main.tsx level).
- Enforces the grid: single column mobile, two-column desktop — applied via SCSS on `<main>`.

**Safe area insets:** Applied in `layout.scss` via `env(safe-area-inset-*)` on the root layout wrapper.

**App.tsx after this feature:**
```tsx
<AuthProvider>
  <Layout>
    <Routes>
      <Route path="/" element={<p>Welcome to Banksy</p>} />
    </Routes>
  </Layout>
</AuthProvider>
```

---

## SCSS Notes

- `appSidebar.scss`: animate with `transform` (GPU-composited). No `left`/`right` animation.
- `appHeader.scss`: flexbox row, space-between for mobile; three sections (left/center/right) for desktop.
- `layout.scss`: `display: flex; flex-direction: column; min-height: 100vh`. `<main>` gets CSS grid for body columns.
- Desktop Menubar pill: override `.p-menubar` within a parent scope to avoid leaking global styles.
- All overrides use CSS custom properties, not hardcoded colors.
