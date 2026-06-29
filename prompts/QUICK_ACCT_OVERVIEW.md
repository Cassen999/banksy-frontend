⏺ Feature: Quick Account Overview
  
  Summary

  Display all of the authenticated user's linked bank accounts on the dashboard homepage. Each account is shown as an
  accordion item (one panel open at a time). Each panel shows balance info, last deposit, recent transactions colored by
  direction, and a non-functional placeholder link for a future detailed view. Users can set or edit a custom display
  name per account via a reusable modal component.

  APIs Used

  - GET /api/balance — returns all linked accounts. Each account includes customName: string | null (from
  user_account_names table; null if not yet set). This is the source of truth for account display names — no separate
  fetch needed.
  - GET /api/transactions?days=30 — returns all transactions across all accounts for the last 30 days. Each transaction
  includes accountId for per-account grouping.
  - PUT /api/plaid/account/{plaidAccountId}/name — sets or replaces a custom display name (upsert). Request body: { 
  "customName": "string" }. Response: 200 empty body. Errors: 404, 403, 500.

  Location on Dashboard

  QuickAccountOverview renders inside the existing <section className="dashboard__accounts"> placeholder in
  HomepagePage.tsx. On mobile: bottom of page. On desktop: right-side column.

  ---
  Accordion Behavior
  
  - PrimeReact Accordion with activeIndex controlled — single panel open at a time (not multiple)
  - Default: all panels closed on load

  Accordion Header

  Format: [institutionName] - [subtype]
  Use the subtype field (e.g. "checking", "savings") — capitalize first letter. If subtype is null, display
  institutionName alone.

  ---
  Accordion Panel — Top Section

  Four labeled rows:

  1. Bank: institutionName
  2. Account Name:
    - CustomAccountNameButton is always present
    - If customName !== null: display the custom name as text alongside the button; button label is "Edit Name"
    - If customName === null: display only the button; button label is "Add Name"
  3. Last Deposit: Most recent transaction for this account where amount < 0 (Plaid convention: negative = money in),
  formatted as $X.XX. Display -- if none found.
  4. Balance: currentBalance formatted as $X.XX

  Accordion Panel — Bottom Section

  Title: "Recent Transactions" — centered

  Transaction count: 3 on mobile, 5 on desktop (sorted date descending)

  Transaction row — 2 columns:
  - Left: date formatted as MM/DD/YYYY
  - Right: amount with direction and PrimeReact semantic color:
    - Positive Plaid amount (money out / debit): display as -$X.XX in PrimeReact error/danger red
    - Negative Plaid amount (money in / credit): display as $X.XX in PrimeReact success green 
    - The $ sign takes the same color as the amount

  Empty state: Display "No recent transactions" centered in place of the list.

  Placeholder link: Bottom-right, labeled "Detailed View". Non-functional (href="#"). Will be wired to a per-account
  page in a future prompt.

  ---
  CustomAccountNameButton Component

  A reusable, standalone PrimeReact Button. Lives in its own folder in src/components/. Currently used in
  QuickAccountOverview but designed for use anywhere.

  Props:
  - accountId: string
  - institutionName: string
  - subtype: string | null
  - currentCustomName: string | null
  - onSuccess: (newName: string) => void — called on successful save so the parent can update local state optimistically

  Behavior: Label renders as "Add Name" when currentCustomName is null, "Edit Name" when set. When clicked, opens
  CustomAccountNameModal passing all props through.

  ---
  CustomAccountNameModal Component

  A PrimeReact Dialog.

  Props:
  - visible: boolean
  - onHide: () => void
  - accountId: string
  - institutionName: string
  - subtype: string | null
  - currentCustomName: string | null
  - onSuccess: (newName: string) => void
  
  Title: "Custom Account Name"

  Body: Single text input:
  - Prefilled with currentCustomName if set; otherwise prefilled with [institutionName] - [subtype] (or just
  institutionName if subtype is null)
  - No character validation or restrictions

  Footer — Save (primary button):
  - Enabled by default
  - Disabled when text input is empty
  - Disabled while endpoint is loading
  - On success: close modal, call onSuccess(newName), show success toast: "Account successfully named [customName]"
  - On failure: re-enable Save button, keep modal open, show error toast: 
    - 404 → "Account not found"
    - 403 → "Error saving account name, please try again"
    - 500 → "Error saving account name, please try again"

  Footer — Cancel (secondary button):
  - Enabled by default
  - Disabled while Save is loading
  - Closes modal, discards changes

  Close behavior: X button top-right, click outside modal, Cancel, successful save.

  ---
  Hook — useQuickAccountOverview (src/hooks/useQuickAccountOverview.ts)
  
  Single hook that composes both fetches. Follows the useScheduledDeposits pattern.

  Fetches:
  - GET /api/balance via fetchBalance()
  - GET /api/transactions?days=30 via fetchTransactions(30)

  Computed per account (via useMemo):
  - transactions: iTransaction[] — filtered to this account's accountId, sorted date descending
  - lastDeposit: iTransaction | null — most recent transaction for this account where amount < 0

  Return shape:
  {
    status: tStatus,
    accounts: iAccountWithTransactions[],
    retry: () => void,
    updateAccountName: (accountId: string, newName: string) => void
  }

  updateAccountName — optimistic local state update that sets customName on the matching account without re-fetching.

  Status: 'loading' while either fetch is in flight; 'error' if either fails; 'success' when both complete. Errors
  trigger a toast via useNotify. Cancels in-flight requests on unmount.

  ---
  Service Updates
  
  New: src/services/balanceService.ts
  - fetchBalance(): Promise<iBalanceResponse>

  New: src/services/transactionService.ts
  - fetchTransactions(days?: number): Promise<iTransactionsResponse>

  Updated: src/services/plaidService.ts
  - Add setAccountName(plaidAccountId: string, customName: string): Promise<void> — calls PUT 
  /api/plaid/account/{plaidAccountId}/name via apiClient, throws typed error on non-2xx

  ---
  New Types in src/types/types.ts

  - iAccount — accountId, name, type, subtype: string | null, currentBalance, availableBalance: number | null,
  isoCurrencyCode, institutionName, customName: string | null
  - iBalanceResponse — { accounts: iAccount[], relinkRequired: iRelinkSignal[] }
  - iTransaction — accountId, date, name, amount, isoCurrencyCode, category: string[]
  - iTransactionsResponse — { transactions: iTransaction[], total: number, relinkRequired: iRelinkSignal[] }
  - iAccountWithTransactions — extends iAccount with transactions: iTransaction[] and lastDeposit: iTransaction | null
  - iSetAccountNameRequest — { customName: string }

  ---
  Mock Handler Updates (src/mocks/handlers.ts)
  
  Fix stale fixtures to match current API spec:
  - mockAccount: add accountId: 'plaid-account-id-1', institutionName, customName: null; rename currency →
  isoCurrencyCode. Add a second mock account (accountId: 'plaid-account-id-2', savings) for multi-account test coverage.
  - mockTransaction: add accountId: 'plaid-account-id-1'; rename currency → isoCurrencyCode. Add a second transaction
  linked to 'plaid-account-id-2' and at least one with a negative amount to test Last Deposit logic.
  - Add handlers.plaid.setAccountName group: success (200 empty), notFound (404), forbidden (403), serverError (500)

  ---
  Complete File List

  ┌──────────────────────────────────────────────────────────────┬────────────────────────────────────┐
  │                               File                                │               Action               │
  ├───────────────────────────────────────────────────────────────────┼────────────────────────────────────┤
  │ src/types/types.ts                                                │ Updated — new types                │
  ├───────────────────────────────────────────────────────────────────┼────────────────────────────────────┤
  │ src/services/balanceService.ts                                          │ New                                │
  ├─────────────────────────────────────────────────────────────────────────┼────────────────────────────────────┤
  │ src/services/balanceService.test.ts                                     │ New                                │
  ├─────────────────────────────────────────────────────────────────────────┼────────────────────────────────────┤
  │ src/services/transactionService.ts                                      │ New                                │
  ├─────────────────────────────────────────────────────────────────────────┼────────────────────────────────────┤
  │ src/services/transactionService.test.ts                                 │ New                                │
  ├─────────────────────────────────────────────────────────────────────────┼────────────────────────────────────┤
  │ src/services/plaidService.ts                                            │ Updated — add setAccountName       │
  ├─────────────────────────────────────────────────────────────────────────┼────────────────────────────────────┤
  │ src/services/plaidService.test.ts                                       │ Updated — add setAccountName tests │
  ├─────────────────────────────────────────────────────────────────────────┼────────────────────────────────────┤
  │ src/hooks/useQuickAccountOverview.ts                                    │ New                                │
  ├─────────────────────────────────────────────────────────────────────────┼────────────────────────────────────┤
  │ src/hooks/useQuickAccountOverview.test.ts                               │ New                                 │
  ├─────────────────────────────────────────────────────────────────────────┼─────────────────────────────────────┤
  │ src/components/QuickAccountOverview/QuickAccountOverview.tsx            │ New                                 │
  ├─────────────────────────────────────────────────────────────────────────┼─────────────────────────────────────┤
  │ src/components/QuickAccountOverview/QuickAccountOverview.test.tsx       │ New                                 │
  ├─────────────────────────────────────────────────────────────────────────┼─────────────────────────────────────┤
  │ src/components/QuickAccountOverview/quickAccountOverview.scss           │ New                                 │
  ├─────────────────────────────────────────────────────────────────────────┼─────────────────────────────────────┤
  │ src/components/CustomAccountNameButton/CustomAccountNameButton.tsx      │ New                                 │
  ├─────────────────────────────────────────────────────────────────────────┼─────────────────────────────────────┤
  │ src/components/CustomAccountNameButton/CustomAccountNameButton.test.tsx │ New                                 │
  ├─────────────────────────────────────────────────────────────────────────┼─────────────────────────────────────┤
  │ src/components/CustomAccountNameButton/customAccountNameButton.scss     │ New                                 │
  ├─────────────────────────────────────────────────────────────────────────┼─────────────────────────────────────┤
  │ src/components/CustomAccountNameModal/CustomAccountNameModal.tsx        │ New                                 │
  ├─────────────────────────────────────────────────────────────────────────┼─────────────────────────────────────┤
  │ src/components/CustomAccountNameModal/CustomAccountNameModal.test.tsx   │ New                                 │
  ├─────────────────────────────────────────────────────────────────────────┼─────────────────────────────────────┤
  │ src/components/CustomAccountNameModal/customAccountNameModal.scss       │ New                                 │
  ├─────────────────────────────────────────────────────────────────────────┼─────────────────────────────────────┤
  │ src/components/Homepage/HomepagePage.tsx                                │ Updated                             │
  ├─────────────────────────────────────────────────────────────────────────┼─────────────────────────────────────┤
  │ src/mocks/handlers.ts                                                   │ Updated — fix fixtures, add handler │
  ├─────────────────────────────────────────────────────────────────────────┼─────────────────────────────────────┤
  │ src/styles/index.scss                                                   │ Updated — import new SCSS           │
  ├─────────────────────────────────────────────────────────────────────────┼─────────────────────────────────────┤
  │ _dev/ARCHITECTURE.md                                                    │ Updated                             │
  ├─────────────────────────────────────────────────────────────────────────┼─────────────────────────────────────┤
  │ _dev/COMPONENTS.md                                                      │ Updated                             │
  └─────────────────────────────────────────────────────────────────────────┴─────────────────────────────────────┘

  Out of Scope for This Prompt
  
  - "Detailed View" per-account page (link is a placeholder only)
  - DELETE /api/plaid/account/{plaidAccountId}/name (name removal)