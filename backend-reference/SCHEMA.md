# Database Schema

PostgreSQL database managed by Flyway. Migrations live in `src/main/resources/db/migration/`. Never modify an already-applied migration — add a new one instead.

---

## Tables

### `users`
*Migration: V1*

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | UUID | PK, default `gen_random_uuid()` | |
| `first_name` | VARCHAR(100) | NOT NULL | |
| `last_name` | VARCHAR(100) | NOT NULL | |
| `username` | VARCHAR(50) | NOT NULL, UNIQUE | |
| `email` | VARCHAR(255) | NOT NULL, UNIQUE | |
| `created_at` | TIMESTAMP | NOT NULL, default NOW() | |
| `updated_at` | TIMESTAMP | NOT NULL, default NOW() | |

---

### `oauth_identities`
*Migration: V1*

Links a `User` to a specific OAuth provider identity (e.g. Google). One user can have multiple identities.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | UUID | PK, default `gen_random_uuid()` | |
| `user_id` | UUID | NOT NULL, FK → `users(id)` ON DELETE CASCADE | |
| `provider` | VARCHAR(50) | NOT NULL | e.g. `"google"` |
| `provider_user_id` | VARCHAR(255) | NOT NULL | Provider's own user ID |
| `created_at` | TIMESTAMP | NOT NULL, default NOW() | |

**Unique constraint:** `(provider, provider_user_id)`

**Indexes:** `idx_oauth_identities_user_id` on `user_id`

---

### `plaid_items`
*Migrations: V1, V2*

A connected bank institution. Stores the AES-GCM-encrypted Plaid access token and current health status.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | UUID | PK, default `gen_random_uuid()` | |
| `access_token_enc` | TEXT | NOT NULL | AES-256-GCM encrypted Plaid access token |
| `item_id` | VARCHAR(255) | NOT NULL, UNIQUE | Plaid-assigned item ID |
| `institution_id` | VARCHAR(255) | NOT NULL | Plaid institution ID |
| `institution_name` | VARCHAR(255) | NOT NULL | Human-readable institution name |
| `transaction_cursor` | TEXT | nullable | Plaid transaction pagination cursor |
| `owner_user_id` | UUID | NOT NULL, FK → `users(id)` | *(added V2)* The user who originally linked this item |
| `status` | VARCHAR(20) | NOT NULL, default `'HEALTHY'` | *(added V2)* `HEALTHY`, `NEEDS_REAUTH`, or `INVALID_TOKEN` |
| `created_at` | TIMESTAMP | NOT NULL, default NOW() | |
| `updated_at` | TIMESTAMP | NOT NULL, default NOW() | |

**Indexes:** `idx_plaid_items_owner_user_id` on `owner_user_id`

---

### `plaid_accounts`
*Migrations: V1, V4*

An individual bank account within a `PlaidItem` (e.g. checking or savings).

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | UUID | PK, default `gen_random_uuid()` | |
| `plaid_item_id` | UUID | NOT NULL, FK → `plaid_items(id)` ON DELETE CASCADE | |
| `plaid_account_id` | VARCHAR(255) | NOT NULL, UNIQUE | Plaid-assigned account ID string |
| `name` | VARCHAR(255) | NOT NULL | |
| `official_name` | VARCHAR(255) | nullable | |
| `type` | VARCHAR(50) | NOT NULL | e.g. `depository`, `credit` |
| `subtype` | VARCHAR(50) | nullable | e.g. `checking`, `savings` |
| `mask` | VARCHAR(4) | nullable | Last 4 digits of account number |
| `hidden` | BOOLEAN | NOT NULL, default `false` | *(added V4)* Soft-hide flag; hidden accounts are excluded from all API responses |
| `created_at` | TIMESTAMP | NOT NULL, default NOW() | |

**Indexes:** `idx_plaid_accounts_item_id` on `plaid_item_id`

---

### `user_plaid_items`
*Migration: V1*

Many-to-many join table linking users to shared Plaid items.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `user_id` | UUID | NOT NULL, FK → `users(id)` ON DELETE CASCADE | |
| `plaid_item_id` | UUID | NOT NULL, FK → `plaid_items(id)` ON DELETE CASCADE | |
| `added_at` | TIMESTAMP | NOT NULL, default NOW() | |

**Primary key:** `(user_id, plaid_item_id)`

**Indexes:** `idx_user_plaid_items_user_id`, `idx_user_plaid_items_plaid_item_id`

---

### `notifications`
*Migration: V3*

In-app notifications for users, created after remove-bank operations.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | UUID | PK, default `gen_random_uuid()` | |
| `user_id` | UUID | NOT NULL, FK → `users(id)` ON DELETE CASCADE | |
| `message` | TEXT | NOT NULL | |
| `created_at` | TIMESTAMP | NOT NULL, default NOW() | |
| `read` | BOOLEAN | NOT NULL, default `false` | |

**Indexes:** `idx_notifications_user_id` on `user_id`

---

### `plaid_environment_config`
*Migration: V5*

Single-row config table (always id=1). Controls which Plaid environment (sandbox vs production) the app uses.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | SERIAL | PK | Always 1 |
| `env` | VARCHAR(20) | NOT NULL, default `'sandbox'` | `sandbox` or `production` |
| `updated_at` | TIMESTAMPTZ | NOT NULL, default now() | |

**Seeded by V5** with `env = 'sandbox'`.

---

### `user_rejected_categories`
*Migration: V6*

Per-user list of Plaid PFCv2 category strings to exclude from monthly-glance aggregation. Extends the hardcoded default set in `MonthlyGlanceService`.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | UUID | PK, default `gen_random_uuid()` | |
| `user_id` | UUID | NOT NULL, FK → `users(id)` ON DELETE CASCADE | |
| `category` | VARCHAR(255) | NOT NULL | Primary or detailed Plaid PFCv2 value, e.g. `"PERSONAL_CARE"` or `"FOOD_AND_DRINK_COFFEE"` |
| `created_at` | TIMESTAMP | NOT NULL, default now() | |

**Unique constraint:** `(user_id, category)`

---

### `user_excluded_accounts`
*Migration: V7*

Per-user list of Plaid account ID strings to exclude from monthly-glance aggregation.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | UUID | PK, default `gen_random_uuid()` | |
| `user_id` | UUID | NOT NULL, FK → `users(id)` ON DELETE CASCADE | |
| `plaid_account_id` | VARCHAR(255) | NOT NULL | Plaid-assigned account ID string (matches `plaid_accounts.plaid_account_id`) |
| `created_at` | TIMESTAMP | NOT NULL, default now() | |

**Unique constraint:** `(user_id, plaid_account_id)`

---

### `plaid_categories`
*Migration: V8*

Read-only lookup table of all 146 Plaid PFCv2 taxonomy entries (18 primary + 128 detailed). Seeded once at migration time; never written at runtime.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `category` | VARCHAR(255) | PK | The taxonomy string itself, e.g. `"FOOD_AND_DRINK"` or `"FOOD_AND_DRINK_COFFEE"` |
| `category_type` | VARCHAR(8) | NOT NULL | `PRIMARY` or `DETAILED` |
| `primary_category` | VARCHAR(255) | nullable | Null for primary-level rows; the parent primary string for detailed rows |

**Seeded by V8** with all 146 PFCv2 entries across 18 primary groups: INCOME, LOAN_DISBURSEMENTS, LOAN_PAYMENTS, TRANSFER_IN, TRANSFER_OUT, BANK_FEES, ENTERTAINMENT, FOOD_AND_DRINK, GENERAL_MERCHANDISE, HOME_IMPROVEMENT, MEDICAL, PERSONAL_CARE, GENERAL_SERVICES, GOVERNMENT_AND_NON_PROFIT, TRANSPORTATION, TRAVEL, RENT_AND_UTILITIES, OTHER.

---

## Entity Relationship Summary

```
users
  ├── oauth_identities   (1:many, ON DELETE CASCADE)
  ├── user_plaid_items   (many:many join to plaid_items)
  ├── notifications      (1:many, ON DELETE CASCADE)
  ├── user_rejected_categories  (1:many, ON DELETE CASCADE)
  └── user_excluded_accounts    (1:many, ON DELETE CASCADE)

plaid_items
  ├── plaid_accounts     (1:many, ON DELETE CASCADE)
  └── user_plaid_items   (many:many join to users)

plaid_environment_config  (singleton config, id=1)

plaid_categories          (read-only taxonomy, 146 rows)
```
