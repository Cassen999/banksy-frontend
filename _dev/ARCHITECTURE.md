# Banksy Frontend — Architecture

## Overview

Banksy is a read-only banking and budgeting app. It connects to bank accounts via Plaid
and displays balance and transaction data. Users can manage bank connections (link, relink,
share, hide, remove) but cannot initiate transactions or move money.

The frontend is a React + TypeScript SPA (Vite). It communicates exclusively with the
Banksy Spring Boot backend via a REST API. The backend owns all Plaid communication —
the frontend never calls Plaid directly except to invoke the Plaid Link SDK modal.

---

## Backend Integration

### Full reference

- **Endpoints:** `backend-reference/ENDPOINTS.md`
- **Database schema:** `backend-reference/SCHEMA.md`

Always read these files before writing any API call. Do not guess shapes or status codes.

### Global Axios configuration

Every request to `/api/**` must include:

```ts
withCredentials: true                              // sends the session cookie
baseURL: import.meta.env.VITE_API_BASE_URL         // e.g. http://localhost:8080
```

A `401` response on any protected endpoint means the session has expired. Redirect the
user to the login page and clear all local user state.

### Public endpoints (no session required)

- `/login`
- `/oauth2/**`
- `/error`
- `POST /api/auth/logout`

All other `/api/**` endpoints require an active session.

---

## Authentication

Authentication is entirely OAuth-based (currently Google). The frontend does not handle
credentials or tokens — it only:

1. Redirects unauthenticated users to `/login` (which the backend handles)
2. Calls `GET /api/auth/me` on app load to confirm a session is active and get the user profile
3. Calls `POST /api/auth/logout` on sign-out, then clears local state and redirects to login

### `GET /api/auth/me`

Check if the user is logged in. Returns `401` if not. Use this as the sole auth gate on app boot.

**Response (200):**
```ts
interface iUser {
  id:        string   // UUID
  email:     string
  firstName: string
  lastName:  string
  username:  string
}
```

### `POST /api/auth/logout`

Invalidates the session. Public — can be called without a valid session.

**Response (200):** `{ loggedOut: true }`

---

## API Endpoints

### Shared Types

```ts
type tRelinkErrorType = "LOGIN_REQUIRED" | "INVALID_TOKEN"

interface iRelinkSignal {
  plaidItemId:     string            // our internal UUID for the PlaidItem
  institutionName: string
  errorType:       tRelinkErrorType
  canRelink:       boolean           // true only if the current user is the bank's owner
  ownerName:       string | null     // populated when canRelink is false (shared user)
  message:         string            // human-readable, safe to display directly
}
```

`relinkRequired: iRelinkSignal[]` is returned by balance, transactions, and plaid/status.
An empty array means all banks are healthy. A non-empty array means one or more banks need
the user to take action before their data can be fetched.

---

### Balance

#### `GET /api/balance`

Returns balances for all HEALTHY, non-hidden accounts. Hidden accounts are excluded
automatically. Also returns `relinkRequired` for any banks needing attention.

**Response (200):**
```ts
interface iBalanceResponse {
  accounts:       iAccount[]
  relinkRequired: iRelinkSignal[]
}

interface iAccount {
  name:             string
  type:             string | null    // "depository" | "credit" | "investment"
  subtype:          string | null    // "checking" | "savings" | "credit card"
  currentBalance:   number | null
  availableBalance: number | null    // null for credit/investment accounts
  currency:         string | null    // ISO 4217, e.g. "USD"
}
```

---

### Transactions

#### `GET /api/transactions`

Returns transactions for all HEALTHY, non-hidden accounts for the past N days.
Transactions are not sorted by the backend — sort on the frontend.

**Query params:**
```
days?: number   // default 30
```

**Response (200):**
```ts
interface iTransactionsResponse {
  transactions:   iTransaction[]
  total:          number
  relinkRequired: iRelinkSignal[]
}

interface iTransaction {
  date:     string      // ISO date "YYYY-MM-DD"
  name:     string      // merchant or description
  amount:   number      // positive = debit (money left account), negative = credit/refund
  currency: string | null
  category: string[]    // Plaid hierarchy, e.g. ["Food and Drink", "Restaurants"]
}
```

---

### Plaid — Bank Connection Management

#### `GET /api/plaid/status`

Call at login (after `/api/auth/me`) to check if any banks need attention before
navigating to balance or transactions.

**Response (200):** `{ relinkRequired: iRelinkSignal[] }`

---

#### `GET /api/plaid/link-token`

Get a Plaid Link token to open the Link modal for a **new** bank connection.
Pass the returned `link_token` to the Plaid Link SDK.

**Response (200):** `{ link_token: string }`

---

#### `GET /api/plaid/link-token/refresh/:itemId`

Get an **update-mode** Plaid Link token for a bank with `errorType: "LOGIN_REQUIRED"`.
The user re-authenticates without re-selecting their institution.

Only the bank's owner can call this (`canRelink: true`). For shared users, display
`RelinkSignal.message` instead.

**Path variable:** `itemId` — the `plaidItemId` from `RelinkSignal` (our internal UUID)

**Response (200):** `{ link_token: string }`
**Response (403):** `{ error: string }`

---

#### `GET /api/plaid/link-token/full-relink/:itemId`

Get a fresh Plaid Link token for a bank with `errorType: "INVALID_TOKEN"`. The user
must select their institution and authenticate from scratch.

Owner only. For shared users, display `RelinkSignal.message`.

**Path variable:** `itemId` — the `plaidItemId` from `RelinkSignal`

**Response (200):** `{ link_token: string }`
**Response (403):** `{ error: string }`

---

#### `POST /api/plaid/exchange`

Exchange the Plaid `publicToken` returned by the Plaid Link `onSuccess` callback.
Call this immediately after the Link modal closes successfully.

If the user re-linked an expired item, pass `expiredItemId`. The backend migrates
shared users automatically and deletes the old item. For new connections, omit it.

After success, refresh balance and transaction data.

**Request body:**
```ts
{
  publicToken:     string
  institutionId:   string          // from onSuccess metadata.institution.id
  institutionName: string          // from onSuccess metadata.institution.name
  expiredItemId?:  string          // plaidItemId from RelinkSignal — only for re-links
}
```

**Response (200):** `{ status: "ok", message: "Plaid authentication successful" }`

---

#### `POST /api/plaid/share`

Share one of the current user's bank connections with another Banksy user by email.
Only the bank's owner can share. Shared users cannot re-share.

**Request body:**
```ts
{
  plaidItemId:    string   // our internal UUID of the PlaidItem
  shareWithEmail: string
}
```

**Response (200):** `{ status: "ok" }`
**Response (400):** `{ error: string }` — user not found, already shared, etc.
**Response (403):** `{ error: string }`

---

#### `PUT /api/plaid/account/:plaidAccountId/hide`

Soft-hides a single account. Hidden accounts are excluded from all balance and
transaction responses. Any linked user (owner or shared) can hide. The hide is
system-wide — hiding affects all users who share that bank connection.

There is no unhide endpoint. Hiding is currently permanent.

**Path variable:** `plaidAccountId` — our internal UUID of the `PlaidAccount` row

**Response (200):** `{ status: "ok" }`
**Response (403):** `{ error: string }`

---

#### `DELETE /api/plaid/item/:plaidItemId`

Fully removes a bank connection: revokes the Plaid access token, hard-deletes the
`PlaidItem` and all its `PlaidAccount` rows, and removes the bank for every user who
had it shared. The backend sends in-app notifications to all affected users.

Any linked user (owner or shared) can trigger deletion. Not reversible.

**Path variable:** `plaidItemId` — our internal UUID of the `PlaidItem` row

**Response (200):** `{ status: "ok" }`
**Response (403):** `{ error: string }`

---

## Endpoint Quick Reference

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/auth/me` | Public | Get current user / check session |
| `POST` | `/api/auth/logout` | Public | Invalidate session |
| `GET` | `/api/balance` | Required | Account balances + relink signals |
| `GET` | `/api/transactions` | Required | Transactions (`?days=N`) + relink signals |
| `GET` | `/api/plaid/status` | Required | Relink signals at login |
| `GET` | `/api/plaid/link-token` | Required | Token for new Plaid Link |
| `GET` | `/api/plaid/link-token/refresh/:itemId` | Owner only | Token for update-mode re-auth |
| `GET` | `/api/plaid/link-token/full-relink/:itemId` | Owner only | Token for full re-link |
| `POST` | `/api/plaid/exchange` | Required | Exchange public token after Link |
| `POST` | `/api/plaid/share` | Owner only | Share a bank with another user |
| `PUT` | `/api/plaid/account/:plaidAccountId/hide` | Required | Soft-hide one account |
| `DELETE` | `/api/plaid/item/:plaidItemId` | Required | Fully remove a bank connection |

---

## Database Entity Overview

The backend uses PostgreSQL. The frontend never sees the raw schema — this is here
for context when reasoning about what data is available and what relationships exist.

```
users
  ├── oauth_identities       (auth plumbing — never exposed to frontend)
  ├── plaid_items            (one per linked bank institution)
  │     └── plaid_accounts   (one per account within a bank, e.g. checking + savings)
  ├── user_plaid_items       (junction — grants a user access to a shared bank)
  └── notifications          (no API endpoint yet — populated on bank removal)
```

**Key ownership rules:**
- A `plaid_item` has one `owner_user_id`. Only the owner can relink or share.
- Any linked user (owner or shared via `user_plaid_items`) can hide an account or remove a bank.
- Hiding an account is system-wide — it affects all users who share that bank.

**IDs — never confuse these:**

| Entity | Our internal ID (used in API) | Plaid's own ID (internal only) |
|---|---|---|
| `plaid_items` | `id` UUID → `plaidItemId` in API | `item_id` VARCHAR |
| `plaid_accounts` | `id` UUID → `plaidAccountId` in API | `plaid_account_id` VARCHAR |

**What the frontend never sees:** `access_token_enc`, `item_id`, `institution_id`,
`transaction_cursor`, `plaid_account_id`, all of `oauth_identities`, all of `user_plaid_items`.

---

## Error Handling Conventions

| Status | Meaning | Frontend action |
|--------|---------|-----------------|
| `401` | Session expired or not logged in | Redirect to login, clear user state |
| `403` | Action not permitted (e.g. shared user trying to relink) | Show error from response body |
| `400` | Bad request (e.g. share target not found) | Show error from response body |
| `500` | Server error | Show a generic error message |

---

## HTTP Client

**Primary:** `axios-hooks` (`useAxios`) — use this for all data-fetching inside React hooks and components.
**Fallback:** `apiClient` (Axios instance from `src/api/client.ts`) — use for mutations (POST, PUT, DELETE) in service utility functions where a React hook cannot be used.

Never use raw `fetch`. Never use a separately configured Axios instance.

### Centralized 401 handling

`src/api/client.ts` exports the single shared Axios instance (`apiClient`) and configures
`axios-hooks` to use it. An Axios response interceptor on this instance calls
`handleUnauthorized()` (from `src/utils/auth.ts`) on every `401` response.

`handleUnauthorized()` redirects the user to the OAuth login URL and must clear any
auth context state. Do not add 401 handling anywhere else.

```ts
// How hooks use axios-hooks for data fetching:
import useAxios from 'axios-hooks';

function useBalance() {
  const [{ data, loading, error }] = useAxios<iBalanceResponse>('/api/balance');
  return { data, loading, error };
}

// How service functions use apiClient for mutations:
import { apiClient } from '../api/client';

export async function removeBank(plaidItemId: string): Promise<void> {
  await apiClient.delete(`/api/plaid/item/${plaidItemId}`);
}
```

---

## Frontend Architecture Layers

Every file in `src/` belongs to one of five layers. Violations are caught in code review
and by the definition-of-done hook.

### Layer 1 — Pages / Views (`src/pages/` or `src/views/`)

Top-level route components. Wire together layout, hooks, and data. Think Controllers.

- MAY call custom hooks for data and actions
- MAY NOT call API service functions or `useAxios` directly
- MAY NOT contain business logic (maps, filters, transforms on data)
- MAY NOT manage global state directly — use a context hook

### Layer 2 — Components (`src/components/`)

Reusable UI pieces. Receive props, render markup, emit events upward.

- MAY NOT call API service functions or `useAxios` directly
- MAY NOT own data-fetching logic — data comes from props or a co-located hook
- MAY contain display-level conditionals (`isLoading`, `isError`, `isEmpty`)
- MUST use semantic HTML and ARIA roles where appropriate

### Layer 3 — Hooks (`src/hooks/`)

Custom React hooks. Encapsulate data-fetching, state, and side effects. Think Services.

- MAY call `useAxios` for data fetching
- MAY call service functions for mutations
- MAY read from and write to contexts
- MAY NOT return JSX
- Data-fetching hooks MUST expose `loading`, `error`, and `data` states
- Data-fetching hooks MUST surface any `relinkRequired` signals returned by the backend

### Layer 4 — Service Functions (`src/services/`)

Plain async functions that perform mutations or non-hook API operations. One file per
backend domain (e.g. `plaidService.ts`, `authService.ts`).

- ALL `apiClient` calls live here — no other layer may call `apiClient` directly
- Functions MUST be plain `async` — not hooks, not classes
- 401 is handled automatically by the `apiClient` interceptor — do not re-check here
- On other non-2xx responses, throw a typed error with status code and message

### Layer 5 — Types (`src/types/`)

TypeScript interfaces and type aliases mirroring backend response shapes.

- Plain type/interface declarations only — no runtime code
- All shared types live here; do not define inline types in service or component files
- When the backend changes a response shape, update the type here first

### Utilities (`src/utils/`)

Stateless helper functions. No React imports, no hooks, no API calls.
Every utility function must have a unit test.

---

## State Management

**Approach:** React Context only. No Zustand, no Redux.

- Global state (auth, user profile, notifications) lives in Context providers under `src/contexts/`
- Each context exports a typed hook (e.g. `useAuth()`, `useUser()`)
- Context providers wrap the app at the appropriate level in the component tree
- Reducers (`useReducer`) are used inside complex contexts; simple state uses `useState`
- Test contexts by wrapping components in the provider within the test render

---

## RelinkSignal Handling — Mandatory

Every hook that calls `/api/balance` or `/api/transactions` MUST surface the
`relinkRequired` array to the UI.

| Condition | Required UI behavior |
|-----------|---------------------|
| `relinkRequired` is non-empty | Show a relink banner or modal for each signal |
| `canRelink: true`, `errorType: LOGIN_REQUIRED` | "Reconnect" button → refresh link token → open Plaid Link |
| `canRelink: true`, `errorType: INVALID_TOKEN` | "Re-link" button → full-relink token → open Plaid Link |
| `canRelink: false` | Read-only message using `ownerName` and `message` |
| Any relink signal | Always offer "Remove this bank" option alongside the relink option |

After Plaid Link `onSuccess`: call `POST /api/plaid/exchange`, pass `expiredItemId` if re-linking,
then refresh balance and transaction data.

---

## Pre-Deployment Checklist

- [ ] `VITE_API_BASE_URL` is set in the deployment environment — never hardcoded in source
- [ ] `.env` files with real values are in `.gitignore` and have never been committed
- [ ] All API calls use `withCredentials: true` (handled by `apiClient`)
- [ ] `401` responses redirect to login globally (handled by `apiClient` interceptor)
- [ ] Google OAuth redirect URL matches what is registered in Google Cloud Console and `application.properties`
- [ ] CORS origin in the backend `WebConfig` matches the production frontend URL
- [ ] No `console.log` statements in production code
- [ ] Coverage ≥ 80% line and branch — enforced in CI before any deploy
- [ ] All tests pass in CI

---

## Folder Structure

```
src/
├── main.tsx               # Entry — mounts App with StrictMode, BrowserRouter, PrimeReactProvider
├── App.tsx                # Route definitions (default export)
├── api/
│   └── client.ts          # Axios instance, axios-hooks config, 401 interceptor
├── components/            # One folder per component; co-locate SCSS inside
│   └── MyComponent/
│       ├── MyComponent.tsx
│       ├── MyComponentPage.tsx   # only if this component has an associated page
│       └── myComponent.scss
├── contexts/              # React Contexts — do not add without approval
├── hooks/                 # Custom hooks — must use 'use' prefix
├── services/              # Mutation service functions (POST/PUT/DELETE via apiClient)
├── utils/                 # Pure utility functions (no side effects, no React imports)
├── styles/                # Global and root styles only
│   ├── index.scss         # Central SCSS entry — imports all component SCSS here
│   ├── globalStyles.scss
│   ├── root.scss          # CSS custom properties (:root)
│   └── variables.scss     # SCSS variables
├── mocks/
│   ├── handlers.ts        # MSW handlers grouped by domain
│   └── server.ts          # MSW server setup (used in tests)
├── test/
│   └── setup.ts           # Vitest setup (jest-dom + MSW lifecycle)
├── types/
│   └── types.ts           # All shared TypeScript interfaces and type aliases
└── assets/                # Static files
```

---

## Naming Conventions

| Type | Convention | Example |
|---|---|---|
| Interface | `i` prefix, PascalCase | `iButtonProps`, `iUser` |
| Type alias | `t` prefix, PascalCase | `tVariant`, `tRelinkErrorType` |
| Component | PascalCase file, default export | `Button.tsx` |
| Page component | PascalCase + `Page` suffix when sharing a folder with a same-name component | `DashboardPage.tsx` |
| Context | PascalCase + `Context` suffix, named export | `AuthContext.tsx` |
| Hook | camelCase + `use` prefix, named export | `useBalance.ts` |
| Service | camelCase | `plaidService.ts` |
| Utility | camelCase | `formatCurrency.ts` |
| SCSS file | camelCase, matching the component | `button.scss` |

---

## TypeScript Rules

- All shared types live in `src/types/types.ts`
- Local-only types are defined at the top of the file that uses them
- Use `interface` for object shapes (prefixed `i`); use `type` for unions and aliases (prefixed `t`)
- Every interface property that has a default value **must** include a `/** @default <value> */` JSDoc comment
- Use `import type` syntax for type-only imports
- Strict mode is enabled — do not disable TypeScript checks

---

## Component Rules

- Functional components only — no class components
- Props typed with an `i`-prefixed interface, destructured in the function signature:
  ```tsx
  interface iButtonProps {
    label: string
    /** @default false */
    disabled?: boolean
  }
  export default function Button({ label, disabled = false }: iButtonProps) { ... }
  ```
- Default exports for components; named exports for contexts and hooks
- Use `useMemo` for expensive derived values and for all context values
- Use semantic HTML and ARIA roles — accessibility is mandatory

---

## Context Policy

- **Do not create a new context without asking first.** If state needs to be shared, raise it to a common ancestor before creating a context.
- Context values must be memoized with `useMemo`
- Group related state and setters together in the context value object
- Every context hook must throw a descriptive error when used outside its provider:
  ```ts
  export function useAuth() {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuth must be used within AuthProvider')
    return ctx
  }
  ```

---

## SCSS / Styling Rules

- All SCSS files are imported through `src/styles/index.scss` — never import component SCSS directly in TypeScript
- Component SCSS lives in the component's folder; reference variables with a relative path: `../../styles/variables.scss`
- Global and root styles live in `src/styles/`
- Use CSS custom properties (`var(--primary-color)`) — no hardcoded color values
- BEM naming: `.block`, `.block__element`, `.block--modifier`
- Maximum 2 levels of nesting
- Keyframe animations defined at the top of the relevant SCSS file, outside any selector
- No inline styles — use class names

---

## File Structure Rules — Adding New Files

**New component:**
1. Create `src/components/MyComponent/MyComponent.tsx`
2. Create `src/components/MyComponent/myComponent.scss`
3. Add `@use '../components/MyComponent/myComponent';` to `src/styles/index.scss`

**New page (with its own domain):**
1. Create `src/components/Foo/Foo.tsx` and `src/components/Foo/FooPage.tsx`
2. Create `src/components/Foo/foo.scss` and add to `src/styles/index.scss`
3. Add `<Route path="/foo" element={<FooPage />} />` in `App.tsx`

**New hook:** Create `src/hooks/useMyHook.ts`

**New service:** Create `src/services/myService.ts`

**New shared type:** Add to `src/types/types.ts`

**New context:** Ask first. If approved, create `src/contexts/MyContext.tsx`

---

## Routing Table

Routes are defined in `src/App.tsx`. Update this table whenever a route is added or removed.

| Path | Component | Description |
|------|-----------|-------------|
| `/` | — | Placeholder (to be replaced with landing/dashboard) |

---

## Git Branching Model

```
main      ← stable/release only. Never commit directly.
  └── develop  ← integration branch. Never commit directly.
        └── feature/my-feature  ← branch off develop, PR back into develop
```

- Feature branches are always cut from `develop`
- PRs merge into `develop`; `develop` merges into `main` for releases
- Before any commit: run `npm test`, `npm run lint`, and `npm run build`
- Do not commit if any of them fail

---

## Best Practices Guardrail

If a request contradicts best practices for React, TypeScript, SCSS, Vite, WCAG accessibility, or PrimeReact, **flag it before proceeding**:

1. State exactly what rule or guideline it violates
2. Name the standard/version (e.g. WCAG 2.2, React 19, PrimeReact 10)
3. Suggest the recommended alternative
4. Ask whether to proceed with the request or use the suggested approach

Do not silently comply with something that violates best practices.

---

## General Coding Principles

- Don't add features, refactors, or improvements beyond what was asked
- Don't add comments unless the logic is non-obvious
- Don't add error handling for scenarios that can't happen — trust framework and TypeScript guarantees
- Don't design for hypothetical future requirements
- In development, surface unexpected edge cases with `if (import.meta.env.DEV) console.warn(...)` rather than silently swallowing them

---

## Edge Case Handling

When an edge case is not explicitly defined in the plan or feature spec:

- **Prefer non-destructive behavior** — do not remove, mutate, or overwrite existing data unless the feature explicitly requires it
- **Log a warning in development** using `if (import.meta.env.DEV) console.warn(...)` — visible during development, silent in production
