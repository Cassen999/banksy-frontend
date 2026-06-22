# Test Plan — Quick Account Overview

## Coverage requirement

80% line coverage and 80% branch coverage enforced by Vitest. Every new file in `src/` must meet this threshold.

## Exempt files (no test required)

- `src/types/types.ts`
- `src/mocks/handlers.ts`
- `src/styles/index.scss`
- `*.scss` files
- `_dev/*.md`

---

## 1. `src/services/balanceService.test.ts`

Uses MSW. Import `server`, `handlers`, and `fetchBalance`.

```
describe('fetchBalance')
  it('returns balance response on success')
  it('throws on 500')
  it('throws on 401')
```

**Success:** assert resolved value shape matches `iBalanceResponse` (accounts array, relinkRequired array).
**Error:** assert the thrown error has a `status` property.

---

## 2. `src/services/transactionService.test.ts`

Uses MSW. Import `server`, `handlers`, and `fetchTransactions`.

```
describe('fetchTransactions')
  it('returns transactions response on success')
  it('passes the days query param to the request')
  it('uses default of 30 days when no param provided')
  it('throws on 500')
```

**Note on query param:** Use `server.use` with a handler that reads `request.url` to assert that `?days=30` is present. Alternatively, assert the response data shape and trust the URL is constructed correctly.

---

## 3. `src/services/plaidService.test.ts` (additions only)

Add to the existing describe block.

```
describe('setAccountName')
  it('resolves on 200')
  it('throws with status 404 on not found')
  it('throws with status 403 on forbidden')
  it('throws with status 500 on server error')
```

---

## 4. `src/hooks/useQuickAccountOverview.test.ts`

Uses `renderHook`, `vi.mock`. No MSW.

### Mocks

```ts
vi.mock('../services/balanceService', () => ({ fetchBalance: vi.fn() }))
vi.mock('../services/transactionService', () => ({ fetchTransactions: vi.fn() }))
vi.mock('../contexts/AuthContext', () => ({ useAuth: vi.fn() }))
vi.mock('../contexts/NotificationContext', () => ({ useNotify: vi.fn() }))
```

### Test cases

```
describe('useQuickAccountOverview')

  describe('when user is null')
    it('returns status idle')
    it('does not call fetchBalance or fetchTransactions')

  describe('initial load')
    it('returns status loading while fetches are in flight')
    it('returns status success and derived accounts when both fetches resolve')
    it('merges transactions to the correct account via accountId')
    it('sets lastDeposit to the most recent transaction where amount < 0')
    it('sets lastDeposit to null when no negative-amount transaction exists')
    it('sorts transactions date descending within each account')
    it('unions relinkRequired from both responses')

  describe('error handling')
    it('returns status error when fetchBalance rejects')
    it('returns status error when fetchTransactions rejects')
    it('fires triggerToast with severity error on failure')

  describe('retry')
    it('resets to loading and re-fetches both when retry is called after error')

  describe('refetchBalance')
    it('calls fetchBalance again without changing status')
    it('updates accounts with new customName after refetchBalance resolves')
    it('fires triggerToast on error during refetchBalance')

  describe('cleanup')
    it('does not update state after unmount')
```

### Key setup

For success case, mock resolved values:
```ts
const mockAccounts: iAccount[] = [
  { accountId: 'plaid-account-id-1', ..., customName: null },
  { accountId: 'plaid-account-id-2', ..., customName: null },
]
const mockTransactions: iTransaction[] = [
  { accountId: 'plaid-account-id-1', date: '2026-06-10', amount: 5.75, ... },
  { accountId: 'plaid-account-id-1', date: '2026-06-05', amount: -2500.0, ... }, // credit
  { accountId: 'plaid-account-id-2', date: '2026-06-08', amount: 15.49, ... },
]
```

Assert that account 1's `lastDeposit` is the `-2500.0` transaction, and account 2's `lastDeposit` is null.

---

## 5. `src/components/CustomAccountNameModal/CustomAccountNameModal.test.tsx`

Uses `render`, `userEvent`, `vi.mock`. No MSW.

### Mocks

```ts
vi.mock('../../../services/plaidService', () => ({ setAccountName: vi.fn() }))
vi.mock('../../../contexts/NotificationContext', () => ({ useNotify: vi.fn() }))
```

### Helper

Render helper that opens the modal with controlled props.

### Test cases

```
describe('CustomAccountNameModal')

  describe('when visible is true')
    it('renders the dialog with title "Custom Account Name"')
    it('prefills input with currentCustomName when set')
    it('prefills input with "institutionName - Subtype" when customName is null and subtype exists')
    it('prefills input with institutionName alone when customName is null and subtype is null')
    it('capitalizes the first letter of subtype in the prefill')

  describe('Save button')
    it('is disabled when input is empty')
    it('is enabled when input has text')
    it('is disabled while saving')
    it('calls setAccountName with accountId and trimmed input value on click')
    it('calls onHide and onSuccess on successful save')
    it('shows success toast with the new custom name on successful save')
    it('shows "Account not found" toast on 404')
    it('shows "Error saving account name, please try again" toast on 403')
    it('shows "Error saving account name, please try again" toast on 500')
    it('keeps modal open on error')
    it('re-enables Save button on error')

  describe('Cancel button')
    it('calls onHide on click')
    it('is disabled while saving')

  describe('when currentCustomName changes while open')
    it('resets input value to the new currentCustomName')
```

**Error simulation:** mock `setAccountName` to reject with `{ status: 404 }`, `{ status: 403 }`, `{ status: 500 }` in respective tests.

---

## 6. `src/components/CustomAccountNameButton/CustomAccountNameButton.test.tsx`

Uses `render`, `userEvent`, `vi.mock`.

### Mocks

Mock `CustomAccountNameModal` as a lightweight stub that records calls:
```ts
vi.mock('../CustomAccountNameModal/CustomAccountNameModal', () => ({
  default: vi.fn(({ visible, onHide }) => (
    visible ? <div data-testid="mock-modal"><button onClick={onHide}>close</button></div> : null
  ))
}))
```

### Test cases

```
describe('CustomAccountNameButton')

  describe('when currentCustomName is null')
    it('renders button with label "Add Name"')

  describe('when currentCustomName is set')
    it('renders button with label "Edit Name"')

  describe('modal interaction')
    it('opens the modal when button is clicked')
    it('closes the modal when onHide is called from the modal')
    it('passes all props to CustomAccountNameModal')
```

---

## 7. `src/components/QuickAccountOverview/QuickAccountOverview.test.tsx`

Uses `render`, `userEvent`, `vi.mock`. No MSW.

### Mocks

```ts
vi.mock('../../hooks/useQuickAccountOverview', () => ({ useQuickAccountOverview: vi.fn() }))
vi.mock('../../contexts/AuthContext', () => ({ useAuth: vi.fn() }))
vi.mock('../CustomAccountNameButton/CustomAccountNameButton', () => ({
  default: vi.fn(() => <button>Mock Name Button</button>)
}))
```

### Shared mock data

```ts
const mockAccount1: iAccountWithTransactions = {
  accountId: 'plaid-account-id-1',
  institutionName: 'Chase',
  subtype: 'checking',
  customName: null,
  currentBalance: 1234.56,
  availableBalance: 1100.00,
  isoCurrencyCode: 'USD',
  name: 'Checking',
  type: 'depository',
  transactions: [
    { accountId: 'plaid-account-id-1', date: '2026-06-10', name: 'Starbucks', amount: 5.75, isoCurrencyCode: 'USD', category: [] },
    { accountId: 'plaid-account-id-1', date: '2026-06-05', name: 'Paycheck', amount: -2500.00, isoCurrencyCode: 'USD', category: [] },
  ],
  lastDeposit: { accountId: 'plaid-account-id-1', date: '2026-06-05', name: 'Paycheck', amount: -2500.00, isoCurrencyCode: 'USD', category: [] }
}
```

### Test cases

```
describe('QuickAccountOverview')

  describe('auth loading state')
    it('renders Skeleton when auth is loading')
    it('does not render accordion when auth is loading')

  describe('loading state')
    it('renders ProgressSpinner when status is loading')

  describe('error state')
    it('renders retry button when status is error')
    it('clicking retry calls retry()')

  describe('success state — no accounts')
    it('renders "No linked accounts" message')

  describe('success state — with accounts')
    it('renders an accordion with one tab per account')
    it('formats accordion header as "institutionName - Subtype" with capitalized subtype')
    it('formats accordion header as institutionName alone when subtype is null')
    it('shows account balance formatted as currency')
    it('shows last deposit amount formatted as currency')
    it('shows -- when lastDeposit is null')
    it('renders CustomAccountNameButton for each account')
    it('shows customName text when customName is set')
    it('does not show customName text when customName is null')
    it('shows debit amount in red with leading dash')
    it('shows credit amount in green without leading dash')
    it('shows "No recent transactions" when account has no transactions')
    it('renders Detailed View link for each account')
    it('all panels are closed by default')
    it('opening one panel closes the previously open one')
```

**Note on transaction count:** since CSS-based responsive counts (3 mobile / 5 desktop) depend on `window.innerWidth` which jsdom defaults to 0, assert against the mobile count (3) in tests, or mock `window.innerWidth` to 1024 when testing the desktop slice. Document this in test setup comments.

---

## MSW handler additions to `defaultHandlers`

Add `handlers.plaid.setAccountName.success` to the `defaultHandlers` array in `handlers.ts`.
