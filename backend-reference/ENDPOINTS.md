# Banksy API — Endpoint Reference

All types below are written in TypeScript-style notation. Convert directly to
`.ts` interface/type declarations.

---

## Global Setup

Every request to `/api/**` must include:

```
withCredentials: true   // sends the session cookie
baseURL: import.meta.env.VITE_API_BASE_URL  // e.g. http://localhost:8080
```

A `401` response on any protected endpoint means the session has expired.
Redirect the user to the login page.

**Public endpoints (no session required):**
- `/login`
- `/oauth2/**`
- `/error`
- `POST /api/auth/logout`

All other `/api/**` endpoints require an active session.

---

## Shared Types

These types are referenced by multiple endpoints. Define them once.

```
RelinkErrorType = "LOGIN_REQUIRED" | "INVALID_TOKEN"

RelinkSignal {
  plaidItemId:     string          // our internal UUID for the PlaidItem row
  institutionName: string
  errorType:       RelinkErrorType
  canRelink:       boolean         // true only if this user is the bank's owner
  ownerName:       string | null   // null when canRelink is true
  message:         string          // human-readable, safe to display directly
}
```

---

---

## Auth

---

### GET /api/auth/me

**Description:** Returns the current user's profile. Call this on app load to
check whether the user has an active session. Returns `401` if not logged in.

**Auth required:** No session needed to call, but returns `401` if unauthenticated.
Use this as your "am I logged in?" check.

**Request**

```
No body. No params. No path variables.
```

**Axios config**

```
method:          GET
url:             /api/auth/me
withCredentials: true
```

**Response — 200 OK**

```
{
  id:        string   // UUID
  email:     string
  firstName: string
  lastName:  string
  username:  string
}
```

**Response — 401**

No body. Redirect to login.

**Response — 500**

No body. Show a generic error.

---

### POST /api/auth/logout

**Description:** Invalidates the current session. This endpoint is public — it
can be called even without a valid session. After success, clear any local user
state and redirect to the login page.

**Auth required:** No (permitted without a session).

**Request**

```
No body. No params. No path variables.
```

**Axios config**

```
method:          POST
url:             /api/auth/logout
withCredentials: true
```

**Response — 200 OK**

```
{
  loggedOut: true
}
```

---

---

## Balance

---

### GET /api/balance

**Description:** Returns balances for all of the user's linked bank accounts
that are HEALTHY and not hidden. Also returns a `relinkRequired` list for any
linked banks that need attention (expired auth, revoked token, etc.).

`relinkRequired` is always present in the response — an empty array means all
banks are healthy. A non-empty array means at least one bank needs the user to
take action before its data can be fetched.

Hidden accounts (soft-hidden via the hide endpoint) are excluded from `accounts`
automatically.

**Auth required:** Yes.

**Request**

```
No body. No params. No path variables.
```

**Axios config**

```
method:          GET
url:             /api/balance
withCredentials: true
```

**Response — 200 OK**

```
{
  accounts: Account[]
  relinkRequired: RelinkSignal[]
}

Account {
  name:             string
  type:             string | null   // e.g. "depository", "credit", "investment"
  subtype:          string | null   // e.g. "checking", "savings", "credit card"
  currentBalance:   number | null   // in account's native currency
  availableBalance: number | null   // null for credit / investment accounts
  currency:         string | null   // ISO 4217 code, e.g. "USD"
}
```

**Response — 401**

No body. Redirect to login.

**Response — 500**

No body. Show a generic error.

---

---

## Transactions

---

### GET /api/transactions

**Description:** Returns transactions for all of the user's HEALTHY, non-hidden
linked accounts for the past N days. Also returns a `relinkRequired` list using
the same pattern as the balance endpoint.

The `days` parameter controls the lookback window. Defaults to 30 if omitted.
Transactions are not sorted by the backend — sort on the frontend if needed.

**Auth required:** Yes.

**Request**

```
Query params:
  days: number   // optional, default 30. How many days back to fetch.
```

**Axios config**

```
method:          GET
url:             /api/transactions
withCredentials: true
params: {
  days: number   // optional
}
```

**Response — 200 OK**

```
{
  transactions:   Transaction[]
  total:          number          // count of transactions returned
  relinkRequired: RelinkSignal[]
}

Transaction {
  date:     string      // ISO date string, e.g. "2025-05-01"  (YYYY-MM-DD)
  name:     string      // merchant or description
  amount:   number      // positive = money left account (debit), negative = money entered (credit/refund)
  currency: string | null  // ISO 4217 code, e.g. "USD"
  category: string[]    // Plaid category hierarchy, e.g. ["Food and Drink", "Restaurants"]
}
```

**Response — 401**

No body. Redirect to login.

**Response — 500**

No body. Show a generic error.

---

---

## Plaid Link

---

### GET /api/plaid/link-token

**Description:** Generates a Plaid Link token to start a new bank connection
flow. Pass the returned `link_token` to the Plaid Link SDK to open the Link
modal. Use this only for first-time connections — for re-linking an existing
bank, use the refresh or full-relink endpoints instead.

**Auth required:** Yes.

**Request**

```
No body. No params. No path variables.
```

**Axios config**

```
method:          GET
url:             /api/plaid/link-token
withCredentials: true
```

**Response — 200 OK**

```
{
  link_token: string
}
```

**Response — 401**

No body. Redirect to login.

**Response — 500**

No body. Show a generic error.

---

### GET /api/plaid/link-token/refresh/:itemId

**Description:** Generates an update-mode Plaid Link token for a bank whose
session has expired (`errorType: "LOGIN_REQUIRED"`). Pass the returned
`link_token` to the Plaid Link SDK. The user re-authenticates with their bank
without needing to select an institution again.

Only the bank's owner can call this. A shared user (`canRelink: false`) cannot
refresh — show them the `message` from the `RelinkSignal` instead.

**Auth required:** Yes (owner only — returns `403` for shared users).

**Request**

```
Path variables:
  itemId: string   // the plaidItemId from RelinkSignal — our internal UUID
```

**Axios config**

```
method:          GET
url:             /api/plaid/link-token/refresh/:itemId
withCredentials: true
```

**Response — 200 OK**

```
{
  link_token: string
}
```

**Response — 403**

```
{
  error: string
}
```

**Response — 401**

No body. Redirect to login.

**Response — 500**

```
{
  error: string
}
```

---

### GET /api/plaid/link-token/full-relink/:itemId

**Description:** Generates a fresh Plaid Link token for a bank whose connection
has been fully revoked (`errorType: "INVALID_TOKEN"`). The user must select their
institution and authenticate from scratch — this is not an update-mode flow.

Only the bank's owner can call this. A shared user (`canRelink: false`) cannot
relink — show them the `message` from the `RelinkSignal` instead.

**Auth required:** Yes (owner only — returns `403` for shared users).

**Request**

```
Path variables:
  itemId: string   // the plaidItemId from RelinkSignal — our internal UUID
```

**Axios config**

```
method:          GET
url:             /api/plaid/link-token/full-relink/:itemId
withCredentials: true
```

**Response — 200 OK**

```
{
  link_token: string
}
```

**Response — 403**

```
{
  error: string
}
```

**Response — 401**

No body. Redirect to login.

**Response — 500**

```
{
  error: string
}
```

---

### GET /api/plaid/status

**Description:** Returns the relink status for all of the user's linked banks.
Call this at login time (after `/api/auth/me` confirms the session) to check
whether any banks need attention before the user navigates to balance or
transactions. The response shape is the same `relinkRequired` list used by
balance and transactions.

**Auth required:** Yes.

**Request**

```
No body. No params. No path variables.
```

**Axios config**

```
method:          GET
url:             /api/plaid/status
withCredentials: true
```

**Response — 200 OK**

```
{
  relinkRequired: RelinkSignal[]
}
```

**Response — 401**

No body. Redirect to login.

**Response — 500**

No body. Show a generic error.

---

### POST /api/plaid/exchange

**Description:** Exchanges a Plaid `publicToken` for a stored access token after
the user completes the Plaid Link flow. The Plaid Link SDK returns the
`publicToken` (and institution info) in its `onSuccess` callback — pass all of
it here.

If the user just re-linked an expired item, also pass `expiredItemId`. The backend
will migrate all shared users from the old item to the newly linked one and delete
the old item. If this is a brand-new connection, omit `expiredItemId`.

After success, refresh balance and transaction data.

**Auth required:** Yes.

**Request**

```
Body (JSON):
{
  publicToken:     string          // from Plaid Link onSuccess callback
  institutionId:   string          // from Plaid Link onSuccess metadata.institution.id
  institutionName: string          // from Plaid Link onSuccess metadata.institution.name
  expiredItemId:   string | null   // our internal plaidItemId UUID — only when re-linking an expired item
}
```

**Axios config**

```
method:          POST
url:             /api/plaid/exchange
withCredentials: true
headers: {
  Content-Type: application/json
}
data: {
  publicToken:     string
  institutionId:   string
  institutionName: string
  expiredItemId:   string | undefined
}
```

**Response — 200 OK**

```
{
  status:  "ok"
  message: "Plaid authentication successful"
}
```

**Response — 401**

No body. Redirect to login.

**Response — 500**

No body. Show a generic error.

---

### POST /api/plaid/share

**Description:** Shares one of the current user's bank connections with another
user by email. The target user must already have an account in the system. Only
the bank's owner can share it — shared users cannot re-share.

**Auth required:** Yes (owner only — returns `403` for shared users).

**Request**

```
Body (JSON):
{
  plaidItemId:    string   // our internal UUID of the PlaidItem to share
  shareWithEmail: string   // email address of the user to share with
}
```

**Axios config**

```
method:          POST
url:             /api/plaid/share
withCredentials: true
headers: {
  Content-Type: application/json
}
data: {
  plaidItemId:    string
  shareWithEmail: string
}
```

**Response — 200 OK**

```
{
  status: "ok"
}
```

**Response — 400**

```
{
  error: string   // e.g. user not found, already shared
}
```

**Response — 403**

```
{
  error: string
}
```

**Response — 401**

No body. Redirect to login.

**Response — 500**

No body. Show a generic error.

---

---

## Remove Bank

---

### PUT /api/plaid/account/:plaidAccountId/hide

**Description:** Soft-hides a single account. Hidden accounts are excluded from
all balance and transaction responses without removing them from Plaid. The
operation is silent to Plaid — no API call is made.

Any linked user (owner or shared) can hide an account. The hide applies system-
wide — if one user hides an account, it is hidden for all users who share that
bank connection.

There is no unhide endpoint yet. Hiding is currently permanent.

**Auth required:** Yes.

**Request**

```
Path variables:
  plaidAccountId: string   // our internal UUID of the PlaidAccount row
No body.
```

**Axios config**

```
method:          PUT
url:             /api/plaid/account/:plaidAccountId/hide
withCredentials: true
```

**Response — 200 OK**

```
{
  status: "ok"
}
```

**Response — 403**

```
{
  error: string
}
```

**Response — 401**

No body. Redirect to login.

**Response — 500**

```
{
  error: string
}
```

---

### DELETE /api/plaid/item/:plaidItemId

**Description:** Fully removes a bank connection. This operation:
1. Revokes the access token at Plaid (skipped automatically if the item's status
   is `INVALID_TOKEN` — the token is already gone from Plaid's side)
2. Hard-deletes the `PlaidItem` and all its `PlaidAccount` rows from the database
3. Removes the bank for every user who had it shared — all linked users lose access

Any linked user (owner or shared) can trigger this deletion.

After the delete, the backend sends an in-app notification to all previously linked
users. The operation is not reversible — the user will need to re-link the bank
from scratch if they want it back.

**Auth required:** Yes.

**Request**

```
Path variables:
  plaidItemId: string   // our internal UUID of the PlaidItem row
No body.
```

**Axios config**

```
method:          DELETE
url:             /api/plaid/item/:plaidItemId
withCredentials: true
```

**Response — 200 OK**

```
{
  status: "ok"
}
```

**Response — 403**

```
{
  error: string
}
```

**Response — 401**

No body. Redirect to login.

**Response — 500**

```
{
  error: string
}
```

---

---

## Quick Reference

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/auth/me` | Public | Get current user profile / check session |
| `POST` | `/api/auth/logout` | Public | Invalidate session |
| `GET` | `/api/balance` | Required | Get account balances + relink signals |
| `GET` | `/api/transactions` | Required | Get transactions (optional `?days=N`) + relink signals |
| `GET` | `/api/plaid/status` | Required | Get relink signals at login |
| `GET` | `/api/plaid/link-token` | Required | Get token to open new Plaid Link |
| `GET` | `/api/plaid/link-token/refresh/:itemId` | Required (owner only) | Get token for update-mode re-auth |
| `GET` | `/api/plaid/link-token/full-relink/:itemId` | Required (owner only) | Get token for full re-link |
| `POST` | `/api/plaid/exchange` | Required | Exchange public token after Link completes |
| `POST` | `/api/plaid/share` | Required (owner only) | Share a bank with another user |
| `PUT` | `/api/plaid/account/:plaidAccountId/hide` | Required | Soft-hide one account |
| `DELETE` | `/api/plaid/item/:plaidItemId` | Required | Fully remove a bank connection |
