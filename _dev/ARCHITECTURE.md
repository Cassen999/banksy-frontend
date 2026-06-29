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

A missing or expired session causes the server to return `302 → /oauth2/authorization/google`.
The browser follows the redirect automatically — no client-side 401 handling is needed.

### Public endpoints (no session required)

- `/login`
- `/logout`
- `/oauth2/**`
- `/error`

All other `/api/**` endpoints require an active session.

---

## Authentication

Authentication is entirely OAuth-based (currently Google). The frontend does not handle
credentials or tokens — it only:

1. Redirects unauthenticated users to Google OAuth via `GET /oauth2/authorization/google`
2. Calls `GET /api/auth/me` on app load to confirm a session is active and get the user profile
3. Navigates the browser to `GET /logout` on sign-out — Spring invalidates the session and redirects through Google's OIDC end-session flow before returning the browser to the frontend

### `GET /api/auth/me`

Check if the user is logged in. Returns `302` if not. Use this as the sole auth gate on app boot — any error (including network errors from a redirected request) sets the user to `null`.

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

### `GET /logout`

Navigate the browser here via `window.location.href`. Spring invalidates the session,
redirects through Google's OIDC end-session endpoint to fully sign the user out of Google,
then returns the browser to the frontend root. Not called via Axios — no JSON response.

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
  accountId:        string           // our internal UUID for the PlaidAccount row
  name:             string
  type:             string           // "depository" | "credit" | "loan" | "investment" | "other"
  subtype:          string | null    // "checking" | "savings" | "credit card"
  currentBalance:   number | null
  availableBalance: number | null    // null for credit/investment accounts
  isoCurrencyCode:  string | null    // ISO 4217, e.g. "USD"
  institutionName:  string
  customName:       string | null    // user-defined label; null if not yet set
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
  accountId:       string       // links back to iAccount.accountId
  date:            string       // ISO date "YYYY-MM-DD"
  name:            string       // merchant or description
  amount:          number       // positive = debit (money left account), negative = credit/refund
  isoCurrencyCode: string | null
  category:        string[]     // Plaid hierarchy, e.g. ["Food and Drink", "Restaurants"]
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

#### `PUT /api/plaid/account/:plaidAccountId/name`

Set or update the custom display name for a single account. The new name replaces any
previously saved value. Passing an empty string clears the custom name.

**Path variable:** `plaidAccountId` — our internal UUID of the `PlaidAccount` row

**Request body:**
```ts
{ customName: string }
```

**Response (200):** empty body
**Response (404):** account not found
**Response (403):** caller does not have access to the account

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
| `GET` | `/logout` | Public | Full OIDC sign-out — invalidates session + Google token |
| `GET` | `/api/balance` | Required | Account balances + relink signals |
| `GET` | `/api/transactions` | Required | Transactions (`?days=N`) + relink signals |
| `GET` | `/api/plaid/status` | Required | Relink signals at login |
| `GET` | `/api/plaid/link-token` | Required | Token for new Plaid Link |
| `GET` | `/api/plaid/link-token/refresh/:itemId` | Owner only | Token for update-mode re-auth |
| `GET` | `/api/plaid/link-token/full-relink/:itemId` | Owner only | Token for full re-link |
| `POST` | `/api/plaid/exchange` | Required | Exchange public token after Link |
| `POST` | `/api/plaid/share` | Owner only | Share a bank with another user |
| `PUT` | `/api/plaid/account/:plaidAccountId/name` | Required | Set or update custom account display name |
| `PUT` | `/api/plaid/account/:plaidAccountId/hide` | Required | Soft-hide one account |
| `DELETE` | `/api/plaid/item/:plaidItemId` | Required | Fully remove a bank connection |
| `GET` | `/api/monthly-glance` | Required | Cumulative daily spending totals for the current month |
| `GET` | `/api/recurring/scheduled-deposits` | Required | Recurring deposits predicted for current month |

---

## Database Entity Overview

The backend uses PostgreSQL. The frontend never sees the raw schema — this is here
for context when reasoning about what data is available and what relationships exist.

```
users
  ├── oauth_identities            (auth plumbing — never exposed to frontend)
  ├── plaid_items                 (one per linked bank institution)
  │     └── plaid_accounts        (one per account within a bank, e.g. checking + savings)
  ├── user_plaid_items            (junction — grants a user access to a shared bank)
  └── notifications               (no API endpoint yet — populated on hide and remove operations)

plaid_environment_config          (singleton row — backs dev-only environment toggle endpoints)
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
| `302` | Session expired or not logged in | Browser follows redirect to OAuth automatically — no frontend handling needed |
| `403` | Action not permitted (e.g. shared user trying to relink) | Show error from response body |
| `400` | Bad request (e.g. share target not found) | Show error from response body |
| `500` | Server error | Show a generic error message |

---

## HTTP Client

**Primary:** `axios-hooks` (`useAxios`) — use this for all data-fetching inside React hooks and components.
**Fallback:** `apiClient` (Axios instance from `src/api/client.ts`) — use for mutations (POST, PUT, DELETE) in service utility functions where a React hook cannot be used.

Never use raw `fetch`. Never use a separately configured Axios instance.

### Session expiry

`src/api/client.ts` exports the single shared Axios instance (`apiClient`) and configures
`axios-hooks` to use it. Session expiry is handled by the server — it returns `302 → /oauth2/authorization/google`
and the browser follows the redirect automatically. No client-side interceptor is needed.

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
- Session expiry (`302`) is handled automatically by the browser — do not re-check here
- On other non-2xx responses, throw a typed error with status code and message

### Layer 5 — Types (`src/types/`)

TypeScript interfaces and type aliases mirroring backend response shapes.

- Plain type/interface declarations only — no runtime code
- All shared types live here; do not define inline types in service or component files
- When the backend changes a response shape, update the type here first

### Utilities (`src/utils/`)

Stateless helper functions. No React imports, no hooks, no API calls.
Every utility function must have a unit test.

**`isDesktop.ts`** — `isDesktop(): boolean`. Returns `true` when `window.innerWidth >= 1024`. Use this everywhere a component needs to branch on the desktop breakpoint — do not read `window.innerWidth` directly in component or hook files.

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
- [ ] Session expiry is handled server-side via `302` redirect — confirm OAuth redirect URL is correctly registered
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
│   └── client.ts          # Axios instance, axios-hooks config
├── components/            # One folder per component; co-locate SCSS inside
│   └── MyComponent/
│       ├── MyComponent.tsx
│       ├── MyComponentPage.tsx   # only if this component has an associated page
│       └── myComponent.scss
├── contexts/              # React Contexts — do not add without approval
│   └── contextTests/      # Test files for all contexts (not co-located)
├── hooks/                 # Custom hooks — must use 'use' prefix
├── services/              # Mutation service functions (POST/PUT/DELETE via apiClient)
├── utils/                 # Pure utility functions (no side effects, no React imports)
├── styles/                # Global and root styles only
│   ├── index.scss               # Central SCSS entry — imports all component SCSS here
│   ├── globalStyles.scss        # Base resets and global element styles
│   ├── root.scss                # CSS custom properties (:root and [data-theme='dark'])
│   ├── variables.scss           # SCSS variables (spacing, breakpoints, etc.)
│   └── primeReactOverrides.scss # Global PrimeReact component overrides (scoped where needed)
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

## Mobile-First UI Rules

### Target devices

| Device | CSS width | CSS height | Landscape width |
|---|---|---|---|
| iPhone 14 | 390px | 844px | 844px |
| iPhone 17 | 402px | 874px | 874px |
| Samsung Galaxy S25+ | 412px | 891px | 891px |
| Google Pixel 10 | 412px | 924px | 924px |

Widths below **390px** and widths between **925px–1023px** are out of scope and do not
need to be accommodated.

### Breakpoints

Defined in `src/styles/variables.scss` as `$breakpoints`. Use the `bp()` mixin:

```scss
@use '../../styles/variables' as *;

.my-component {
  // base styles — 390px and up (mobile portrait, single column)

  @include bp('mobile-lg') {
    // 412px and up — wider Android phones, minor width-sensitive tweaks only
  }

  @include bp('landscape') {
    // 844px and up — mobile landscape, same single-column layout, reduce vertical padding
  }

  @include bp('desktop') {
    // 1024px and up — two-column body grid
  }
}
```

| Name | Min-width | Covers |
|---|---|---|
| _(base)_ | 390px | iPhone 14, iPhone 17 — no breakpoint, base styles apply |
| `mobile-lg` | 412px | Pixel 10, Samsung S25+ — subtle width-sensitive adjustments |
| `landscape` | 844px | All target devices in landscape — layout unchanged (single column) |
| `desktop` | 1024px | Desktop — two-column body grid |

### Layout grid

- **Mobile (base → 1023px):** single column, full width
- **Desktop (1024px+):** two-column grid applied to **page body content only**
- Header and sidebar are full-width in all breakpoints — they belong to the Layout component

### Landscape mode

Landscape displays the same single-column layout as portrait. The `landscape` breakpoint
(844px) is available for minor vertical-space adjustments (e.g. reduced padding) only.
No separate layout pattern is required.

### Scrolling policy

Minimize scrolling where reasonable, but do not prohibit it. Some views (charts, long
lists) inherently require scrolling. Evaluate case by case — prefer viewport-contained
layouts for forms and dashboards.

### Touch targets

All interactive elements must meet a **44×44px minimum tap target**. This applies to
buttons, links, inputs, icons, and any tappable element. PrimeReact's default styles
generally satisfy this — verify and override with explicit `min-width`/`min-height` if
a component falls short.

### Safe area insets

The Layout component must apply `env(safe-area-inset-*)` padding to protect content
from iPhone Dynamic Island / Android edge-to-edge display cutouts. The viewport meta
tag in `index.html` uses `viewport-fit=cover` to enable safe-area support.

### Theme

- **PrimeReact theme:** Lara Light Blue / Lara Dark Blue (toggled dynamically)
- **Default:** system `prefers-color-scheme` media query
- **User override:** toggle stored in `localStorage` under key `theme`
- **Implementation:** `ThemeProvider` in `src/contexts/ThemeContext.tsx`
  - Sets `data-theme="light" | "dark"` on `<html>` for our own CSS custom properties
  - Injects / swaps a `<link id="primereact-theme">` element for the PrimeReact theme CSS
- **Our CSS custom properties:** light-mode values in `:root` (root.scss);
  dark-mode overrides in `[data-theme="dark"]` (root.scss)
- **Dark-mode-only variables** (defined only in `[data-theme="dark"]`, no `:root` equivalent):
  - `--color-overlay-bg` — sidebar panel background (`#383838`); components use `var(--color-overlay-bg, var(--color-bg))` to fall back to `--color-bg` in light mode
  - `--color-divider` — PrimeReact `<Divider>` line color (`var(--blue-300)`); overridden globally in `primeReactOverrides.scss`

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
- **PrimeReact overrides:** all global PrimeReact component style overrides go in `src/styles/primeReactOverrides.scss`. Scope dark-mode overrides under `[data-theme='dark']`. Component-specific PrimeReact overrides may live in the component's own SCSS file.

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

## Layout Component

`src/components/Layout/Layout.tsx` is the full-app shell. It renders:
- `AppHeader` — sticky header with responsive mobile/desktop variants. Desktop layout uses a 3-column CSS grid (`1fr auto 1fr`): brand logo (left), menubar (true center), user section (right). This keeps the menubar centered relative to the full header width regardless of logo/user-section widths.
- `AppSidebar` — mobile-only sliding panel (hidden on desktop via CSS)
- A full-screen backdrop overlay when the sidebar is open
- `<main>` wrapping all page content
- `<ViewportMask />` rendered as a sibling outside the layout div (so it is never inert)

**Auth gate:** The layout root div receives `inert={true}` when `user` is `null`, blocking all keyboard and pointer interaction. `ViewportMask` covers it visually with a fixed overlay. The `<Toast>` inside the layout still works when inert because PrimeReact renders it into a `document.body` portal.

**Login notification:** Layout runs a `useEffect` on `[isLoading, user]`. When auth resolves with a user present and the `banksy_login_pending` sessionStorage flag is set, it fires a success toast ("Login Successful / Welcome to Banksy!") and clears the flag. This distinguishes a fresh login from a returning session.

**HTML hierarchy decision (enforced globally):** `<h1>` belongs in the page body (inside `<main>`), never in the `<header>`. Every page rendered in Layout must begin with its own `<h1>`. On desktop the `AppHeader` hides the page name entirely (CSS `display: none`) — the visible page title is the `<h1>` on the page. On mobile the page name appears in the header and the page `<h1>` is SR-only.

**Nav active state:** `NAV_ITEMS` in `Layout.tsx` adds `className: 'active'` to whichever item's `url` matches the current `location.pathname`. `AppHeader` styles the matching `.p-menuitem.active` with a 2px primary-blue `::after` underline at the bottom of the item. Hover state changes icon and text to `var(--color-primary)` with no underline.

**Sidebar toggle:** The hamburger button (`☰`) in the mobile header opens the sidebar. The `×` button inside the sidebar panel closes it. Clicking the backdrop also closes it.

**Context provider nesting:** Page-level context providers go inside the Layout's `<main>`. App-wide providers (like `NotificationProvider`) that are consumed by Layout itself go in `App.tsx` alongside `AuthProvider`.

---

## ViewportMask Component

`src/components/ViewportMask/ViewportMask.tsx` is the global authentication gate. It renders as a sibling to the layout div (outside the inert subtree), fixed over the entire viewport.

- Returns `null` immediately when `user` is present — zero render cost for authenticated sessions.
- When `user` is `null` and `isLoading` is `true`: renders the mask with a `<ProgressSpinner>` only.
- When `user` is `null` and `isLoading` is `false`: renders the mask with the login message and `<AuthButton>`.
- Holds a `loginButtonRef` passed to `<AuthButton ref={loginButtonRef} />`.
- Runs a `useEffect` on `[isLoading, user]`: if auth resolves with no user and `banksy_login_pending` is set, fires the error toast, clears the flag, and calls `loginButtonRef.current?.focus()` to return keyboard focus to the login button.

**CSS:** `position: fixed; inset: 0; z-index: 1000; background: var(--color-mask-bg)`. Color is theme-aware via CSS custom properties (`rgba(255,255,255,0.88)` light / `rgba(0,0,0,0.88)` dark).

---

## AuthButton Component

`src/components/AuthButton/AuthButton.tsx` is a reusable login/logout button used in `ViewportMask` and `SettingsPage`.

- Props: none (reads `useAuth()` internally).
- Implemented with `forwardRef<iAuthButtonHandle>` so callers can hold a ref with a `focus()` method (used by ViewportMask to focus the button after login failure). The ref is not a raw DOM ref — it exposes only the `{ focus() }` handle declared in `iAuthButtonHandle`.
- **Login:** sets `sessionStorage['banksy_login_pending'] = '1'` then redirects to `VITE_API_BASE_URL/oauth2/authorization/google`.
- **Logout:** redirects to `VITE_API_BASE_URL/logout` (no sessionStorage flag — logout is synchronous).
- Renders a PrimeReact `<Button>` with `rounded` and `className="auth-button"`.

---

## Homepage Component

`src/components/Homepage/HomepagePage.tsx` is the dashboard page (route `/dashboard`). Display-only at this layer — data fetching is delegated entirely to child components.

Auth gating is handled globally by `ViewportMask` — this component always renders its dashboard content unconditionally.

**Structure:**
- `div.dashboard` root
  - `h1.dashboard__title` — "Dashboard" (SR-only on mobile via clip trick; visible on desktop as grid row 1 spanning both columns, `font-size: 1.5rem`, `font-weight: 700`)
  - `section.dashboard__graph` (aria-label "Spending trend graph") — renders `<MonthlyGlance />`
  - `div.dashboard__next-deposit` (role "region", aria-label "Next scheduled deposit") — renders `<ScheduledDeposits />`
  - `section.dashboard__accounts` (aria-label "Account overview") — renders `<QuickAccountOverview />`

**Desktop grid:** `grid-template-columns: 40% 1fr; grid-template-rows: auto 3fr 2fr`. The title is row 1 (both columns), graph is column 1 row 2, next-deposit is column 1 row 3, accounts is column 2 rows 2–3.

**Dependencies:** `MonthlyGlance`, `ScheduledDeposits`, `QuickAccountOverview`. No hooks, no navigation, no theme reads.

---

## Settings Component

`src/components/Settings/SettingsPage.tsx` is the settings page (route `/settings`). Initial implementation — logout only.

- Renders an `<h1>Settings</h1>` and an `<AuthButton />`.
- No data fetching. No props.
- Auth gating is handled globally by `ViewportMask`.

---

## Auth Architecture

### `src/contexts/AuthContext.tsx`
Stores the current user session. Calls `authService.fetchMe()` on mount (once); any error (including network errors from a session-expired `302` redirect) sets user to `null`. Provides `user`, `isLoading`, and `clearUser` via `useAuth()`.

**Placement:** `AuthProvider` wraps `<Layout>` inside `App.tsx`. It is NOT inside `main.tsx`.

### `src/services/authService.ts`
- `fetchMe()` — `GET /api/auth/me`. Returns `iUser`. Throws on any non-2xx.


---

## Notification Architecture

### `src/contexts/NotificationContext.tsx`
Global notification system. Provides independent toast and banner notification state via `useNotify()`.

- **Toast:** Context holds a `toastRef = useRef<Toast>(null)` and `showToast`/`toastConfig` state. Calling `triggerToast(config)` sets state and fires `toastRef.current?.show(config)` via `useEffect`. Calling `hideToast()` resets both. `Layout.tsx` attaches `toastRef` to the PrimeReact `<Toast>` component.
- **Banner:** `triggerBanner(config)` sets `showBanner = true` and `bannerConfig`. `Layout.tsx` conditionally renders `<Message {...bannerConfig} />` centered below the header. `hideBanner()` resets both.
- All exported values are memoized with `useMemo`.
- Toast and banner states are fully independent.

**Placement:** `NotificationProvider` wraps `<Layout>` inside `App.tsx` (alongside `AuthProvider`), because `Layout.tsx` itself calls `useNotify()` to wire up the Toast ref and banner visibility.

---

## Plaid Link Architecture

### `src/services/plaidService.ts`
- `fetchLinkToken()` — `GET /api/plaid/link-token`. Returns `iPlaidLinkTokenResponse`. Throws `{ status: 500 }` on server error.
- `exchangePublicToken(body)` — `POST /api/plaid/exchange`. Returns `iPlaidExchangeResponse`. Same error handling.

### `src/hooks/useLinkAccount.ts`
Orchestrates the full Plaid bank link flow. Returns `{ isLoading, initiateLinkFlow }`.

State machine:
1. `initiateLinkFlow()` sets `isLoading = true`, calls `fetchLinkToken()`
2. On token success, sets `linkToken` state → `usePlaidLink` from `react-plaid-link` becomes `ready`
3. `useEffect` on `ready` calls `open()` to launch the Plaid modal
4. `onSuccess` → calls `exchangePublicToken`, shows success toast, clears loading
5. `onExit(error)` → shows error toast if `error` is non-null, clears loading
6. Any service error → shows generic error toast, clears loading

### `src/components/LinkAccount/LinkAccount.tsx`
Standalone multistate button. Calls `useLinkAccount()` internally — no props required. Renders a PrimeReact `<Button>` in default state (enabled, label "Link Account") or loading state (disabled, spinner). Can be placed anywhere in the component tree.

---

## Monthly Glance Architecture

### Types (`src/types/types.ts`)
- `iMonthlyGlanceDailyTotal` — `{ transactionDate: string; total: number }` — one day's raw spending total as returned by the API.
- `iMonthlyGlanceResponse` — `{ dailyTotals: iMonthlyGlanceDailyTotal[]; relinkRequired: unknown[] }` — full API response shape.
- `iMonthlyGlanceDataPoint` — `{ date: string; cumulative: number; daily: number }` — post-transformation shape used by the chart; `cumulative` is the running total up to that day.

### `src/services/monthlyGlanceService.ts`
- `fetchMonthlyGlance()` — `GET /api/monthly-glance`. Returns `iMonthlyGlanceResponse`. Backend delivers pre-filtered data; no client-side category filtering needed.

### `src/hooks/useMonthlyGlance.ts`
Returns `{ status, data, retry }`. Status is `'idle' | 'loading' | 'error' | 'success'`.

- Guards: does not call the service unless `user` (from `useAuth()`) is non-null.
- Transforms `dailyTotals` into a cumulative series via the internal `toCumulative()` helper — each point's `cumulative` is the sum of all `total` values up to and including that day.
- Internal status is `'idle' | 'error' | 'success'`; `'loading'` is derived: when `user` is non-null and internal status is `'idle'`, the public status is `'loading'`.
- `retry()` resets internal status to `'idle'` and increments a `fetchCount` counter, which triggers the `useEffect` to re-fetch.
- On error, fires `triggerToast` with severity `'error'`.

### `src/components/MonthlyGlance/MonthlyGlance.tsx`
Dashboard graph panel. No props.

States:
- **Auth loading / no user**: renders PrimeReact `<Skeleton />` filling the section; does not invoke `useMonthlyGlance`.
- **Loading**: opaque mask overlay + PrimeReact `<ProgressSpinner />`.
- **Error**: opaque mask overlay + retry button (`pi-undo` icon + "Retry" label); clicking calls `retry()`.
- **Success**: renders `<Line />` from `react-chartjs-2` with cumulative spending data.

Chart details:
- Split background (teal below / red above budget line) drawn via an inline Chart.js `beforeDraw` plugin. CSS custom properties are resolved at draw time via `getComputedStyle` because canvas context does not support them natively.
- Budget is a hardcoded local constant (`const budget: number = 2000`) pending integration with the user object.
- Tooltip mode switches between hover (desktop, ≥ 1024 px) and click (mobile, < 1024 px) by toggling Chart.js `events` based on `window.innerWidth` at render time.

---

## Scheduled Deposits Architecture

### Types (`src/types/types.ts`)
- `iScheduledDepositAmount` — `{ amount: number; isoCurrencyCode: string }` — monetary value with currency code.
- `iScheduledDeposit` — full shape of a recurring deposit stream returned by the API. Nullable fields: `merchantName`, `description`, `averageAmount`, `lastAmount`, `personalFinanceCategory`.

### `src/services/scheduledDepositsService.ts`
- `fetchScheduledDeposits()` — `GET /api/recurring/scheduled-deposits`. Returns `iScheduledDeposit[]`. Backend returns deposits sorted ascending by `predictedNextDate`, filtered to the current calendar month. Non-HEALTHY items are silently skipped by the backend.

### `src/hooks/useScheduledDeposits.ts`
Returns `{ status, deposits, retry }`. Status is `'idle' | 'loading' | 'error' | 'success'`.

- Guards: does not call the service unless `user` (from `useAuth()`) is non-null.
- Client-side filter: after a successful fetch, stores only items where `isActive: true`.
- Status derivation, retry mechanism, and error toast pattern mirror `useMonthlyGlance.ts` exactly.

### `src/components/ScheduledDeposits/ScheduledDeposits.tsx`
Dashboard recurring-deposit panel. No props. Placed inside the `dashboard__next-deposit` div in `HomepagePage.tsx`.

States:
- **Auth loading / no user**: renders PrimeReact `<Skeleton />` filling the section.
- **Loading**: opaque mask overlay + PrimeReact `<ProgressSpinner />`.
- **Error**: opaque mask overlay + retry button (`pi-undo` icon + "Retry" label).
- **Empty** (no active deposits this month): plain text "No upcoming deposits this month."
- **Success**: PrimeReact `<Accordion multiple>` with one item per visible deposit.

Visibility slice: `deposits.slice(0, 1)` on mobile (< 1024 px), `deposits.slice(0, 5)` on desktop (≥ 1024 px). All sliced items are already `isActive: true` (filtered in hook).

Each accordion header shows the Piggy Bank SVG animation (`src/assets/Piggy Bank.svg`) alongside the deposit summary text. The expanded panel shows a two-column `<dl>` grid: From / Description / Frequency on the left; Last date+amount / Next date+amount on the right. Null fields display as `—`. Amounts formatted via `Intl.NumberFormat` with `isoCurrencyCode`. Frequency converted from all-caps (e.g. `BIWEEKLY`) to title-case (`Biweekly`).

---

## Quick Account Overview Architecture

**Files introduced by this feature:**

| Kind | Name | Path |
|------|------|------|
| Service | `balanceService.ts` | `src/services/balanceService.ts` |
| Service | `transactionService.ts` | `src/services/transactionService.ts` |
| Hook | `useQuickAccountOverview.ts` | `src/hooks/useQuickAccountOverview.ts` |
| Component | `CustomAccountNameModal.tsx` | `src/components/CustomAccountNameModal/CustomAccountNameModal.tsx` |
| Component | `CustomAccountNameButton.tsx` | `src/components/CustomAccountNameButton/CustomAccountNameButton.tsx` |
| Component | `QuickAccountOverview.tsx` | `src/components/QuickAccountOverview/QuickAccountOverview.tsx` |

### Types (`src/types/types.ts`)
- `iAccount` — single Plaid account as returned by `GET /api/balance` (see Balance section above).
- `iBalanceResponse` — `{ accounts: iAccount[]; relinkRequired: iRelinkSignal[] }`.
- `iTransaction` — single transaction row from `GET /api/transactions` (see Transactions section above).
- `iTransactionsResponse` — `{ transactions: iTransaction[]; total: number; relinkRequired: iRelinkSignal[] }`.
- `iAccountWithTransactions` — derived type: `iAccount` extended with `transactions: iTransaction[]` (sorted desc by date) and `lastDeposit: iTransaction | null` (most recent transaction where `amount < 0`).
- `iSetAccountNameRequest` — request body for `PUT /api/plaid/account/:id/name`: `{ customName: string }`.

### `src/services/balanceService.ts`
- `fetchBalance()` — `GET /api/balance`. Returns `iBalanceResponse`. Throws on non-2xx.

### `src/services/transactionService.ts`
- `fetchTransactions(days?: number)` — `GET /api/transactions`. Passes `?days=N` when provided. Returns `iTransactionsResponse`. Throws on non-2xx.

### `src/services/plaidService.ts` — addition
- `setAccountName(plaidAccountId, customName)` — `PUT /api/plaid/account/:plaidAccountId/name`. Returns `void`. Throws a typed error with the response status on non-2xx.

### `src/hooks/useQuickAccountOverview.ts`
Returns `{ status: tStatus, accounts: iAccountWithTransactions[], relinkRequired: iRelinkSignal[], retry, refetchBalance }`.

Two-effect pattern:

**Main effect** (depends on `[user, fetchCount]`): runs `Promise.all([fetchBalance(), fetchTransactions(30)])` in parallel. On success sets all raw state and transitions to `'success'`. On error transitions to `'error'` and fires an error toast. `retry()` resets status to `'idle'` and increments `fetchCount`.

**Balance-only effect** (depends on `[user, balanceFetchCount]`): skips when `balanceFetchCount === 0`. Calls `fetchBalance()` silently (no spinner) to refresh account names after `setAccountName` succeeds. On error fires an error toast asking the user to reload. `refetchBalance()` increments `balanceFetchCount`.

Derived state via `useMemo`:
- `accounts`: maps `rawAccounts` → `iAccountWithTransactions[]`. Each account's `transactions` is the subset of `rawTransactions` matching `accountId`, sorted descending by date. `lastDeposit` is the first transaction with `amount < 0` (credits from the user's perspective).
- `relinkRequired`: union of `balanceRelinkRequired` and `transactionRelinkRequired`.

Status derivation: public `status` is `'loading'` when `user` is non-null and internal status is `'idle'`; otherwise mirrors internal status. When `user` is null, status is `'idle'`.

Both effects use a `cancelled` flag to prevent state updates after unmount.

### `src/components/CustomAccountNameModal/CustomAccountNameModal.tsx`
PrimeReact `Dialog` for setting or editing an account's custom display name.

Props (`iCustomAccountNameModalProps`): `visible`, `onHide`, `accountId`, `institutionName`, `subtype`, `currentCustomName`, `onSuccess`.

**Prefill logic** (runs on `visible` change): when opened, sets the input value to:
1. `currentCustomName` if non-null
2. `"${institutionName} - ${Subtype}"` (subtype title-cased) if subtype is non-null
3. `institutionName` otherwise

**Save flow**: calls `setAccountName(accountId, inputValue)`, then calls `onSuccess(inputValue)` and closes the modal. On error, shows a toast: "Account not found" for 404, generic message otherwise.

### `src/components/CustomAccountNameButton/CustomAccountNameButton.tsx`
Thin button wrapper that owns modal-open state.

Props (`iCustomAccountNameButtonProps`): `accountId`, `institutionName`, `subtype`, `currentCustomName`, `onSuccess`, `buttonProps?: Omit<ButtonProps, 'label' | 'onClick'>`.

Label: `'Edit Name'` when `currentCustomName` is non-null, `'Add Name'` otherwise. `buttonProps` is spread onto `<Button>` before `label` and `onClick` so callers cannot accidentally override those.

Renders `<CustomAccountNameModal>` co-located; `onSuccess` calls the prop and closes the modal.

### `src/components/QuickAccountOverview/QuickAccountOverview.tsx`
Dashboard accordion listing all linked Plaid accounts.

States:
- **Auth loading / no user**: renders `<Skeleton />`.
- **Loading**: opaque mask + `<ProgressSpinner />`.
- **Error**: opaque mask + retry button; clicking calls `retry()`.
- **Empty** (no accounts after successful fetch): centered `.quick-account-overview__empty-state` div with "Get started with Banksy by linking your accounts" message + `<LinkAccount />` button.
- **Success**: PrimeReact `<Accordion>` (single-select, all closed by default) with one panel per account. On mobile (`!isDesktop()`) with 5 or more accounts the Accordion is wrapped in `<ScrollPanel className="quick-account-overview__scroll-panel" style={{ height: '100%' }}>`. `.quick-account-overview` has `height: 100%` to establish a concrete containing-block height for the ScrollPanel.

Each accordion **header** shows the formatted account label: custom name when set; otherwise `"${institutionName} - ${Subtype}"` (subtype title-cased) when subtype is non-null; otherwise just `institutionName`.

Each accordion **panel** (`AccountPanel` sub-component) shows:
- Bank name row
- Account Name row with `<CustomAccountNameButton>` and optional custom name span
- Last deposit row (absolute value of `lastDeposit.amount` formatted as currency, or `—`)
- Balance row (`currentBalance` formatted as currency, or `—` for null)
- `<CustomAccountNameButton>` — `onSuccess` calls `hook.refetchBalance()` to silently refresh
- Recent transactions list (up to 3 on mobile, up to 5 on desktop — `isDesktop()` called inline at render time)
- "Detailed View" link (placeholder href)

**Amount display convention:** `amount > 0` is a debit (money out) — displayed as `"-$X.XX"` with class `--debit` (red). `amount < 0` is a credit (money in) — displayed as `"$X.XX"` (absolute value) with class `--credit` (green). `lastDeposit.amount` is always negative by construction (filtered to `amount < 0`), so the last deposit value is always shown as positive absolute value.

---

## Routing Table

Routes are defined in `src/App.tsx`. Update this table whenever a route is added or removed.

| Path | Component | Description |
|------|-----------|-------------|
| `/` | redirect | Permanently redirects to `/dashboard` |
| `/dashboard` | `HomepagePage` | Dashboard — monthly spending chart (MonthlyGlance), next scheduled deposit panel (ScheduledDeposits), and linked account overview (QuickAccountOverview) |
| `/account` | `AccountPage` | Account Actions page — H1, description, and a grid of account management buttons (Link Account) |
| `/settings` | `SettingsPage` | Settings page — logout button (initial implementation) |

---

## Git Branching Model

```
main      ← stable/release only. Never commit directly.
  └── develop  ← integration branch. Never commit directly.
        └── feature/my-feature  ← branch off develop, PR back into develop
```

- Feature branches are always cut from `develop`
- PRs merge into `develop`; `develop` merges into `main` for releases

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
