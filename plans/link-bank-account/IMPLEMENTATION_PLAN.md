# Implementation Plan — Link Bank Account

## Overview

This feature adds Plaid bank linking, a global notification system, and an Accounts page. It touches the services layer (new `plaidService`), context layer (new `NotificationContext`), hooks layer (new `useLinkAccount`), components layer (new `LinkAccount` button + `Account` page), routing, and nav wiring in `Layout`, `AppHeader`, and `AppSidebar`.

**TDD rule:** For every new `.ts` / `.tsx` under `src/`, the test file must be created before the implementation file. Steps below reflect that order.

---

## Step 0 — Install dependency

```bash
npm install react-plaid-link
```

---

## Step 1 — Shared types (`src/types/types.ts`)

Add three interfaces after `iUser`:

```ts
interface iPlaidLinkTokenResponse {
  link_token: string;
}

interface iPlaidExchangeRequest {
  publicToken: string;
  institutionId: string;
  institutionName: string;
  expiredItemId: string | null;
}

interface iPlaidExchangeResponse {
  status: 'ok';
  message: string;
}
```

No test file required (types-only file under `src/types/` is exempt per test convention).

---

## Step 2 — MSW handlers (`src/mocks/handlers.ts`)

Add plaid handlers to the existing `plaid` group:

| Variant | Method | Path | Response |
|---------|--------|------|----------|
| `plaid.linkToken.success` | GET | `/api/plaid/link-token` | `200 { link_token: 'test-token' }` |
| `plaid.linkToken.error` | GET | `/api/plaid/link-token` | `500` |
| `plaid.exchange.success` | POST | `/api/plaid/exchange` | `200 { status: 'ok', message: 'Plaid authentication successful' }` |
| `plaid.exchange.error` | POST | `/api/plaid/exchange` | `500` |

No standalone test file needed (mocks are test infrastructure, exempt).

---

## Step 3 — Plaid service (`src/services/plaidService.ts`)

**Test file first:** `src/services/plaidService.test.ts`

### `fetchLinkToken(): Promise<iPlaidLinkTokenResponse>`
- `GET /api/plaid/link-token` via `apiClient`
- Returns `{ link_token }` on `200`
- Throws `{ status: 500, message: 'Server error' }` on `500`
- `401` is handled automatically by the `apiClient` interceptor — do not re-check

### `exchangePublicToken(body: iPlaidExchangeRequest): Promise<iPlaidExchangeResponse>`
- `POST /api/plaid/exchange` via `apiClient`
- Returns `{ status: 'ok', message }` on `200`
- Throws `{ status: 500, message: 'Server error' }` on `500`
- `401` handled by interceptor

---

## Step 4 — Notification context (`src/contexts/NotificationContext.tsx`)

**Test file first:** `src/contexts/contextTests/NotificationContext.test.tsx`

### State
| State variable | Type | Default |
|----------------|------|---------|
| `showToast` | `boolean` | `false` |
| `toastConfig` | `ToastMessage \| null` (PrimeReact) | `null` |
| `showBanner` | `boolean` | `false` |
| `bannerConfig` | `iNotificationBannerConfig \| null` | `null` |

Where `iNotificationBannerConfig` extends PrimeReact `MessageProps` (local type alias at top of context file).

### Refs
- `toastRef = useRef<Toast>(null)` — exported so `Layout.tsx` can attach it to `<Toast ref={toastRef} />`

### Behaviour
- When `showToast` is set to `true`, a `useEffect` calls `toastRef.current?.show(toastConfig)`
- When `hideToast()` is called (or toast auto-dismisses), reset `showToast = false` and `toastConfig = null`
- `showBanner(config)` and `hideBanner()` independently manage banner state
- All values exported from the context must be wrapped in `useMemo`

### Exported hook
```ts
export function useNotify() {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error('useNotify must be used within NotificationProvider')
  return ctx
}
```

### Provider placement
`NotificationProvider` wraps `<Layout>` inside `App.tsx`, alongside `AuthProvider`. This allows `Layout.tsx` itself to call `useNotify()` for the toast ref and banner config.

---

## Step 5 — Update `App.tsx`

- Import and add `NotificationProvider` wrapping `<Layout>`
- Add `/account` route: `<Route path="/account" element={<AccountPage />} />`

```tsx
<AuthProvider>
  <NotificationProvider>
    <Layout>
      <Routes>
        <Route path="/" element={<HomepagePage />} />
        <Route path="/account" element={<AccountPage />} />
      </Routes>
    </Layout>
  </NotificationProvider>
</AuthProvider>
```

---

## Step 6 — Update `Layout.tsx`

### Toast component
- Import `Toast` from `primereact/toast`
- Call `useNotify()` to get `toastRef` and `hideToast`
- Add `<Toast ref={toastRef} onHide={hideToast} />` inside the layout `<div>`, outside `<main>`
- Toast must have an X (close) button — PrimeReact's `Toast` shows a close button by default
- Auto-dismiss: `pt={{ root: { style: { ... } } }}` — set via the `toastConfig` object's `life: 3000` property (set in the context when `showToast` is called, not hardcoded in Layout)

### Banner (Message) component
- Import `Message` from `primereact/message`
- Call `useNotify()` to get `showBanner`, `bannerConfig`, `hideBanner`
- Render `{showBanner && bannerConfig && <Message {...bannerConfig} />}` centered 1rem below the header
- Add `.layout__banner` class with styles: `text-align: center; margin-top: 1rem`

### Nav wiring — Accounts item
- Call `useNavigate()` from react-router-dom
- Move `NAV_ITEMS` construction inside the `Layout` component function
- Update the `Accounts` item: add `command: () => navigate('/account')`
- Add `url: '/account'` to the Accounts item so AppSidebar can use it for `<Link>`

### No change to NAV_ITEMS index — "Accounts" stays at index 1

---

## Step 7 — Update `AppSidebar.tsx`

- Import `Link` from `react-router-dom`
- In the `items.map()` renderer, if `item.url` is set, wrap the item content in `<Link to={item.url}>`, otherwise render as before
- Apply `.sidebar__nav-item--link` modifier class on linked items for styling

---

## Step 8 — `useLinkAccount` hook (`src/hooks/useLinkAccount.ts`)

**Test file first:** `src/hooks/useLinkAccount.test.ts`

### API
```ts
function useLinkAccount(): {
  isLoading: boolean;
  initiateLinkFlow: () => void;
}
```

### Internal logic
1. `linkToken` state (string | null, starts null)
2. `isLoading` state (boolean, starts false)
3. Use `usePlaidLink` from `react-plaid-link` with:
   - `token: linkToken`
   - `onSuccess(publicToken, metadata)` → call `plaidService.exchangePublicToken(...)`, show success toast via `useNotify`, set `isLoading = false`, clear `linkToken`
   - `onExit(error)` → if `error` is non-null show error toast, set `isLoading = false`, clear `linkToken`
4. `useEffect([ready])` — when `ready && linkToken`, call `open()`
5. `initiateLinkFlow()`:
   - Set `isLoading = true`
   - Call `plaidService.fetchLinkToken()`
   - On success: set `linkToken` (triggers the `ready` useEffect chain)
   - On error (500): show error toast via `useNotify`, set `isLoading = false`

### Error messages (toast text)
- Exchange success: use `response.message` directly (`"Plaid authentication successful"`)
- Fetch token 500: `"Something went wrong linking your bank. Please try again"`
- Exchange 500: `"Something went wrong linking your bank. Please try again"`
- Plaid `onExit` with error: `"Something went wrong linking your bank. Please try again"`

---

## Step 9 — `LinkAccount` component (`src/components/LinkAccount/`)

**Test file first:** `src/components/LinkAccount/LinkAccount.test.tsx`

### Files
- `LinkAccount.tsx`
- `linkAccount.scss`

### Behaviour
- Calls `useLinkAccount()` internally — standalone, no props needed
- Renders PrimeReact `<Button label="Link Account" loading={isLoading} disabled={isLoading} onClick={initiateLinkFlow} />`
- Default state: enabled, label "Link Account"
- Loading state: disabled, spinner on left of label (PrimeReact `loading` prop)

### SCSS
- Minimal; size and spacing only — color comes from PrimeReact primary button styles
- Add `@use '../components/LinkAccount/linkAccount';` to `src/styles/index.scss`

---

## Step 10 — `Account` page (`src/components/Account/`)

**Test files first:** `Account.test.tsx`, `AccountPage.test.tsx`

### Files
- `Account.tsx` — page content component
- `AccountPage.tsx` — thin route wrapper (renders `<Account />`)
- `account.scss`

### `Account.tsx` layout
- `<h1>Account Actions</h1>` — upper-left aligned
- `<p>` description: "These are all the available actions to manage your Banksy bank links. Click a button below to get started."
- `<div class="account__actions-grid">` centered below — renders `<LinkAccount />`

### SCSS — `account.scss`
```scss
.account {
  // base (mobile): single column, full width
  // desktop: two-column body grid applies from Layout

  &__heading { /* left-aligned */ }
  &__description { /* left-aligned, bottom margin */ }
  &__actions-grid {
    display: flex;
    justify-content: center;
    // desktop: use grid for multi-column button layout
    @include bp('desktop') {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      justify-items: center;
    }
  }
}
```

Add `@use '../components/Account/account';` to `src/styles/index.scss`

---

## Step 11 — Documentation updates

- `_dev/ARCHITECTURE.md` — add `/account` to routing table; add `NotificationProvider` placement note
- `_dev/COMPONENTS.md` — add entries for `NotificationProvider/useNotify`, `useLinkAccount`, `plaidService`, `LinkAccount`, `Account`, `AccountPage`

---

## Files changed summary

| Action | File |
|--------|------|
| Update | `src/types/types.ts` |
| Update | `src/mocks/handlers.ts` |
| Create | `src/services/plaidService.ts` + test |
| Create | `src/contexts/NotificationContext.tsx` + test |
| Update | `src/App.tsx` |
| Update | `src/components/Layout/Layout.tsx` + test |
| Update | `src/components/AppSidebar/AppSidebar.tsx` + test |
| Create | `src/hooks/useLinkAccount.ts` + test |
| Create | `src/components/LinkAccount/LinkAccount.tsx` + test + scss |
| Create | `src/components/Account/Account.tsx` + test |
| Create | `src/components/Account/AccountPage.tsx` + test |
| Create | `src/components/Account/account.scss` |
| Update | `src/styles/index.scss` |
| Update | `_dev/ARCHITECTURE.md` |
| Update | `_dev/COMPONENTS.md` |
