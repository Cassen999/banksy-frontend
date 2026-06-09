# Banksy Frontend — Component Registry

**Always check this file before creating any new component, hook, service, or utility.**
If the item you need already exists, extend it rather than creating a duplicate.

Update this file whenever a new entry is added or removed.

---

## Infrastructure (non-feature)

| Name | File | Type | Description |
|------|------|------|-------------|
| `apiClient` | `src/api/client.ts` | API client | Axios instance with `withCredentials` and `baseURL`. Configures `axios-hooks`. Session expiry is handled by the server via `302` redirect — no client-side interceptor needed. |
| `server` | `src/mocks/server.ts` | Test infra | MSW server instance for tests. Uses `defaultHandlers`. |
| `handlers` | `src/mocks/handlers.ts` | Test infra | All MSW handlers grouped by domain: `auth`, `balance`, `transactions`, `plaid`, `dev`. Each has `success` and `error` variants. Dev handlers are internal tooling only — never wire to UI. |

---

## Components

| Name | File | Type | Props interface | Description |
|------|------|------|-----------------|-------------|
| `Layout` | `src/components/Layout/Layout.tsx` | Shell | `iLayoutProps` | Full-app shell. Renders `AppHeader`, `AppSidebar` (mobile only), backdrop overlay, global `Toast` and `Message` (banner), and `<main>` body. Owns sidebar open/close state and the shared `NAV_ITEMS` (built inside component using `useNavigate`). Calls `useNotify()` for Toast ref and banner state. |
| `AppHeader` | `src/components/AppHeader/AppHeader.tsx` | UI | `iAppHeaderProps` | Responsive header. Mobile: hamburger + app logo + auth button. Desktop: brand logo + floating pill Menubar + welcome text + auth button. Reads user from `useAuth()`. |
| `AppSidebar` | `src/components/AppSidebar/AppSidebar.tsx` | UI | `iAppSidebarProps` | Mobile-only sliding sidebar panel. Animates via CSS `transform`. Contains close (×) button, user info, nav items, copyright. Locks body scroll when open. Hidden on desktop via CSS. |

---

## Pages / Views

| Name | File | Route | Description |
|------|------|-------|-------------|
| `AccountPage` | `src/components/Account/AccountPage.tsx` | `/account` | Account Actions page. H1, description, and an actions grid containing `LinkAccount`. |

---

## Components (continued)

| Name | File | Type | Props interface | Description |
|------|------|------|-----------------|-------------|
| `LinkAccount` | `src/components/LinkAccount/LinkAccount.tsx` | UI | — | Multistate "Link Account" PrimeReact Button. Default: enabled, label "Link Account". Loading: disabled with spinner. Delegates all logic to `useLinkAccount`. |

---

## Hooks

| Name | File | Returns | Description |
|------|------|---------|-------------|
| `useLinkAccount` | `src/hooks/useLinkAccount.ts` | `{ isLoading, initiateLinkFlow }` | Orchestrates the Plaid bank link flow. Calls `fetchLinkToken`, opens the Plaid modal via `usePlaidLink`, handles `onSuccess` (calls `exchangePublicToken`, shows success toast) and `onExit` (shows error toast on Plaid error). |

---

## Services

| Name | File | Method | Endpoint | Description |
|------|------|--------|----------|-------------|
| `fetchMe` | `src/services/authService.ts` | `GET` | `/api/auth/me` | Returns `iUser`. Called by `AuthProvider` on mount to hydrate session state. Throws on any non-2xx. |
| `fetchLinkToken` | `src/services/plaidService.ts` | `GET` | `/api/plaid/link-token` | Returns `iPlaidLinkTokenResponse`. Called by `useLinkAccount` to start a new bank link. Throws `{ status: 500 }` on server error. |
| `exchangePublicToken` | `src/services/plaidService.ts` | `POST` | `/api/plaid/exchange` | Exchanges the Plaid public token after `onSuccess`. Returns `iPlaidExchangeResponse`. Throws `{ status: 500 }` on server error. |

---

## Contexts

| Name | File | State it holds | Description |
|------|------|----------------|-------------|
| `ThemeProvider` / `useTheme` | `src/contexts/ThemeContext.tsx` | `theme`, `toggleTheme` | Manages light/dark theme. Reads from `localStorage` and `prefers-color-scheme`. Injects PrimeReact theme link. Lives in `main.tsx`. |
| `AuthProvider` / `useAuth` | `src/contexts/AuthContext.tsx` | `user`, `isLoading`, `clearUser` | Stores the authenticated `iUser` (or `null`). Calls `fetchMe` on mount. Registers `clearUser` with the 401 interceptor. Lives in `App.tsx` wrapping `<Layout>`. |
| `NotificationProvider` / `useNotify` | `src/contexts/NotificationContext.tsx` | `toastRef`, `showToast`, `toastConfig`, `triggerToast`, `hideToast`, `showBanner`, `bannerConfig`, `triggerBanner`, `hideBanner` | Global notification system. Holds toast ref (passed to PrimeReact `Toast` in Layout), toast show/config state, and banner show/config state. Toast and banner are fully independent. Lives in `App.tsx` wrapping `<Layout>` (alongside `AuthProvider`). |

---

## Utilities (`src/utils/`)

| Name | File | Description |
|------|------|-------------|
_None. Session expiry is handled server-side via `302` redirect._

---

## Shared Types (`src/types/types.ts`)

| Name | Kind | Description |
|------|------|-------------|
| `iUser` | interface | Authenticated user returned by `GET /api/auth/me` |
| `iPlaidLinkTokenResponse` | interface | Response shape for `GET /api/plaid/link-token`: `{ link_token: string }` |
| `iPlaidExchangeRequest` | interface | Request body for `POST /api/plaid/exchange`: publicToken, institutionId, institutionName, expiredItemId (null for new links) |
| `iPlaidExchangeResponse` | interface | Response shape for `POST /api/plaid/exchange`: `{ status: 'ok', message: string }` |
