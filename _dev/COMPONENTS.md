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
| `Layout` | `src/components/Layout/Layout.tsx` | Shell | `iLayoutProps` | Full-app shell. Renders `AppHeader`, `AppSidebar` (mobile only), backdrop overlay, global `Toast` and `Message` (banner), and `<main>` body inside a `layout` div. Renders `ViewportMask` outside the div (so it is never `inert`). Owns sidebar open/close state and the shared `NAV_ITEMS`. On successful login (detects `banksy_login_pending` sessionStorage flag) shows a success toast. Calls `useNotify()` for toast ref and banner state. |
| `AppHeader` | `src/components/AppHeader/AppHeader.tsx` | UI | `iAppHeaderProps` | Responsive header. Mobile: hamburger button + current page name. Desktop: brand logo link + floating pill Menubar (with app logo as start slot) + page name + welcome text. Reads user from `useAuth()` and theme from `useTheme()` for logo variant. Does not render an auth button. |
| `AppSidebar` | `src/components/AppSidebar/AppSidebar.tsx` | UI | `iAppSidebarProps` | Mobile-only sliding sidebar panel. Animates via CSS `transform`. Contains close (×) button, user info, nav items, copyright. Locks body scroll when open. Hidden on desktop via CSS. |
| `AuthButton` | `src/components/AuthButton/AuthButton.tsx` | UI | — (`forwardRef`) | Login/Logout PrimeReact Button. Label switches based on `useAuth()` user. Login redirects to Google OAuth (`/oauth2/authorization/google`) and sets `banksy_login_pending` in sessionStorage. Logout redirects to `/logout`. Exposes `iAuthButtonHandle` ref with a `focus()` method (used by `ViewportMask` after a failed login). |
| `ViewportMask` | `src/components/ViewportMask/ViewportMask.tsx` | UI | — | Full-viewport auth gate. Returns `null` when user is authenticated. While auth loads shows a `ProgressSpinner`; once resolved-unauthenticated shows a login prompt and `AuthButton`. On failed login (detects `banksy_login_pending` sessionStorage flag) triggers an error toast and focuses the auth button via `iAuthButtonHandle` ref. |
| `MonthlyGlance` | `src/components/MonthlyGlance/MonthlyGlance.tsx` | UI | — | Chart.js line chart (react-chartjs-2) showing cumulative monthly spending vs. a hardcoded $2,000 budget line. Shows `Skeleton` while auth is loading, `ProgressSpinner` while fetching, and a retry button on error. Custom `splitBackground` canvas plugin shades the chart area red above budget and teal below. Tooltip shows date, daily spend, and running total. Mobile disables mousemove events. Delegates data fetching to `useMonthlyGlance`. |
| `ScheduledDeposits` | `src/components/ScheduledDeposits/ScheduledDeposits.tsx` | UI | — | PrimeReact Accordion listing upcoming scheduled deposits. Shows `Skeleton` while auth is loading, `ProgressSpinner` while fetching, retry button on error, and an empty-state message when no deposits are found. Displays 1 deposit on mobile, up to 5 on desktop. Each accordion item has a piggy-bank icon header and a detail panel with From, Description, Frequency, Last, and Next columns. Delegates data fetching to `useScheduledDeposits`. |
| `LinkAccount` | `src/components/LinkAccount/LinkAccount.tsx` | UI | — | Multistate "Link Account" PrimeReact Button. Default: enabled, label "Link Account". Loading: disabled with spinner. Delegates all logic to `useLinkAccount`. |

---

## Pages / Views

| Name | File | Route | Description |
|------|------|-------|-------------|
| `HomepagePage` | `src/components/Homepage/HomepagePage.tsx` | `/dashboard` | Dashboard page. Renders `MonthlyGlance` in a spending-trend graph section and `ScheduledDeposits` in a next-deposit region. Also contains a placeholder accounts section. |
| `AccountPage` | `src/components/Account/AccountPage.tsx` | `/account` | Account Actions page. H1, description, and an actions grid containing `LinkAccount`. |
| `SettingsPage` | `src/components/Settings/SettingsPage.tsx` | `/settings` | Minimal settings page. Renders a heading and `AuthButton`. |

---

## Hooks

| Name | File | Returns | Description |
|------|------|---------|-------------|
| `useMonthlyGlance` | `src/hooks/useMonthlyGlance.ts` | `{ status: tStatus, data: iMonthlyGlanceDataPoint[], retry }` | Fetches monthly glance data via `fetchMonthlyGlance` when a user is present. Converts raw `dailyTotals` to cumulative data points via `toCumulative`. Status is `'loading'` while a fetch is in flight, `'error'` on failure (also triggers an error toast), `'success'` when data is ready. `retry()` re-triggers the fetch. Cancels in-flight requests on unmount. |
| `useScheduledDeposits` | `src/hooks/useScheduledDeposits.ts` | `{ status: tStatus, deposits: iScheduledDeposit[], retry }` | Fetches scheduled deposits via `fetchScheduledDeposits` when a user is present; filters to `isActive` deposits. In non-test environments (`MODE !== 'test'`) uses `scheduledDepositsMockData` directly instead of hitting the API. On error triggers an error toast. `retry()` re-triggers the fetch. Cancels in-flight requests on unmount. |
| `useLinkAccount` | `src/hooks/useLinkAccount.ts` | `{ isLoading, initiateLinkFlow }` | Orchestrates the Plaid bank link flow. Calls `fetchLinkToken`, opens the Plaid modal via `usePlaidLink`, handles `onSuccess` (calls `exchangePublicToken`, shows success toast) and `onExit` (shows error toast on Plaid error). |

---

## Services

| Name | File | Method | Endpoint | Description |
|------|------|--------|----------|-------------|
| `fetchMe` | `src/services/authService.ts` | `GET` | `/api/auth/me` | Returns `iUser`. Called by `AuthProvider` on mount to hydrate session state. Throws on any non-2xx. |
| `fetchMonthlyGlance` | `src/services/monthlyGlanceService.ts` | `GET` | `/api/monthly-glance` | Returns `iMonthlyGlanceResponse`. Called by `useMonthlyGlance`. Throws on non-2xx. |
| `fetchScheduledDeposits` | `src/services/scheduledDepositsService.ts` | `GET` | `/api/recurring/scheduled-deposits` | Returns `iScheduledDeposit[]`. Called by `useScheduledDeposits`. Throws on non-2xx. |
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
| `iMonthlyGlanceDailyTotal` | interface | Raw API row: `{ transactionDate: string, total: number }` |
| `iMonthlyGlanceResponse` | interface | Response shape for `GET /api/monthly-glance`: `{ dailyTotals: iMonthlyGlanceDailyTotal[], relinkRequired: unknown[] }` |
| `iMonthlyGlanceDataPoint` | interface | Derived UI type computed by `useMonthlyGlance`: `{ date, cumulative, daily }` — running totals built from `iMonthlyGlanceDailyTotal` |
| `iScheduledDepositAmount` | interface | Monetary value with currency: `{ amount: number, isoCurrencyCode: string }` |
| `iScheduledDeposit` | interface | Scheduled recurring deposit from Plaid: merchantName, description, frequency, firstDate, lastDate, predictedNextDate, averageAmount, lastAmount, isActive, personalFinanceCategory, status |
