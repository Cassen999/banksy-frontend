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
| `handlers` | `src/mocks/handlers.ts` | Test infra | All MSW handlers grouped by domain: `auth`, `balance`, `transactions`, `plaid`, `scheduledDeposits`, `monthlyGlance`, `dev`. Each has `success` and error variants. `plaid` group includes `setAccountName` (success, notFound, forbidden, serverError). Dev handlers are internal tooling only — never wire to UI. |

---

## Components

| Name | File | Type | Props interface | Description |
|------|------|------|-----------------|-------------|
| `Layout` | `src/components/Layout/Layout.tsx` | Shell | `iLayoutProps` | Full-app shell. Renders `AppHeader`, `AppSidebar` (mobile only), backdrop overlay, global `Toast` and `Message` (banner), and `<main>` body inside a `layout` div. Renders `ViewportMask` outside the div (so it is never `inert`). Owns sidebar open/close state and the shared `NAV_ITEMS`. Adds `className: 'active'` to the `NAV_ITEMS` entry whose `url` matches the current `location.pathname`. On successful login (detects `banksy_login_pending` sessionStorage flag) shows a success toast. Calls `useNotify()` for toast ref and banner state. |
| `AppHeader` | `src/components/AppHeader/AppHeader.tsx` | UI | `iAppHeaderProps` | Responsive header. Mobile: hamburger button + current page name (centered). Desktop: brand logo link + floating pill Menubar (with app logo as start slot) + welcome text. Page name is hidden on desktop — each page provides its own visible `h1`. Nav items turn primary blue on hover (no underline); the active route item (determined by `className: 'active'` on the MenuItem) shows a 2px primary-blue underline indicator at the bottom of the nav item. Reads user from `useAuth()` and theme from `useTheme()` for logo variant. |
| `AppSidebar` | `src/components/AppSidebar/AppSidebar.tsx` | UI | `iAppSidebarProps` | Mobile-only sliding sidebar panel. Animates via CSS `transform`. Contains close (×) button, user info, nav items, copyright. Locks body scroll when open. Hidden on desktop via CSS. |
| `AuthButton` | `src/components/AuthButton/AuthButton.tsx` | UI | — (`forwardRef`) | Login/Logout PrimeReact Button. Label switches based on `useAuth()` user. Login redirects to Google OAuth (`/oauth2/authorization/google`) and sets `banksy_login_pending` in sessionStorage. Logout redirects to `/logout`. Exposes `iAuthButtonHandle` ref with a `focus()` method (used by `ViewportMask` after a failed login). |
| `ViewportMask` | `src/components/ViewportMask/ViewportMask.tsx` | UI | — | Full-viewport auth gate. Returns `null` when user is authenticated. While auth loads shows a `ProgressSpinner`; once resolved-unauthenticated shows a login prompt and `AuthButton`. On failed login (detects `banksy_login_pending` sessionStorage flag) triggers an error toast and focuses the auth button via `iAuthButtonHandle` ref. |
| `MonthlyGlance` | `src/components/MonthlyGlance/MonthlyGlance.tsx` | UI | — | Chart.js line chart (react-chartjs-2) showing cumulative monthly spending vs. a hardcoded $2,000 budget line. Shows `Skeleton` while auth is loading, `ProgressSpinner` while fetching, and a retry button on error. Custom `splitBackground` canvas plugin shades the chart area red above budget and teal below. Tooltip shows date, daily spend, and running total. Mobile disables mousemove events. Delegates data fetching to `useMonthlyGlance`. |
| `ScheduledDeposits` | `src/components/ScheduledDeposits/ScheduledDeposits.tsx` | UI | — | PrimeReact Accordion listing upcoming scheduled deposits. Shows `Skeleton` while auth is loading, `ProgressSpinner` while fetching, retry button on error, and an empty-state message when no deposits are found. Displays 1 deposit on mobile, up to 5 on desktop. Each accordion item has a piggy-bank icon header and a detail panel with From, Description, Frequency, Last, and Next columns. Delegates data fetching to `useScheduledDeposits`. |
| `LinkAccount` | `src/components/LinkAccount/LinkAccount.tsx` | UI | — | Multistate "Link Account" PrimeReact Button. Default: enabled, label "Link Account". Loading: disabled with spinner. Delegates all logic to `useLinkAccount`. |
| `QuickAccountOverview` | `src/components/QuickAccountOverview/QuickAccountOverview.tsx` | UI | — | Dashboard accordion listing all linked Plaid accounts. Shows `Skeleton` while auth is loading, `ProgressSpinner` overlay while fetching, retry button overlay on error, and a centered empty state ("Get started with Banksy by linking your accounts" + `<LinkAccount />`) when no accounts exist. On mobile with 5+ accounts the `<Accordion>` is wrapped in a `<ScrollPanel style={{ height: '100%' }}>`. Each panel shows bank name, last deposit, balance, a `CustomAccountNameButton`, and up to 3 (mobile) / 5 (desktop) recent transactions. Delegates data to `useQuickAccountOverview`. |
| `CustomAccountNameButton` | `src/components/CustomAccountNameButton/CustomAccountNameButton.tsx` | UI | `iCustomAccountNameButtonProps` | PrimeReact Button that opens `CustomAccountNameModal`. Label is "Add Name" when `currentCustomName` is null, "Edit Name" otherwise. Accepts `buttonProps?: Omit<ButtonProps, 'label' \| 'onClick'>` to customize button styling. Owns the modal-visible state; calls `onSuccess` and closes modal on save. |
| `CustomAccountNameModal` | `src/components/CustomAccountNameModal/CustomAccountNameModal.tsx` | UI | `iCustomAccountNameModalProps` | PrimeReact `Dialog` for setting an account's custom display name. Prefills input with `currentCustomName`, or a derived label when null. Calls `setAccountName` on save; fires `onSuccess(newName)` and closes on success. Shows a toast on 404 ("Account not found") or other errors (generic message). |

---

## Pages / Views

| Name | File | Route | Description |
|------|------|-------|-------------|
| `HomepagePage` | `src/components/Homepage/HomepagePage.tsx` | `/dashboard` | Dashboard page. Renders `h1.dashboard__title` "Dashboard" (SR-only on mobile, visible on desktop as the first grid row spanning both columns), `MonthlyGlance` in a spending-trend graph section, `ScheduledDeposits` in a next-deposit region, and `QuickAccountOverview` in an account overview section. |
| `AccountPage` | `src/components/Account/AccountPage.tsx` | `/account` | Account Actions page. H1, description, and an actions grid containing `LinkAccount`. |
| `SettingsPage` | `src/components/Settings/SettingsPage.tsx` | `/settings` | Minimal settings page. Renders a heading and `AuthButton`. |

---

## Hooks

| Name | File | Returns | Description |
|------|------|---------|-------------|
| `useMonthlyGlance` | `src/hooks/useMonthlyGlance.ts` | `{ status: tStatus, data: iMonthlyGlanceDataPoint[], retry }` | Fetches monthly glance data via `fetchMonthlyGlance` when a user is present. Converts raw `dailyTotals` to cumulative data points via `toCumulative`. Status is `'loading'` while a fetch is in flight, `'error'` on failure (also triggers an error toast), `'success'` when data is ready. `retry()` re-triggers the fetch. Cancels in-flight requests on unmount. |
| `useScheduledDeposits` | `src/hooks/useScheduledDeposits.ts` | `{ status: tStatus, deposits: iScheduledDeposit[], retry }` | Fetches scheduled deposits via `fetchScheduledDeposits` when a user is present; filters to `isActive` deposits. In non-test environments (`MODE !== 'test'`) uses `scheduledDepositsMockData` directly instead of hitting the API. On error triggers an error toast. `retry()` re-triggers the fetch. Cancels in-flight requests on unmount. |
| `useLinkAccount` | `src/hooks/useLinkAccount.ts` | `{ isLoading, initiateLinkFlow }` | Orchestrates the Plaid bank link flow. Calls `fetchLinkToken`, opens the Plaid modal via `usePlaidLink`, handles `onSuccess` (calls `exchangePublicToken`, shows success toast) and `onExit` (shows error toast on Plaid error). |
| `useQuickAccountOverview` | `src/hooks/useQuickAccountOverview.ts` | `{ status: tStatus, accounts: iAccountWithTransactions[], relinkRequired: iRelinkSignal[], retry, refetchBalance }` | Fetches account balances and recent transactions in parallel via `Promise.all`. Derives `iAccountWithTransactions[]` (per-account transaction lists + lastDeposit) via `useMemo`. Exposes `retry()` to re-trigger both fetches and `refetchBalance()` for a silent balance-only refresh after a name save. On any fetch error triggers an error toast. Cancels in-flight requests on unmount. |

---

## Services

| Name | File | Method | Endpoint | Description |
|------|------|--------|----------|-------------|
| `fetchMe` | `src/services/authService.ts` | `GET` | `/api/auth/me` | Returns `iUser`. Called by `AuthProvider` on mount to hydrate session state. Throws on any non-2xx. |
| `fetchMonthlyGlance` | `src/services/monthlyGlanceService.ts` | `GET` | `/api/monthly-glance` | Returns `iMonthlyGlanceResponse`. Called by `useMonthlyGlance`. Throws on non-2xx. |
| `fetchScheduledDeposits` | `src/services/scheduledDepositsService.ts` | `GET` | `/api/recurring/scheduled-deposits` | Returns `iScheduledDeposit[]`. Called by `useScheduledDeposits`. Throws on non-2xx. |
| `fetchLinkToken` | `src/services/plaidService.ts` | `GET` | `/api/plaid/link-token` | Returns `iPlaidLinkTokenResponse`. Called by `useLinkAccount` to start a new bank link. Throws `{ status: 500 }` on server error. |
| `exchangePublicToken` | `src/services/plaidService.ts` | `POST` | `/api/plaid/exchange` | Exchanges the Plaid public token after `onSuccess`. Returns `iPlaidExchangeResponse`. Throws `{ status: 500 }` on server error. |
| `fetchBalance` | `src/services/balanceService.ts` | `GET` | `/api/balance` | Returns `iBalanceResponse` (accounts + relinkRequired). Called by `useQuickAccountOverview`. Throws on non-2xx. |
| `fetchTransactions` | `src/services/transactionService.ts` | `GET` | `/api/transactions` | Returns `iTransactionsResponse` (transactions + total + relinkRequired). Accepts optional `days` param (default 30). Called by `useQuickAccountOverview`. Throws on non-2xx. |
| `setAccountName` | `src/services/plaidService.ts` | `PUT` | `/api/plaid/account/:id/name` | Sets or updates the custom display name for a single account. Returns `void`. Throws a typed error with the response status on non-2xx. Called by `CustomAccountNameModal`. |

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
| `isDesktop` | `src/utils/isDesktop.ts` | Returns `true` when `window.innerWidth >= 1024`. Mobile-first breakpoint check — use this instead of reading `window.innerWidth` directly in components. |

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
| `iAccount` | interface | Single Plaid account from `GET /api/balance`: accountId, name, type, subtype, currentBalance, availableBalance, isoCurrencyCode, institutionName, customName |
| `iBalanceResponse` | interface | Response shape for `GET /api/balance`: `{ accounts: iAccount[], relinkRequired: iRelinkSignal[] }` |
| `iTransaction` | interface | Single transaction row from `GET /api/transactions`: accountId, date, name, amount (positive=debit, negative=credit), isoCurrencyCode, category |
| `iTransactionsResponse` | interface | Response shape for `GET /api/transactions`: `{ transactions: iTransaction[], total: number, relinkRequired: iRelinkSignal[] }` |
| `iAccountWithTransactions` | interface | Derived type: `iAccount` extended with `transactions: iTransaction[]` (sorted desc by date) and `lastDeposit: iTransaction \| null` (most recent transaction with `amount < 0`) |
| `iSetAccountNameRequest` | interface | Request body for `PUT /api/plaid/account/:id/name`: `{ customName: string }` |
