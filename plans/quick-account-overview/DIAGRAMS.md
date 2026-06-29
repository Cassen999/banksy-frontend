# Diagrams — Quick Account Overview

## 1. Component Hierarchy

```
HomepagePage
└── <section.dashboard__accounts>
    └── QuickAccountOverview
        ├── [auth loading / no user] → <Skeleton />
        ├── [status: loading]        → <ProgressSpinner /> (overlay)
        ├── [status: error]          → Retry button (overlay)
        ├── [success, no accounts]   → "No linked accounts"
        └── [success, with accounts] → <Accordion>
            └── <AccordionTab> × N (one per account)
                ├── header: "institutionName - Subtype" (or just institutionName)
                └── panel:
                    ├── Top Section
                    │   ├── Bank: institutionName
                    │   ├── Account Name: <CustomAccountNameButton>
                    │   │   ├── <Button label="Add Name" | "Edit Name">
                    │   │   └── <CustomAccountNameModal>
                    │   │       ├── <Dialog header="Custom Account Name">
                    │   │       │   ├── <InputText> (prefilled)
                    │   │       │   └── footer: [Save] [Cancel]
                    │   ├── Last Deposit: $X.XX (or --)
                    │   └── Balance: $X.XX (or --)
                    └── Bottom Section
                        ├── "Recent Transactions" heading
                        ├── [no transactions] → "No recent transactions"
                        └── [transactions] → rows (3 mobile / 5 desktop)
                            ├── left: MM/DD/YYYY date
                            └── right: -$X.XX (red/debit) | $X.XX (green/credit)
                        └── "Detailed View" link (href="#", placeholder)
```

---

## 2. Data Flow

```
GET /api/balance ─────────────────────────────────────┐
                                                       ↓
                                             useQuickAccountOverview
GET /api/transactions?days=30 ────────────────────────┘
      ↓ via fetchBalance()                 ↓ via fetchTransactions(30)
      (balanceService)                     (transactionService)

rawAccounts: iAccount[]     rawTransactions: iTransaction[]
        └──────────────────────────────────┘
                       useMemo
                          ↓
          accounts: iAccountWithTransactions[]
          (per account: transactions filtered + sorted, lastDeposit found)
                          ↓
               QuickAccountOverview (props-free)
                     renders accordion

Name save flow:
CustomAccountNameModal
  → setAccountName(accountId, name)   ← plaidService (PUT /api/plaid/account/:id/name)
    ↓ on success
  onSuccess(newName)
    ↓
  QuickAccountOverview.onSuccess
    → refetchBalance()                ← useQuickAccountOverview (balance-only, silent)
      → fetchBalance()                ← balanceService
        ↓ on success
      rawAccounts updated
        ↓
      accounts re-derived via useMemo (customName now reflects saved value)
```

---

## 3. Hook State Machine — `useQuickAccountOverview`

```
                    ┌─────────────────────────────┐
                    │  user is null               │
               ┌────┤  status: 'idle'             │
               │    │  accounts: []               │
               │    └─────────────────────────────┘
               │
  user becomes │ non-null
               ↓
         ┌──────────────────────────────────────┐
         │  internalStatus: 'idle'              │
         │  status: 'loading'                   │  ← initial load
         │  Promise.all([fetchBalance(),        │
         │              fetchTransactions(30)]) │
         └──────────┬──────────────┬────────────┘
                    │              │
              success             error
                    │              │
                    ↓              ↓
    ┌───────────────────┐   ┌───────────────────┐
    │ internalStatus:   │   │ internalStatus:   │
    │ 'success'         │   │ 'error'           │
    │ status: 'success' │   │ status: 'error'   │
    │ accounts derived  │   │ toast fired       │
    └──────┬────────────┘   └──────┬────────────┘
           │                       │
           │ refetchBalance()      │ retry()
           ↓                       ↓
    ┌──────────────────┐    ┌──────────────────┐
    │ balance-only     │    │ internalStatus:  │
    │ fetch (silent)   │    │ 'idle'           │
    │ status unchanged │    │ status: 'loading'│
    └──────────────────┘    │ (both fetches)   │
                            └──────────────────┘
```

---

## 4. Service Layer

```
src/services/
  balanceService.ts
    fetchBalance()
      → GET /api/balance
      → returns iBalanceResponse
      → throws { status, message } on non-2xx

  transactionService.ts
    fetchTransactions(days?)
      → GET /api/transactions?days={days}
      → returns iTransactionsResponse
      → throws { status, message } on non-2xx

  plaidService.ts  (additions only)
    setAccountName(plaidAccountId, customName)
      → PUT /api/plaid/account/{plaidAccountId}/name
      → body: { customName }
      → returns void
      → throws { status, message } on 404 / 403 / 500
```

---

## 5. Mock Handler Structure (additions)

```
handlers.plaid.setAccountName
  .success     → PUT /api/plaid/account/:plaidAccountId/name → 200 empty
  .notFound    → 404
  .forbidden   → 403
  .serverError → 500

Updated handlers.balance.success  → returns [mockAccount1, mockAccount2]
Updated handlers.transactions.success → returns [mockTxn1 (acct1 debit),
                                                  mockTxn2 (acct1 credit/deposit),
                                                  mockTxn3 (acct2 debit)]

Updated mockAccount fixture: + accountId, institutionName, customName, isoCurrencyCode; - currency
Updated mockTransaction fixture: + accountId, isoCurrencyCode; - currency
```

---

## 6. Type Relationships

```
iBalanceResponse
  accounts: iAccount[]
    accountId: string          ← used to join with iTransaction.accountId
    institutionName: string    ← shown in header and pre-fill
    subtype: string | null     ← shown in header and pre-fill
    currentBalance: number | null
    customName: string | null  ← drives Add Name vs Edit Name label
    isoCurrencyCode: string | null
  relinkRequired: iRelinkSignal[]

iTransactionsResponse
  transactions: iTransaction[]
    accountId: string          ← join key
    date: string               ← sort key (desc), formatted MM/DD/YYYY
    amount: number             ← positive=debit(red), negative=credit(green)
    isoCurrencyCode: string | null

iAccountWithTransactions extends iAccount
  transactions: iTransaction[] ← filtered by accountId, sorted date desc
  lastDeposit: iTransaction | null ← first where amount < 0

iSetAccountNameRequest
  customName: string           ← PUT body
```

---

## 7. Amount Display Convention

| Plaid `amount` | Direction | Display | Color token |
|---|---|---|---|
| `> 0` | Debit (money out) | `-$X.XX` | `var(--red-500)` (PrimeReact danger) |
| `< 0` | Credit (money in) | `$X.XX` (abs value) | `var(--green-500)` (PrimeReact success) |
| `=== 0` | Zero | `$0.00` | default/neutral |

Last Deposit row: shows the absolute dollar value (drop the negative sign) because the label "Last Deposit" already conveys direction.
