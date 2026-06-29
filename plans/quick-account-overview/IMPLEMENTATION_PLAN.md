# Implementation Plan — Quick Account Overview

## Feature Summary

Display all of the authenticated user's linked Plaid accounts on the dashboard. Each account is a PrimeReact Accordion panel showing balance info, last deposit, recent transactions, and a custom name button/modal. Users can set or edit a custom display name per account.

---

## Prerequisite: Fix stale handler fixtures

Before any new work, the existing `mockAccount` and `mockTransaction` in `src/mocks/handlers.ts` are out of sync with the current API spec. These must be corrected first because the balance and transaction service tests depend on accurate fixtures.

**`mockAccount` — changes:**
- Remove `currency: 'USD'`
- Add `accountId: 'plaid-account-id-1'`
- Add `institutionName: 'Chase'`
- Add `customName: null`
- Add `isoCurrencyCode: 'USD'`

**Second mock account (new):**
- `accountId: 'plaid-account-id-2'`, `name: 'Plaid Savings'`, `type: 'depository'`, `subtype: 'savings'`, `currentBalance: 5678.90`, `availableBalance: 5678.90`, `isoCurrencyCode: 'USD'`, `institutionName: 'Bank of America'`, `customName: null`

**`mockTransaction` — changes:**
- Remove `currency: 'USD'`
- Add `accountId: 'plaid-account-id-1'`
- Add `isoCurrencyCode: 'USD'`

**Additional mock transactions (new):**
- A second transaction linked to `plaid-account-id-2` with a positive amount (debit)
- A third transaction linked to `plaid-account-id-1` with a negative amount (credit/deposit — tests Last Deposit logic)

**Balance handler update:** `balance.success` response must include both mock accounts.

**Transactions handler update:** `transactions.success` response must include all three mock transactions.

**New handler group — `plaid.setAccountName`:**
- `success`: `PUT /api/plaid/account/:plaidAccountId/name` → 200, empty body
- `notFound`: 404
- `forbidden`: 403
- `serverError`: 500

Add `handlers.plaid.setAccountName.success` to `defaultHandlers`.

---

## Step 1 — New types in `src/types/types.ts`

Add the following interfaces in the order below. All are new additions; no existing types are modified.

```ts
interface iAccount {
  accountId: string
  name: string
  type: string
  subtype: string | null
  currentBalance: number | null
  availableBalance: number | null
  isoCurrencyCode: string | null
  institutionName: string
  customName: string | null
}

interface iBalanceResponse {
  accounts: iAccount[]
  relinkRequired: iRelinkSignal[]
}

interface iTransaction {
  accountId: string
  date: string        // ISO "YYYY-MM-DD"
  name: string
  amount: number      // positive = debit (money out), negative = credit (money in)
  isoCurrencyCode: string | null
  category: string[]
}

interface iTransactionsResponse {
  transactions: iTransaction[]
  total: number
  relinkRequired: iRelinkSignal[]
}

interface iAccountWithTransactions extends iAccount {
  transactions: iTransaction[]  // filtered to this account, sorted date desc
  lastDeposit: iTransaction | null  // most recent where amount < 0
}

interface iSetAccountNameRequest {
  customName: string
}
```

---

## Step 2 — New service: `src/services/balanceService.ts`

```ts
export async function fetchBalance(): Promise<iBalanceResponse>
// GET /api/balance via apiClient
// Throws typed error { status, message } on non-2xx
```

---

## Step 3 — New service: `src/services/transactionService.ts`

```ts
export async function fetchTransactions(days?: number): Promise<iTransactionsResponse>
// GET /api/transactions?days={days} via apiClient (omit param if undefined)
// Throws typed error { status, message } on non-2xx
```

---

## Step 4 — Updated service: `src/services/plaidService.ts`

Add one new export (do not change existing functions):

```ts
export async function setAccountName(plaidAccountId: string, customName: string): Promise<void>
// PUT /api/plaid/account/{plaidAccountId}/name via apiClient
// Body: { customName }
// Throws typed error { status, message } on 404, 403, 500
```

---

## Step 5 — New hook: `src/hooks/useQuickAccountOverview.ts`

Returns:
```ts
{
  status: tStatus                          // 'idle' | 'loading' | 'error' | 'success'
  accounts: iAccountWithTransactions[]     // derived via useMemo
  relinkRequired: iRelinkSignal[]          // union of both fetches' signals
  retry: () => void                        // resets status + refetches both
  refetchBalance: () => void               // silently refetches balance only (after name save)
}
```

### Internal state

```
rawAccounts: iAccount[]           — set by main effect and balance-only effect
rawTransactions: iTransaction[]   — set by main effect only
internalStatus: tInternalStatus   — 'idle' | 'error' | 'success'
fetchCount: number                — incremented by retry()
balanceFetchCount: number         — starts at 0; incremented by refetchBalance()
relinkRequired: iRelinkSignal[]   — union of signals from both fetches
```

### Main effect (both fetches — initial load and retry)

Depends on `[user, fetchCount, triggerToast]`. Guard: `if (!user) return`.

Uses `Promise.all([fetchBalance(), fetchTransactions(30)])`. On success: sets `rawAccounts`, `rawTransactions`, `relinkRequired` (unioned from both responses), `internalStatus = 'success'`. On error: `internalStatus = 'error'`, fires error toast. Uses cancellation flag.

### Balance-only effect (silent refetch after name save)

Depends on `[user, balanceFetchCount, triggerToast]`. Guard: `if (!user || balanceFetchCount === 0) return`.

Calls `fetchBalance()` only. On success: updates `rawAccounts` and merges `relinkRequired` signals. On error: fires error toast ("Could not refresh account data, please reload the page"). Does **not** change `internalStatus` — the component stays in its current state.

### `accounts` derivation (useMemo)

```ts
const accounts = useMemo(() =>
  rawAccounts.map(account => {
    const txns = rawTransactions
      .filter(t => t.accountId === account.accountId)
      .sort((a, b) => b.date.localeCompare(a.date))
    const lastDeposit = txns.find(t => t.amount < 0) ?? null
    return { ...account, transactions: txns, lastDeposit }
  }),
  [rawAccounts, rawTransactions]
)
```

### Status derivation

Same pattern as `useScheduledDeposits`:
- `!user` → `'idle'`
- `user` + `internalStatus === 'idle'` → `'loading'`
- otherwise: `internalStatus` directly

---

## Step 6 — New component: `CustomAccountNameModal`

**File:** `src/components/CustomAccountNameModal/CustomAccountNameModal.tsx`

### Props interface

```ts
interface iCustomAccountNameModalProps {
  visible: boolean
  onHide: () => void
  accountId: string
  institutionName: string
  subtype: string | null
  currentCustomName: string | null
  onSuccess: (newName: string) => void
}
```

### Local state

- `inputValue: string` — prefilled on open
- `isSaving: boolean` — true while the PUT is in flight

### Pre-fill logic

When the modal becomes visible (or `currentCustomName`/`institutionName`/`subtype` change), reset `inputValue` to:
- `currentCustomName` if non-null
- Otherwise `[institutionName] - [subtype]` (with first letter of subtype capitalized) if subtype is not null
- Otherwise `institutionName`

Use `useEffect` on `[visible, currentCustomName, institutionName, subtype]` to sync this.

### PrimeReact Dialog props

```
header="Custom Account Name"
visible={visible}
onHide={onHide}
draggable={false}
resizable={false}
```

### Body

Single PrimeReact `InputText` bound to `inputValue`.

### Footer

**Save button** (primary):
- Disabled when `inputValue.trim() === ''` or `isSaving === true`
- On click: set `isSaving = true`, call `setAccountName(accountId, inputValue.trim())`
  - On success: call `onHide()`, call `onSuccess(inputValue.trim())`, fire success toast: `"Account successfully named [customName]"`
  - On error: set `isSaving = false`; keep modal open; fire error toast:
    - `404` → `"Account not found"`
    - `403` or `500` → `"Error saving account name, please try again"`

**Cancel button** (secondary / outlined):
- Disabled when `isSaving === true`
- On click: call `onHide()`

### Close behavior

X button (PrimeReact built-in), clicking outside (PrimeReact `dismissableMask`), Cancel button, successful save all close the modal.

---

## Step 7 — New component: `CustomAccountNameButton`

**File:** `src/components/CustomAccountNameButton/CustomAccountNameButton.tsx`

### Props interface

```ts
import type { ButtonProps } from 'primereact/button'

interface iCustomAccountNameButtonProps {
  accountId: string
  institutionName: string
  subtype: string | null
  currentCustomName: string | null
  onSuccess: (newName: string) => void
  buttonProps?: Omit<ButtonProps, 'label' | 'onClick'>
}
```

`buttonProps` is spread onto the underlying PrimeReact `<Button>` so callers can pass any PrimeReact Button prop (e.g. `outlined`, `severity`, `size`, `className`) without threading new props through this component. `label` and `onClick` are omitted from the spread type because this component controls them.

### Local state

- `modalVisible: boolean` — controls the Dialog

### Render

```tsx
<>
  <Button
    label={currentCustomName !== null ? 'Edit Name' : 'Add Name'}
    onClick={() => setModalVisible(true)}
    {...buttonProps}
  />
  <CustomAccountNameModal
    visible={modalVisible}
    onHide={() => setModalVisible(false)}
    accountId={accountId}
    institutionName={institutionName}
    subtype={subtype}
    currentCustomName={currentCustomName}
    onSuccess={onSuccess}
  />
</>
```

---

## Step 8 — New component: `QuickAccountOverview`

**File:** `src/components/QuickAccountOverview/QuickAccountOverview.tsx`

No props. Calls `useAuth()` and `useQuickAccountOverview()`.

### States

| Status | Behavior |
|--------|----------|
| Auth loading (`isLoading`) | PrimeReact `<Skeleton />` |
| No user (`!user`) | PrimeReact `<Skeleton />` |
| `'loading'` | Opaque overlay + `<ProgressSpinner />` (same pattern as ScheduledDeposits) |
| `'error'` | Opaque overlay + retry button (`pi-undo` + "Retry") |
| `'success'` + no accounts | Plain text "No linked accounts" centered |
| `'success'` + accounts | PrimeReact `<Accordion>` (see below) |

### Accordion props

```tsx
<Accordion activeIndex={activeIndex} onTabChange={(e) => setActiveIndex(e.index)}>
```

`activeIndex` is `number | null` (null = all closed). Default: `null`.

### Accordion header format

`[institutionName] - [Subtype]` where subtype has its first letter capitalized. If `subtype === null`, use `institutionName` alone.

Header is a string (not JSX) — passed via `header` prop of `<AccordionTab>`.

### Accordion panel — top section

Four labeled rows as a definition list or structured div:

1. **Bank:** `account.institutionName`
2. **Account Name:** `CustomAccountNameButton` is always rendered here
   - If `customName !== null`: display `customName` as text alongside the button (button label = "Edit Name")
   - If `customName === null`: only the button (button label = "Add Name")
3. **Last Deposit:** `lastDeposit.amount` formatted as `$X.XX` (absolute value, the amount is negative but we display without the sign). Display `—` if `lastDeposit === null`.
4. **Balance:** `currentBalance` formatted as `$X.XX`. Display `—` if `currentBalance === null`.

**Amount formatting:** use `Intl.NumberFormat` with the account's `isoCurrencyCode` (or 'USD' fallback).

`CustomAccountNameButton.onSuccess` → calls `refetchBalance()` from the hook.

### Accordion panel — bottom section

**Title:** "Recent Transactions" (centered).

**Transaction list:**
- Slice: first 3 on mobile (`< 1024px`), first 5 on desktop (`≥ 1024px`). Transactions are already sorted date desc from the hook.
- Each row: two columns — left: date formatted `MM/DD/YYYY`, right: amount with direction
  - `amount > 0` (debit): display `-$X.XX`, PrimeReact error/danger token (`var(--red-500)` or the semantic danger variable)
  - `amount < 0` (credit): display `$X.XX` (absolute value), PrimeReact success token (`var(--green-500)` or semantic success variable)
  - `amount === 0`: display `$0.00` in neutral color

**Empty state:** "No recent transactions" centered in place of the list.

**Placeholder link:** Bottom-right, PrimeReact `<Button link>` or anchor labeled "Detailed View", `href="#"`.

---

## Step 9 — Update `HomepagePage`

Replace the empty `<section className="dashboard__accounts">` with:

```tsx
<section className="dashboard__accounts" aria-label="Account overview">
  <QuickAccountOverview />
</section>
```

---

## Step 10 — SCSS files

**`src/components/QuickAccountOverview/quickAccountOverview.scss`** — styles for the accordion, overlay/spinner/retry patterns, top section rows, transaction list, amount direction colors, Detailed View link position.

Accordion panel spacing target: compact but readable on mobile. Aim for tight but distinct rows — enough vertical padding between label/value pairs to separate them clearly, but not so much that the user has to scroll through a single panel to see the balance and last deposit. Transaction rows should feel like a dense list, not a spaced card stack. Use padding increments from `variables.scss` and verify the panel fits on a 390px viewport without excessive scroll before considering it done.

**`src/components/CustomAccountNameButton/customAccountNameButton.scss`** — button sizing/variant overrides if PrimeReact defaults don't meet 44×44px minimum.

**`src/components/CustomAccountNameModal/customAccountNameModal.scss`** — dialog body input width, footer button layout.

All three are imported in `src/styles/index.scss` via `@use` statements.

---

## Step 11 — Documentation updates

`_dev/ARCHITECTURE.md`:
- Add Quick Account Overview architecture section (types, service, hook, components)
- Correct the stale `iAccount` and `iTransaction` shapes in the Backend Integration / API Endpoints section to match the current endpoint spec

`_dev/COMPONENTS.md`:
- Add `QuickAccountOverview`, `CustomAccountNameButton`, `CustomAccountNameModal` to Components table
- Add `useQuickAccountOverview` to Hooks table
- Add `fetchBalance`, `fetchTransactions`, `setAccountName` to Services table
- Add `iAccount`, `iBalanceResponse`, `iTransaction`, `iTransactionsResponse`, `iAccountWithTransactions`, `iSetAccountNameRequest` to Shared Types table

---

## File Creation Order

The enforce hook requires test file to exist before the implementation file. Create each pair in order:

1. `src/types/types.ts` — updated (no test needed)
2. `src/mocks/handlers.ts` — updated (no test needed)
3. `src/services/balanceService.test.ts` → then `src/services/balanceService.ts`
4. `src/services/transactionService.test.ts` → then `src/services/transactionService.ts`
5. Update `src/services/plaidService.test.ts` → then update `src/services/plaidService.ts`
6. `src/hooks/useQuickAccountOverview.test.ts` → then `src/hooks/useQuickAccountOverview.ts`
7. `src/components/CustomAccountNameModal/CustomAccountNameModal.test.tsx` → then `CustomAccountNameModal.tsx` + `customAccountNameModal.scss`
8. `src/components/CustomAccountNameButton/CustomAccountNameButton.test.tsx` → then `CustomAccountNameButton.tsx` + `customAccountNameButton.scss`
9. `src/components/QuickAccountOverview/QuickAccountOverview.test.tsx` → then `QuickAccountOverview.tsx` + `quickAccountOverview.scss`
10. Update `src/components/Homepage/HomepagePage.tsx`
11. Update `src/styles/index.scss`
12. Update `_dev/ARCHITECTURE.md`
13. Update `_dev/COMPONENTS.md`

---

## Out of Scope

- "Detailed View" per-account page (link placeholder only, `href="#"`)
- `DELETE /api/plaid/account/{plaidAccountId}/name` (name removal)
- Full relink UI for `relinkRequired` signals (hook exposes the array; relink flow is a future feature)
