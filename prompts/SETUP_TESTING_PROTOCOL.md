# Rules and Standards Prompt — TypeScript / React Frontend

Use this prompt after the hooks are in place. It establishes the testing policy,
architecture rules, and API consumption contract that the frontend agent must follow
in every session. Paste it as a follow-up message (or as a second block in your
first message) when setting up the frontend project.

---

## Prompt

I want you to establish the rules, testing policy, and architecture standards for
this TypeScript/React project. This frontend consumes a Spring Boot REST API called
**Banksy**. Read all sections before doing anything. After reading, create the
required files described at the end.

---

### 1. Testing Policy

This project is portfolio-quality and must reflect industry best practices.
**All code must be tested. No exceptions.**

#### Coverage

- Minimum **80% line coverage and 80% branch coverage** on all testable code.
- Coverage is enforced by Vitest with `@vitest/coverage-v8`.
- A session is not done until coverage passes. The definition-of-done hook enforces
  this automatically — do not attempt to mark work complete if it is failing.

#### Testing Stack (mandatory — do not introduce alternatives without approval)

| Tool | Purpose |
|------|---------|
| Vitest | Test runner and coverage |
| React Testing Library (`@testing-library/react`) | Component rendering and interaction |
| `@testing-library/user-event` | Simulating realistic user interactions |
| `@testing-library/jest-dom` | Custom DOM matchers (`toBeInTheDocument`, etc.) |
| MSW (`msw`) | Mocking HTTP requests to the Banksy backend |
| `vitest-fetch-mock` or MSW | Mocking `fetch` in unit tests |

Do not use `enzyme`, `shallow`, `jest`, or any test runner other than Vitest.
Do not mock `fetch` with hand-rolled mocks when MSW can do the job.

#### Required Test Types

**Unit tests (~70% of all tests):**
- Custom hooks (test in isolation using `renderHook`)
- Store logic (Zustand actions, Context reducers)
- Utility and helper functions
- Any function that contains a conditional or maps/transforms data

**Integration tests (~30% of all tests):**
- React components — render the component, interact with it via `userEvent`, assert
  on what the user actually sees (text, roles, form state)
- Use MSW handlers to simulate backend responses so components can be tested with
  realistic data flow
- Test the full data path: MSW response → hook/service → component output

**Not required:**
- End-to-end (E2E) tests (Playwright, Cypress) are NOT required for this project.

#### What Does Not Need a Test

The following files are exempt from coverage and do not require a co-located test:
- `*.config.ts`, `*.config.tsx`, `vite.config.ts`, `vitest.config.ts`
- `main.tsx`
- `*.d.ts`
- `index.ts`, `index.tsx` (barrel/re-export files only)
- `*.types.ts`, `types.ts`
- Files inside `src/types/`, `src/assets/`, `src/styles/`

#### Test Design Standards

**Structure — follow the Arrange / Act / Assert pattern in every test:**
```ts
it('should display balance when data loads', async () => {
  // Arrange
  server.use(handlers.balance.success)

  // Act
  render(<BalancePage />)

  // Assert
  expect(await screen.findByText('$1,234.56')).toBeInTheDocument()
})
```

**Naming — every test name must follow this format:**
```
should<ExpectedBehavior>_when<Condition>
```
Examples:
- `shouldDisplayRelinkBanner_whenRelinkRequiredIsNonEmpty`
- `shouldRedirectToLogin_whenApiReturns401`
- `shouldDisableSubmitButton_whenFormIsInvalid`

**Assertions:**
- Multiple assertions are allowed when they validate a single logical behavior.
- Prefer `screen.getByRole`, `screen.findByText`, and `screen.queryByRole` over
  querying by class name or test ID. Test what the user sees, not implementation details.
- Never assert on component state directly — assert on rendered output.

**MSW setup:**
- Define all MSW handlers in a shared `src/mocks/handlers.ts` file grouped by
  domain (e.g. `handlers.balance`, `handlers.transactions`, `handlers.auth`).
- Set up and tear down the MSW server in `src/mocks/server.ts` using
  `setupServer` from `msw/node`.
- Each handler should have at least a `success` and `error` variant.

#### Document Lifecycle (enforced by hooks)

Before any implementation:
- `plans/<feature-name>/IMPLEMENTATION_PLAN.md`
- `plans/<feature-name>/TEST_PLAN.md`
- `plans/<feature-name>/DIAGRAMS.md`

After implementation (written automatically by the definition-of-done hook):
- `testing/<feature-name>/TEST_REPORT.md`
- `testing/<feature-name>/FIX_PLAN.md` — only if tests fail or coverage < 80%

#### CI/CD

No CI/CD pipeline exists yet. When asked to create one, remind the user that:
- Tests must run on every pull request
- Coverage must be validated in CI
- The build must fail if: any test fails, line coverage < 80%, or branch coverage < 80%

---

### 2. Architecture Rules

Every file in this project belongs to one of five layers. The rules below are
enforced during code review and by the hooks.

#### Layer 1 — Pages / Views (`src/pages/` or `src/views/`)

**Role:** Top-level route components. Receive route params, call hooks, compose
layout components. Think of these like Controllers in the backend — they wire
things together but contain no logic themselves.

**Rules:**
- MAY call custom hooks to fetch data or dispatch actions.
- MAY NOT call API service functions directly — all network calls go through hooks.
- MAY NOT contain business logic (conditionals about data shape, transformations).
  If you are writing a `.map()` or `.filter()` that is not about rendering a list,
  it belongs in a hook or utility.
- MAY NOT manage global state directly — use a store or context hook.

#### Layer 2 — Components (`src/components/`)

**Role:** Reusable UI pieces. Receive props, render markup, emit events upward.

**Rules:**
- MAY NOT call API service functions directly.
- MAY NOT own data-fetching logic. If a component needs data, the parent page
  fetches it and passes it down as props, or a co-located hook handles it.
- MAY contain display-level conditionals (`isLoading`, `isError`, `isEmpty`).
- MUST be accessible: use semantic HTML elements and ARIA roles where appropriate.

#### Layer 3 — Hooks (`src/hooks/`)

**Role:** Custom React hooks that encapsulate data-fetching, state management,
and side effects. Think of these like Services in the backend — they contain
the business logic and orchestration.

**Rules:**
- MAY call API service functions.
- MAY read from and write to stores/contexts.
- MAY NOT return JSX or render anything.
- Data-fetching hooks MUST handle loading, error, and success states explicitly.
- A hook that fetches data MUST also surface any `relinkRequired` signals returned
  by the backend (see Section 3).

#### Layer 4 — API Services (`src/services/` or `src/api/`)

**Role:** Functions that call the Banksy backend. One module per backend domain
(e.g. `balanceService.ts`, `transactionsService.ts`, `plaidService.ts`,
`authService.ts`). Think of these like the HTTP client layer — they are the only
files that may know about backend endpoint URLs.

**Rules:**
- ALL `fetch` or `axios` calls to the Banksy backend MUST live here. No other file
  may call the backend directly.
- Every request MUST include `credentials: 'include'` so the session cookie is sent.
- Every service function MUST check the response status. On `401`, call the shared
  `handleUnauthorized()` utility (redirect to login). On other non-2xx, throw a
  typed error with the status code and a human-readable message.
- Backend base URL MUST come from `import.meta.env.VITE_API_BASE_URL`. Never
  hardcode `localhost:8080` in service files.
- Service functions MUST be plain async functions — not hooks, not classes.

Example:
```ts
// src/services/balanceService.ts
export async function fetchBalance(): Promise<BalanceResponse> {
  const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/balance`, {
    credentials: 'include',
  })
  if (res.status === 401) { handleUnauthorized(); throw new Error('Unauthorized') }
  if (!res.ok) throw new ApiError(res.status, await res.text())
  return res.json()
}
```

#### Layer 5 — Types (`src/types/`)

**Role:** TypeScript interfaces and type aliases that mirror the backend's response
shapes. These are the source of truth for what the API returns.

**Rules:**
- MUST be plain type/interface declarations — no logic, no runtime code.
- When the backend adds or changes a response shape, update the corresponding type
  here first before changing any component or service.
- Do NOT define inline types inside service files or components. All shared types
  live in `src/types/`.

#### Utilities (`src/utils/`)

- Stateless helper functions only. No React imports, no hooks, no API calls.
- Every utility function must have a unit test.

---

### 3. Banksy API Contract

The backend runs at the URL stored in `VITE_API_BASE_URL` (typically
`http://localhost:8080` for local dev).

**Authentication:** All `/api/*` endpoints require a valid session. The session
is established via Google OAuth2. To log in, the frontend redirects the user to:
```
${VITE_API_BASE_URL}/oauth2/authorization/google
```
The backend handles the OAuth callback and sets a session cookie. All subsequent
API requests send this cookie automatically when `credentials: 'include'` is set.
A `401` response on any endpoint means the session has expired — redirect to login.

**CORS:** The backend allows credentialed requests from `localhost:3000` and
`localhost:5173`. Do not change the dev server port without updating the backend's
`WebConfig`.

#### Endpoints

| Method | Path | What it does |
|--------|------|-------------|
| `GET` | `/api/auth/me` | Returns the current user's profile. Call this on app load to determine if the user is logged in. |
| `POST` | `/api/auth/logout` | Invalidates the session. Redirect to login page on success. |
| `GET` | `/api/balance` | Returns balances for all linked accounts plus a `relinkRequired` list. |
| `GET` | `/api/transactions?days=N` | Returns transactions for the past N days (default 30) plus a `relinkRequired` list. |
| `GET` | `/api/plaid/link-token` | Gets a Plaid Link token to open the initial bank connection flow. |
| `GET` | `/api/plaid/link-token/refresh/{itemId}` | Gets an update-mode link token for a `NEEDS_REAUTH` item. Use when `errorType` is `LOGIN_REQUIRED` and `canRelink` is true. |
| `GET` | `/api/plaid/link-token/full-relink/{itemId}` | Gets a fresh link token for an `INVALID_TOKEN` item. Use when `errorType` is `INVALID_TOKEN` and `canRelink` is true. |
| `POST` | `/api/plaid/exchange` | Exchanges a Plaid public token after the Link flow completes. Body: `{ publicToken, institutionId, institutionName, expiredItemId? }`. |
| `POST` | `/api/plaid/share` | Shares a bank connection with another user. Body: `{ plaidItemId, shareWithEmail }`. |
| `GET` | `/api/plaid/status` | Returns per-item health status. Call at login to determine if any relinks are needed before loading data. |
| `PUT` | `/api/plaid/account/{plaidAccountId}/hide` | Soft-hides one account. Hidden accounts are excluded from balance and transaction responses. |
| `DELETE` | `/api/plaid/item/{plaidItemId}` | Fully removes a bank connection from Plaid and the database. Any linked user (owner or shared) may call this. |

#### Response Types

```ts
// src/types/api.ts

export interface UserProfile {
  id: string
  email: string
  firstName: string
  lastName: string
  username: string
}

export interface Account {
  name: string
  type: string | null
  subtype: string | null
  currentBalance: number | null
  availableBalance: number | null
  currency: string | null
}

export interface Transaction {
  date: string         // ISO date string "YYYY-MM-DD"
  name: string
  amount: number       // positive = debit, negative = credit/refund
  currency: string | null
  category: string[]   // Plaid category hierarchy
}

export type RelinkErrorType = 'LOGIN_REQUIRED' | 'INVALID_TOKEN'

export interface RelinkSignal {
  plaidItemId: string
  institutionName: string
  errorType: RelinkErrorType
  canRelink: boolean      // true only if this user is the bank's owner
  ownerName: string | null // populated when canRelink is false
  message: string
}

export interface BalanceResponse {
  accounts: Account[]
  relinkRequired: RelinkSignal[]
}

export interface TransactionsResponse {
  transactions: Transaction[]
  total: number
  relinkRequired: RelinkSignal[]
}
```

#### RelinkSignal Handling — mandatory

Every hook that calls `/api/balance` or `/api/transactions` MUST surface the
`relinkRequired` array to the UI. The UI MUST respond as follows:

| Condition | UI behavior |
|-----------|------------|
| `relinkRequired` is non-empty | Show a relink banner or modal for each signal |
| `canRelink: true`, `errorType: LOGIN_REQUIRED` | Show "Reconnect" button — calls `/api/plaid/link-token/refresh/{itemId}` then opens Plaid Link |
| `canRelink: true`, `errorType: INVALID_TOKEN` | Show "Re-link" button — calls `/api/plaid/link-token/full-relink/{itemId}` then opens Plaid Link |
| `canRelink: false` | Show read-only message using `ownerName` and `message` — this user cannot relink |
| Any relink signal | ALWAYS offer a "Remove this bank" option alongside the relink option — calls `DELETE /api/plaid/item/{plaidItemId}` |

After a successful Plaid Link completion:
- Call `POST /api/plaid/exchange` with the `publicToken` from Plaid's `onSuccess`
  callback.
- If re-linking an expired item, also pass `expiredItemId`.
- Then refresh the balance and transaction data.

---

### 4. Pre-Deployment Checklist

Do not deploy this frontend until every item is checked off.

- [ ] `VITE_API_BASE_URL` is set in the deployment environment's secrets/env vars —
      never hardcoded in source files
- [ ] `.env` files containing real values are in `.gitignore` and have never been
      committed to the repo
- [ ] All API calls use `credentials: 'include'`
- [ ] `401` responses redirect to the login page globally (not per-component)
- [ ] The Google OAuth login redirect URL matches what is registered in the Google
      Cloud Console and the backend's `application.properties`
- [ ] CORS origin is updated in the backend's `WebConfig` to match the production
      frontend URL (not just `localhost`)
- [ ] Coverage ≥ 80% line and branch — enforced in CI before any deploy
- [ ] No `console.log` statements left in production code

---

### 5. What to Create Now

After reading all of the above, create these files in the repository:

**`plans/Testing/TESTING_POLICY.md`**
Write the full testing policy from Section 1 into this file exactly as written.
Do not summarize. This file is the single source of truth for testing standards.

**`documentation/ARCHITECTURE.md`**
Write the full architecture rules from Section 2, the API contract from Section 3,
and the pre-deployment checklist from Section 4 into this file. Structure it with
clear headings. This file is what the hooks check for component documentation —
keep it up to date as new components, hooks, and services are added.

**`CLAUDE.md`**
If a `CLAUDE.md` does not already exist, create one with:
- Project name and tech stack (TypeScript, React, Vite, Vitest)
- The commands section (dev server, test, coverage, build)
- A reference to `plans/Testing/TESTING_POLICY.md` and `documentation/ARCHITECTURE.md`
- The active feature tracking rules (same as the backend's CLAUDE.md)

If `CLAUDE.md` already exists (created by the hooks setup prompt), append the
commands section and references — do not overwrite the active feature tracking rules.

Do not start any feature implementation until all three files exist and you have
confirmed their contents back to me.