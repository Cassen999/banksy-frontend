# Banksy Frontend — Component Registry

**Always check this file before creating any new component, hook, service, or utility.**
If the item you need already exists, extend it rather than creating a duplicate.

Update this file whenever a new entry is added or removed.

---

## Infrastructure (non-feature)

| Name | File | Type | Description |
|------|------|------|-------------|
| `apiClient` | `src/api/client.ts` | API client | Axios instance with `withCredentials`, `baseURL`, and centralized 401 interceptor. Configures `axios-hooks`. |
| `handleUnauthorized` | `src/utils/auth.ts` | Utility | Redirects user to OAuth login URL on 401. Calls the registered `clearUser` before redirecting. |
| `registerClearUser` | `src/utils/auth.ts` | Utility | Registers the AuthContext's `clearUser` so the 401 interceptor can clear auth state without a circular import. |
| `server` | `src/mocks/server.ts` | Test infra | MSW server instance for tests. Uses `defaultHandlers`. |
| `handlers` | `src/mocks/handlers.ts` | Test infra | All MSW handlers grouped by domain: `auth`, `balance`, `transactions`, `plaid`. Each has `success` and `error` variants. |

---

## Components

| Name | File | Type | Props interface | Description |
|------|------|------|-----------------|-------------|
| `Layout` | `src/components/Layout/Layout.tsx` | Shell | `iLayoutProps` | Full-app shell. Renders `AppHeader`, `AppSidebar` (mobile only), backdrop overlay, and `<main>` body. Owns sidebar open/close state and the shared `NAV_ITEMS` constant. |
| `AppHeader` | `src/components/AppHeader/AppHeader.tsx` | UI | `iAppHeaderProps` | Responsive header. Mobile: hamburger + app logo + auth button. Desktop: brand logo + floating pill Menubar + welcome text + auth button. Reads user from `useAuth()`. |
| `AppSidebar` | `src/components/AppSidebar/AppSidebar.tsx` | UI | `iAppSidebarProps` | Mobile-only sliding sidebar panel. Animates via CSS `transform`. Contains close (×) button, user info, nav items, copyright. Locks body scroll when open. Hidden on desktop via CSS. |

---

## Pages / Views

_None yet. Add entries here as pages are implemented._

| Name | File | Route | Description |
|------|------|-------|-------------|

---

## Hooks

_None yet. Add entries here as hooks are implemented._

| Name | File | Returns | Description |
|------|------|---------|-------------|

---

## Services

| Name | File | Method | Endpoint | Description |
|------|------|--------|----------|-------------|
| `fetchMe` | `src/services/authService.ts` | `GET` | `/api/auth/me` | Returns `iUser`. Called by `AuthProvider` on mount to hydrate session state. Throws on any non-2xx. |

---

## Contexts

| Name | File | State it holds | Description |
|------|------|----------------|-------------|
| `ThemeProvider` / `useTheme` | `src/contexts/ThemeContext.tsx` | `theme`, `toggleTheme` | Manages light/dark theme. Reads from `localStorage` and `prefers-color-scheme`. Injects PrimeReact theme link. Lives in `main.tsx`. |
| `AuthProvider` / `useAuth` | `src/contexts/AuthContext.tsx` | `user`, `isLoading`, `clearUser` | Stores the authenticated `iUser` (or `null`). Calls `fetchMe` on mount. Registers `clearUser` with the 401 interceptor. Lives in `App.tsx` wrapping `<Layout>`. |

---

## Utilities (`src/utils/`)

| Name | File | Description |
|------|------|-------------|
| `handleUnauthorized` | `src/utils/auth.ts` | Redirect to OAuth on 401; calls registered `clearUser` first |
| `registerClearUser` | `src/utils/auth.ts` | Registers the AuthContext `clearUser` fn for use by the 401 interceptor |

---

## Shared Types (`src/types/types.ts`)

| Name | Kind | Description |
|------|------|-------------|
| `iUser` | interface | Authenticated user returned by `GET /api/auth/me` |
