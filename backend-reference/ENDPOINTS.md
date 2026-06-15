# Endpoints

All `/api/**` endpoints require authentication (Google OAuth2 session cookie). Unauthenticated requests receive `401`. The `/api/dev/**` namespace is exempt.

---

## Auth

### `GET /api/auth/me`

Returns the current user's profile.

**Response `200`**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "firstName": "Jane",
  "lastName": "Doe",
  "username": "janedoe"
}
```

---

## Balance

### `GET /api/balance`

Fetches current account balances from Plaid for all linked items. Skips non-HEALTHY items and includes them in `relinkRequired` instead.

**Response `200`**
```json
{
  "accounts": [
    {
      "accountId": "plaid-account-id-string",
      "name": "Checking",
      "type": "depository",
      "subtype": "checking",
      "currentBalance": 1234.56,
      "availableBalance": 1200.00,
      "isoCurrencyCode": "USD"
    }
  ],
  "relinkRequired": [
    {
      "plaidItemId": "uuid",
      "institutionName": "Chase",
      "errorType": "LOGIN_REQUIRED",
      "canRelink": true,
      "ownerName": null,
      "message": "Chase needs to be re-linked."
    }
  ]
}
```

---

## Transactions

### `GET /api/transactions?days={n}`

Fetches transactions for the last `n` days (default 30). Hidden accounts are excluded. Non-HEALTHY items appear in `relinkRequired`.

**Query parameters**

| Name | Type | Default | Description |
|---|---|---|---|
| `days` | integer | `30` | Number of days of history to fetch |

**Response `200`**
```json
{
  "transactions": [
    {
      "date": "2026-06-10",
      "name": "Starbucks",
      "amount": 5.75,
      "isoCurrencyCode": "USD",
      "category": ["Food and Drink", "Coffee Shop"]
    }
  ],
  "total": 42,
  "relinkRequired": []
}
```

---

## Recurring Transactions

### `GET /api/recurring?accountId={id}`

Fetches recurring transaction streams from Plaid. Without `accountId` aggregates all linked items; with `accountId` filters to that account.

**Query parameters**

| Name | Type | Default | Description |
|---|---|---|---|
| `accountId` | UUID | _(none)_ | Optional. Plaid account ID to filter by. |

**Response `200`**
```json
{
  "inflowStreams": [...],
  "outflowStreams": [
    {
      "accountId": "plaid-account-id-string",
      "streamId": "stream-id",
      "merchantName": "Netflix",
      "description": "NETFLIX.COM",
      "frequency": "MONTHLY",
      "firstDate": "2025-01-15",
      "lastDate": "2026-05-15",
      "predictedNextDate": "2026-06-15",
      "averageAmount": { "amount": 15.49, "isoCurrencyCode": "USD" },
      "lastAmount": { "amount": 15.49, "isoCurrencyCode": "USD" },
      "isActive": true,
      "personalFinanceCategory": { "primary": "ENTERTAINMENT", "detailed": "ENTERTAINMENT_TV_AND_MOVIES" },
      "status": "MATURE"
    }
  ],
  "relinkRequired": []
}
```

**Error responses**

| Code | Condition |
|---|---|
| `404` | `accountId` not found in the database |
| `403` | Calling user is not linked to the account's item |
| `500` | Plaid API error or other unhandled exception |

---

## Plaid Link

### `GET /api/plaid/link-token`

Creates a new Plaid Link token to initiate the account-linking flow.

**Response `200`**
```json
{ "linkToken": "link-sandbox-..." }
```

---

### `GET /api/plaid/link-token/refresh/{itemId}`

Creates an update-mode link token for re-authenticating an existing item (credential refresh).

**Path parameters:** `itemId` — UUID of the `PlaidItem`.

**Response `200`**
```json
{ "linkToken": "link-sandbox-..." }
```

---

### `GET /api/plaid/link-token/full-relink/{itemId}`

Creates a fresh link token for fully re-linking an item whose token is irrecoverable.

**Path parameters:** `itemId` — UUID of the `PlaidItem`.

**Response `200`**
```json
{ "linkToken": "link-sandbox-..." }
```

---

### `GET /api/plaid/status`

Returns relink status for all of the current user's linked items at login time.

**Response `200`**
```json
{
  "relinkRequired": []
}
```

---

### `POST /api/plaid/exchange`

Exchanges a Plaid public token for a stored access token after the Link flow completes. If `expiredItemId` is present, replaces the expired item and migrates all shared users.

**Request body**
```json
{
  "publicToken": "public-sandbox-...",
  "expiredItemId": "uuid-or-null"
}
```

**Response `200`** — empty body on success.

---

### `POST /api/plaid/share`

Shares an existing bank connection with another user by email.

**Request body**
```json
{
  "plaidItemId": "uuid",
  "targetEmail": "friend@example.com"
}
```

**Response `200`** — empty body on success.

---

## Remove Bank

### `PUT /api/plaid/account/{plaidAccountId}/hide`

Soft-hides a single account. The account remains in Plaid but is excluded from balance and transaction responses. Any linked user (owner or shared) may call this.

**Path parameters:** `plaidAccountId` — UUID of the `PlaidAccount` record.

**Response `200`** — empty body on success.

---

### `DELETE /api/plaid/item/{plaidItemId}`

Fully removes a bank connection: revokes the access token at Plaid, then hard-deletes the item and all its accounts from the database. Any linked user (owner or shared) may call this. All previously linked users are notified.

**Path parameters:** `plaidItemId` — UUID of the `PlaidItem` record.

**Response `200`** — empty body on success.

---

## Monthly Glance

### `GET /api/monthly-glance`

Returns daily spending totals for the current calendar month, aggregated across all linked bank accounts. Suitable for rendering a line graph on the dashboard.

**Filtering applied (in order):**
1. Globally hidden accounts (excluded from all responses)
2. Per-user excluded accounts (`user_excluded_accounts` table)
3. Default rejected categories: `RENT_AND_UTILITIES`, `INCOME`, `TRANSFER_IN`, `LOAN_DISBURSEMENTS`
4. Per-user rejected categories (`user_rejected_categories` table)

Transactions with a null `personalFinanceCategory` are included. Refunds (Plaid negative amounts) net against the day's total. Every day from the 1st of the month through today appears in the response, including zero-spend days.

**Response `200`**
```json
{
  "dailyTotals": [
    { "transactionDate": "2026-06-01", "total": 0.0 },
    { "transactionDate": "2026-06-02", "total": 42.50 },
    { "transactionDate": "2026-06-12", "total": 18.75 }
  ],
  "relinkRequired": []
}
```

`transactionDate` is always an ISO-8601 date string (`YYYY-MM-DD`).

---

## Categories

### `GET /api/categories`

Returns all 146 Plaid PFCv2 taxonomy entries (18 primary + 128 detailed). Used by the frontend category-search UI so users can add entries to their personal rejected-categories list.

**Response `200`**
```json
{
  "categories": [
    { "category": "FOOD_AND_DRINK", "type": "PRIMARY", "primaryCategory": null },
    { "category": "FOOD_AND_DRINK_COFFEE", "type": "DETAILED", "primaryCategory": "FOOD_AND_DRINK" }
  ]
}
```

---

## Dev (unauthenticated)

### `GET /api/dev/plaid/environment`

Returns the currently active Plaid environment.

**Response `200`**
```json
{ "environment": "sandbox" }
```

---

### `POST /api/dev/plaid/environment/toggle`

Toggles the active Plaid environment between `sandbox` and `production`. Persists the change to the database and rebuilds the Plaid client.

**Response `200`**
```json
{ "environment": "production" }
```
