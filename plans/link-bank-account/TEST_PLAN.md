# Test Plan — Link Bank Account

## Testing stack

- **Framework:** Vitest + React Testing Library
- **HTTP mocking:** MSW (`src/mocks/handlers.ts` + `src/mocks/server.ts`)
- **Assertions:** `@testing-library/jest-dom`
- **Coverage target:** ≥ 80% line and branch

---

## `src/services/plaidService.test.ts`

### `fetchLinkToken`

| # | Scenario | Setup | Assert |
|---|----------|-------|--------|
| 1 | Happy path | MSW returns `200 { link_token: 'test-token' }` | Resolves with `{ link_token: 'test-token' }` |
| 2 | Server error | MSW returns `500` | Throws with status `500` |
| 3 | 401 | Not tested here — handled globally by `apiClient` interceptor |

### `exchangePublicToken`

| # | Scenario | Setup | Assert |
|---|----------|-------|--------|
| 4 | Happy path | MSW returns `200 { status: 'ok', message: 'Plaid authentication successful' }` | Resolves with `{ status: 'ok', message: '...' }` |
| 5 | Sends correct body | Inspect MSW request | Body contains `publicToken`, `institutionId`, `institutionName`, `expiredItemId: null` |
| 6 | Server error | MSW returns `500` | Throws with status `500` |

---

## `src/contexts/contextTests/NotificationContext.test.tsx`

| # | Scenario | Assert |
|---|----------|--------|
| 1 | `useNotify` outside provider | Throws `'useNotify must be used within NotificationProvider'` |
| 2 | Initial state | `showToast = false`, `toastConfig = null`, `showBanner = false`, `bannerConfig = null` |
| 3 | `showToast(config)` | `toastRef.current.show()` is called with config |
| 4 | `hideToast()` | `showToast` resets to `false`, `toastConfig` resets to `null` |
| 5 | `showBanner(config)` | `showBanner = true`, `bannerConfig` equals config |
| 6 | `hideBanner()` | `showBanner` resets to `false`, `bannerConfig` resets to `null` |
| 7 | Toast/banner independence | Calling `hideToast` does not affect banner state |
| 8 | Banner/toast independence | Calling `hideBanner` does not affect toast state |
| 9 | `toastRef` exported | `toastRef` is a React ref object (`{ current: ... }`) |
| 10 | Memoization | Context value reference is stable across re-renders that don't change state |

---

## `src/hooks/useLinkAccount.test.ts`

Mock `plaidService` and `usePlaidLink` from `react-plaid-link`. Mock `useNotify`.

| # | Scenario | Setup | Assert |
|---|----------|-------|--------|
| 1 | Initial state | — | `isLoading = false` |
| 2 | `initiateLinkFlow` triggers loading | Call `initiateLinkFlow()` | `isLoading = true` |
| 3 | Fetch token success → opens Plaid | `fetchLinkToken` resolves | `usePlaidLink.open()` is called |
| 4 | `onSuccess` → calls exchange | `onSuccess` callback fires | `exchangePublicToken` called with correct payload |
| 5 | `onSuccess` → shows success toast | Exchange resolves `200` | `useNotify().showToast` called with success message |
| 6 | `onSuccess` → loading clears | Exchange resolves | `isLoading = false` |
| 7 | `onSuccess` exchange 500 → error toast | Exchange throws 500 | `useNotify().showToast` called with error message |
| 8 | `onSuccess` exchange 500 → loading clears | Exchange throws 500 | `isLoading = false` |
| 9 | `onExit` no error → loading clears | `onExit(null)` fires | `isLoading = false` |
| 10 | `onExit` no error → no toast | `onExit(null)` fires | `showToast` not called |
| 11 | `onExit` with error → error toast | `onExit({ error_code: 'INSTITUTION_DOWN' })` fires | `showToast` called with error message |
| 12 | `onExit` with error → loading clears | `onExit(error)` fires | `isLoading = false` |
| 13 | Fetch token 500 → error toast | `fetchLinkToken` throws 500 | `showToast` called with error message |
| 14 | Fetch token 500 → loading clears | `fetchLinkToken` throws 500 | `isLoading = false` |

---

## `src/components/LinkAccount/LinkAccount.test.tsx`

Mock `useLinkAccount` hook.

| # | Scenario | Setup | Assert |
|---|----------|-------|--------|
| 1 | Default render | `isLoading = false` | Button with label "Link Account" is visible |
| 2 | Default state enabled | `isLoading = false` | Button is not disabled |
| 3 | Loading state | `isLoading = true` | Button is disabled |
| 4 | Loading state spinner | `isLoading = true` | PrimeReact loading spinner is present |
| 5 | Click calls `initiateLinkFlow` | User clicks button | `initiateLinkFlow` is called once |
| 6 | No click when loading | `isLoading = true`, user tries to click | `initiateLinkFlow` not called (button disabled) |

---

## `src/components/Account/Account.test.tsx`

| # | Scenario | Assert |
|---|----------|--------|
| 1 | H1 present | `<h1>Account Actions</h1>` is in the document |
| 2 | Description text present | Description paragraph is visible |
| 3 | Actions grid present | Grid container is rendered |
| 4 | LinkAccount button rendered | "Link Account" button is in the document |

---

## `src/components/Account/AccountPage.test.tsx`

| # | Scenario | Assert |
|---|----------|--------|
| 1 | Renders Account component | H1 "Account Actions" is present |

---

## `src/components/AppHeader/AppHeader.test.tsx` (existing file — add cases)

| # | Scenario | Assert |
|---|----------|--------|
| + | Accounts nav item present | Menubar contains item with label "Accounts" |
| + | Accounts item has wallet icon | Item renders `pi-wallet` icon class |

---

## `src/components/AppSidebar/AppSidebar.test.tsx` (existing file — add cases)

| # | Scenario | Assert |
|---|----------|--------|
| + | Accounts item renders as a link | `<a>` or `<Link>` with `href="/account"` for Accounts item |
| + | Accounts item has wallet icon | `pi-wallet` class present in Accounts item |

---

## `src/components/Layout/Layout.test.tsx` (existing file — add cases)

| # | Scenario | Assert |
|---|----------|--------|
| + | Toast component present in DOM | PrimeReact `Toast` is rendered |
| + | Message component present in DOM | PrimeReact `Message` container is rendered (or not rendered when `showBanner = false`) |

---

## MSW handler coverage (`src/mocks/handlers.ts`)

All new plaid handlers used by tests:

| Handler | Used by |
|---------|---------|
| `plaid.linkToken.success` | `plaidService.test.ts`, `useLinkAccount.test.ts` |
| `plaid.linkToken.error` | `plaidService.test.ts`, `useLinkAccount.test.ts` |
| `plaid.exchange.success` | `plaidService.test.ts`, `useLinkAccount.test.ts` |
| `plaid.exchange.error` | `plaidService.test.ts`, `useLinkAccount.test.ts` |

---

## Coverage notes

- `NotificationContext` is the most complex new file — test all state transitions and independence guarantees
- `useLinkAccount` has the most branching — cover all four `onExit`/`onSuccess` conditions plus both fetch-token error paths
- `LinkAccount` component is thin (delegates to hook) — 4–6 tests sufficient
- `Account` / `AccountPage` are display-only — minimal tests needed, focus on structure assertions
