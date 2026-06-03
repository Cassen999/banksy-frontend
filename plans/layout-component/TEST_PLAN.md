# Test Plan — Layout Component

## Testing Stack

- **Framework:** Vitest + React Testing Library
- **API mocking:** MSW via `src/mocks/handlers.ts` (handlers already exist for `/api/auth/me` and `/api/auth/logout`)
- **Coverage target:** ≥ 80% line and branch for all new `src/` files

---

## Coverage Targets Per File

| File | Key branches to cover |
|------|----------------------|
| `authService.ts` | `fetchMe` success, `fetchMe` throws on non-2xx; `logout` success, `logout` throws on non-2xx |
| `AuthContext.tsx` | Provider: user set on success, user null on fetch error, `clearUser` resets to null, `isLoading` transitions; hook: throws when used outside provider |
| `AppSidebar.tsx` | Renders when `isOpen`, hidden when closed; X button calls `onClose`; displays user name when logged in, "Guest" when not; nav items rendered; copyright present |
| `AppHeader.tsx` | Mobile: ☰ has correct aria attrs; logo renders; Login button when user null; Logout button when user set; desktop: Menubar present; Welcome message visible when user set, absent when not; login/logout behavior |
| `Layout.tsx` | Sidebar closed by default; ☰ click opens sidebar; backdrop click closes sidebar; X click closes sidebar; children rendered in `<main>` |

---

## Test Files

### `src/services/authService.test.ts`

```
fetchMe()
  - resolves with iUser on 200
  - throws on 401
  - throws on 500

logout()
  - resolves on 200
  - throws on 500
```

Use `handlers.auth.me.success`, `handlers.auth.me.unauthorized`, `handlers.auth.me.serverError`, `handlers.auth.logout.success` from `src/mocks/handlers.ts`. Use `server.use(...)` to override per-test.

---

### `src/contexts/contextTests/AuthContext.test.tsx`

```
AuthProvider
  - renders children
  - sets user on successful /api/auth/me fetch
  - sets user to null when /api/auth/me returns 401/error
  - isLoading is true initially, false after fetch completes
  - clearUser sets user to null

useAuth hook
  - throws descriptive error when used outside AuthProvider
```

Wrap each test render in `AuthProvider`. Use `waitFor` to resolve async state from the `useEffect`-driven fetchMe.

---

### `src/components/AppSidebar/AppSidebar.test.tsx`

#### Helpers

```ts
function renderSidebar(props?: Partial<iAppSidebarProps>) {
  const defaults = { isOpen: true, onClose: vi.fn(), items: NAV_ITEMS };
  return render(<AppSidebar {...defaults} {...props} />, { wrapper: AuthProvider });
}
```

#### Tests

```
when isOpen is false
  - sidebar panel has translateX(-100%) / is not visible to screen readers

when isOpen is true
  - sidebar panel is visible
  - has role="dialog" and aria-modal="true"
  - X close button is rendered
  - clicking X close button calls onClose
  - clicking backdrop calls onClose (tested from Layout)

user section
  - displays pi-user icon + firstName + lastName when user is logged in
  - displays "Guest" (or placeholder) when user is null

nav items
  - all 5 placeholder items are rendered

copyright
  - small copyright text is present
```

---

### `src/components/AppHeader/AppHeader.test.tsx`

#### Helpers

```ts
function renderHeader(user: iUser | null, props?: Partial<iAppHeaderProps>) {
  // Wrap in AuthProvider with mocked user state via MSW
}
```

#### Tests

```
mobile layout (default / no bp override needed — RTL renders at mobile width)
  - hamburger button renders with aria-label="Open navigation menu"
  - hamburger button has aria-expanded=false when sidebar is closed
  - hamburger button has aria-expanded=true when isSidebarOpen=true
  - clicking hamburger button calls onSidebarToggle
  - banksy-app-logo renders
  - logo link has accessible aria-label
  - Login button renders when user is null
  - Logout button renders when user is set
  - clicking Login calls window.location.href with /login URL
  - clicking Logout calls authService.logout, clears user, redirects

desktop layout (note: CSS breakpoints are not testable in RTL — test component structure only)
  - Menubar component is present in the DOM
  - Menubar start content contains a link to /
  - Welcome message is rendered when user is set
  - Welcome message is absent when user is null
  - Login/Logout button state mirrors user presence

accessibility
  - hamburger aria attributes are correct
  - logo links have aria-label
  - Menubar start link is keyboard-focusable (tabIndex not -1)
```

Note on login: `window.location.href` assignment is mocked with `vi.stubGlobal` or `Object.defineProperty`. Verify the assigned value contains the expected path.

---

### `src/components/Layout/Layout.test.tsx`

#### Helpers

```ts
function renderLayout(user: iUser | null = null) {
  return render(
    <AuthProvider>
      <BrowserRouter>
        <Layout>
          <p>page content</p>
        </Layout>
      </BrowserRouter>
    </AuthProvider>
  );
}
```

#### Tests

```
structure
  - renders a <header> landmark
  - renders a <main> landmark
  - children are rendered inside <main>
  - placeholder home page text is rendered at route "/"

sidebar state
  - sidebar is closed on initial render
  - clicking hamburger opens sidebar (isSidebarOpen=true)
  - clicking backdrop closes sidebar
  - clicking X in sidebar closes sidebar

body scroll lock
  - document.body has overflow:hidden when sidebar is open
  - document.body overflow is restored when sidebar closes

accessibility
  - page does not contain more than one <main> landmark
  - <header role="banner"> is present
```

---

## MSW Usage Pattern

All tests that touch auth state use the existing handlers:
- **Logged-in user:** `server.use(handlers.auth.me.success)` — already in `defaultHandlers`
- **Logged-out / unauthenticated:** `server.use(handlers.auth.me.unauthorized)`
- **Logout:** `server.use(handlers.auth.logout.success)` — already in `defaultHandlers`

No new MSW handlers need to be added for this feature.

---

## Test Conventions

- Test files use `.test.tsx` for files with JSX, `.test.ts` for plain TS.
- Context test files for `src/contexts/` live in `src/contexts/contextTests/`.
- Each `describe` block maps to one component or function.
- Use `screen.getByRole` and accessible queries — avoid `getByTestId` unless no semantic alternative exists.
- Interactions via `userEvent` (not `fireEvent`) for realistic event simulation.
- Async auth state changes use `waitFor` or `findBy*` queries.
