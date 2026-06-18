# Banksy Frontend — CLAUDE.md

## SECTION 1 — PROJECT IDENTITY (locked)

- Runtime: React 19, TypeScript, Vite
- UI library: PrimeReact 10, themes: Lara Light Blue / Lara Dark Blue (toggled dynamically)
- HTTP: axios-hooks (`useAxios`) for data fetching in hooks; `apiClient` (Axios instance from `src/api/client.ts`) for mutations in services
- Auth: Google OAuth2 via Spring Boot backend — session cookie (`JSESSIONID`); no client-side token handling
- Financial data: Plaid Link SDK (modal invocation only); backend owns all Plaid API calls
- Test stack: Vitest, React Testing Library (`@testing-library/react`), MSW (`msw`), `@testing-library/user-event`, `@testing-library/jest-dom`
- Dev server port: **5173** — do not change without updating backend `WebConfig` CORS

---

## SECTION 2 — BUILD COMMANDS (locked)

```
npm start               — start Vite dev server (port 5173)
npm test                — run all tests once with Vitest
npm run test:watch      — run tests in watch mode
npm run test:coverage   — run tests with coverage report
npm run build           — type-check and production build
npm run lint            — run ESLint
```

---

## SECTION 3 — LAYER RULES (locked, hard constraints)

### Layer 1 — Pages / Views (`src/pages/` or `src/views/`)

- MUST delegate data fetching and mutations to custom hooks
- MUST NOT call `useAxios` directly
- MUST NOT call `apiClient` or any service function directly
- MUST NOT contain business logic (maps, filters, transforms on response data)
- MUST NOT manage global state directly — MUST use a context hook

### Layer 2 — Components (`src/components/`)

- MUST NOT call `useAxios` directly
- MUST NOT call `apiClient` or any service function directly
- MUST NOT own data-fetching logic — data MUST come from props or a co-located hook
- MUST use semantic HTML and ARIA roles where appropriate

### Layer 3 — Hooks (`src/hooks/`)

- MUST use `useAxios` (axios-hooks) for all data fetching — MUST NOT use raw `fetch` or a separately configured Axios instance
- MUST NOT call `apiClient` directly — MUST call service functions for mutations
- MUST NOT return JSX
- Data-fetching hooks MUST expose `loading`, `error`, and `data` states
- Data-fetching hooks MUST surface any `relinkRequired` signals returned by the backend

### Layer 4 — Service Functions (`src/services/`)

- MUST use `apiClient` from `src/api/client.ts` for all mutations (POST, PUT, DELETE) — MUST NOT use raw `fetch` or a separately configured Axios instance
- MUST be plain `async` functions — MUST NOT be hooks or classes
- MUST throw a typed error with status code and message on non-2xx responses (302 is handled automatically by the browser — do not re-check)
- MUST NOT be called directly from a component or page — only hooks may call service functions

### Layer 5 — Types (`src/types/`)

- MUST contain plain type/interface declarations only — MUST NOT contain runtime code
- All shared types MUST live in `src/types/types.ts` — MUST NOT be defined inline in component or service files
- MUST be updated first when the backend changes a response shape

### Utilities (`src/utils/`)

- MUST be stateless pure functions — MUST NOT import React, use hooks, or make API calls
- MUST NOT have side effects
- Every utility function MUST have a unit test

---

## SECTION 4 — EXISTING COMPONENTS (locked)

**Before creating any new file, scan every table in this section for overlap. If something already exists, extend it — do not duplicate it.**

### Table A: Components

| Name | File | Props interface | Description |
|------|------|-----------------|-------------|
| `Layout` | `src/components/Layout/Layout.tsx` | `iLayoutProps` | Full-app shell. Renders `AppHeader`, `AppSidebar` (mobile only), backdrop overlay, global `Toast` and `Message` banner, `<main>` body. Renders `ViewportMask` outside the layout div. Owns sidebar open/close state. Calls `useNotify()`. |
| `AppHeader` | `src/components/AppHeader/AppHeader.tsx` | `iAppHeaderProps` | Responsive header. Mobile: hamburger button + current page name. Desktop: brand logo link + floating pill Menubar + page name + welcome text. Reads `useAuth()` and `useTheme()`. |
| `AppSidebar` | `src/components/AppSidebar/AppSidebar.tsx` | `iAppSidebarProps` | Mobile-only sliding sidebar panel. CSS `transform` animation. Contains close button, user info, nav items, copyright. Locks body scroll when open. Hidden on desktop via CSS. |
| `AuthButton` | `src/components/AuthButton/AuthButton.tsx` | — (`forwardRef`) | Login/Logout PrimeReact Button. Reads `useAuth()`. Login: sets `banksy_login_pending` in sessionStorage → redirects to Google OAuth. Logout: redirects to `/logout`. Exposes `iAuthButtonHandle` ref with `focus()` method. |
| `ViewportMask` | `src/components/ViewportMask/ViewportMask.tsx` | — | Full-viewport auth gate. Returns `null` when authenticated. Shows `ProgressSpinner` while loading; login prompt + `AuthButton` when unauthenticated. On failed login: fires error toast + focuses auth button via `iAuthButtonHandle` ref. |
| `MonthlyGlance` | `src/components/MonthlyGlance/MonthlyGlance.tsx` | — | Chart.js line chart (react-chartjs-2) showing cumulative monthly spending vs. hardcoded $2,000 budget. States: Skeleton (auth loading), ProgressSpinner (fetching), retry button (error), Line chart (success). Custom `splitBackground` canvas plugin. Delegates data to `useMonthlyGlance`. |
| `ScheduledDeposits` | `src/components/ScheduledDeposits/ScheduledDeposits.tsx` | — | PrimeReact Accordion listing upcoming scheduled deposits. States: Skeleton, ProgressSpinner, retry button, empty-state message, Accordion. 1 item on mobile / 5 on desktop. Delegates data to `useScheduledDeposits`. |
| `LinkAccount` | `src/components/LinkAccount/LinkAccount.tsx` | — | Multistate "Link Account" PrimeReact Button. Default: enabled, label "Link Account". Loading: disabled with spinner. Delegates all logic to `useLinkAccount`. |

### Table B: Pages

| Name | File | Route | Description |
|------|------|-------|-------------|
| `HomepagePage` | `src/components/Homepage/HomepagePage.tsx` | `/dashboard` | Dashboard page. Renders `MonthlyGlance` (spending-trend graph section) and `ScheduledDeposits` (next-deposit region). Contains a placeholder accounts section. |
| `AccountPage` | `src/components/Account/AccountPage.tsx` | `/account` | Account Actions page. H1, description, and an actions grid containing `LinkAccount`. |
| `SettingsPage` | `src/components/Settings/SettingsPage.tsx` | `/settings` | Minimal settings page. H1 + `AuthButton`. |

### Table C: Hooks

| Name | File | Return shape | Description |
|------|------|-------------|-------------|
| `useMonthlyGlance` | `src/hooks/useMonthlyGlance.ts` | `{ status: tStatus, data: iMonthlyGlanceDataPoint[], retry: () => void }` | Fetches monthly glance data via `fetchMonthlyGlance` when user is present. Converts raw `dailyTotals` to cumulative data points. Error triggers toast. `retry()` re-triggers fetch. Cancels in-flight requests on unmount. |
| `useScheduledDeposits` | `src/hooks/useScheduledDeposits.ts` | `{ status: tStatus, deposits: iScheduledDeposit[], retry: () => void }` | Fetches scheduled deposits via `fetchScheduledDeposits` when user is present; filters to `isActive` items. Error triggers toast. `retry()` re-triggers fetch. Cancels in-flight requests on unmount. |
| `useLinkAccount` | `src/hooks/useLinkAccount.ts` | `{ isLoading: boolean, initiateLinkFlow: () => void }` | Orchestrates Plaid bank link flow. Calls `fetchLinkToken`, opens Plaid modal via `usePlaidLink`, handles `onSuccess` (exchange token + success toast) and `onExit` (error toast on Plaid error). |

### Table D: Services

| Name | File | Method + endpoint | Description |
|------|------|-------------------|-------------|
| `fetchMe` | `src/services/authService.ts` | `GET /api/auth/me` | Returns `iUser`. Called by `AuthProvider` on mount to hydrate session state. Throws on any non-2xx. |
| `fetchMonthlyGlance` | `src/services/monthlyGlanceService.ts` | `GET /api/monthly-glance` | Returns `iMonthlyGlanceResponse`. Called by `useMonthlyGlance`. Throws on non-2xx. |
| `fetchScheduledDeposits` | `src/services/scheduledDepositsService.ts` | `GET /api/recurring/scheduled-deposits` | Returns `iScheduledDeposit[]`. Called by `useScheduledDeposits`. Throws on non-2xx. |
| `fetchLinkToken` | `src/services/plaidService.ts` | `GET /api/plaid/link-token` | Returns `iPlaidLinkTokenResponse`. Called by `useLinkAccount` to start a new bank link. Throws `{ status: 500 }` on server error. |
| `exchangePublicToken` | `src/services/plaidService.ts` | `POST /api/plaid/exchange` | Exchanges Plaid public token after `onSuccess`. Returns `iPlaidExchangeResponse`. Throws `{ status: 500 }` on server error. |

### Table E: Contexts

| Name | File | State it holds | Description |
|------|------|----------------|-------------|
| `ThemeProvider` / `useTheme` | `src/contexts/ThemeContext.tsx` | `theme`, `toggleTheme` | Manages light/dark theme. Reads `localStorage` and `prefers-color-scheme`. Injects/swaps PrimeReact theme `<link>`. Lives in `main.tsx`. |
| `AuthProvider` / `useAuth` | `src/contexts/AuthContext.tsx` | `user`, `isLoading`, `clearUser` | Stores authenticated `iUser` or `null`. Calls `fetchMe` on mount. Lives in `App.tsx` wrapping `<Layout>`. |
| `NotificationProvider` / `useNotify` | `src/contexts/NotificationContext.tsx` | `toastRef`, `showToast`, `toastConfig`, `triggerToast`, `hideToast`, `showBanner`, `bannerConfig`, `triggerBanner`, `hideBanner` | Global notification system. Toast state (ref + show/config) and banner state are fully independent. Lives in `App.tsx` wrapping `<Layout>` alongside `AuthProvider`. |

### Table F: Infrastructure

| Name | File | Type | Description |
|------|------|------|-------------|
| `apiClient` | `src/api/client.ts` | API client | Axios instance with `withCredentials: true` and `baseURL: import.meta.env.VITE_API_BASE_URL`. Configures axios-hooks. Session expiry handled by server `302` redirect — no client-side interceptor needed. |
| `server` | `src/mocks/server.ts` | Test infra | MSW server instance for tests. Uses `defaultHandlers`. |
| `handlers` | `src/mocks/handlers.ts` | Test infra | All MSW handlers grouped by domain: `auth`, `balance`, `transactions`, `plaid`, `scheduledDeposits`, `monthlyGlance`, `dev`. Each has `success` and `serverError` variants. Dev handlers are internal tooling only — never wire to UI. |

### Table G: Shared Types

| Name | Kind | Description |
|------|------|-------------|
| `iUser` | interface | Authenticated user returned by `GET /api/auth/me` |
| `iPlaidLinkTokenResponse` | interface | `GET /api/plaid/link-token` response: `{ link_token: string }` |
| `iPlaidExchangeRequest` | interface | `POST /api/plaid/exchange` request body: `publicToken`, `institutionId`, `institutionName`, `expiredItemId` (null for new links) |
| `iPlaidExchangeResponse` | interface | `POST /api/plaid/exchange` response: `{ status: 'ok', message: string }` |
| `iMonthlyGlanceDailyTotal` | interface | Raw API row: `{ transactionDate: string, total: number }` |
| `iMonthlyGlanceResponse` | interface | `GET /api/monthly-glance` response: `{ dailyTotals: iMonthlyGlanceDailyTotal[], relinkRequired: unknown[] }` |
| `iMonthlyGlanceDataPoint` | interface | Derived UI type from `useMonthlyGlance`: `{ date, cumulative, daily }` — running totals built from `iMonthlyGlanceDailyTotal` |
| `iScheduledDepositAmount` | interface | Monetary value with currency: `{ amount: number, isoCurrencyCode: string }` |
| `iScheduledDeposit` | interface | Recurring deposit stream: `merchantName`, `description`, `frequency`, `firstDate`, `lastDate`, `predictedNextDate`, `averageAmount`, `lastAmount`, `isActive`, `personalFinanceCategory`, `status` |
| `tRelinkErrorType` | type alias | `"LOGIN_REQUIRED" \| "INVALID_TOKEN"` |
| `iRelinkSignal` | interface | Relink signal returned on balance, transactions, and plaid/status: `plaidItemId`, `institutionName`, `errorType`, `canRelink`, `ownerName`, `message` |

---

## SECTION 5 — WHAT NOT TO DO (locked)

❌ Do not use raw fetch — always use useAxios (hooks) or apiClient (services)
❌ Do not configure a second Axios instance — use the shared apiClient from src/api/client.ts
❌ Do not call apiClient directly from a component or page — mutations belong in service functions in src/services/
❌ Do not call useAxios directly from a component or page — data fetching belongs in hooks in src/hooks/
❌ Do not use useRef to store a value that should drive rendering — use useState or useMemo instead; useRef is for DOM references and values that must not trigger re-renders
❌ Do not use useCallback to compute or derive a value — use useMemo; useCallback memoizes a function reference, not a computed result
❌ Do not use useEffect to derive state from other state — compute it inline or with useMemo; derived state in useEffect creates stale-value bugs
❌ Do not create a new context without asking first — raise state to a common ancestor before reaching for a context
❌ Do not hardcode color values in SCSS — use CSS custom properties (var(--name))
❌ Do not import component SCSS directly in TypeScript — all SCSS is imported through src/styles/index.scss
❌ Do not use class components — functional components only
❌ Do not add JSX to a hook — hooks return data and callbacks, never markup
❌ Do not use React Context for server state — hooks own data fetching
❌ Do not define shared types inline in component or service files — all shared types live in src/types/types.ts
❌ Do not hardcode VITE_API_BASE_URL — always read from import.meta.env
❌ Do not add a library to solve a problem if an existing library already exposes the functionality — check PrimeReact props, slots, and utilities first before writing custom logic or introducing a new dependency

---

## SECTION 6 — LIBRARY-FIRST RULE (locked)

### PrimeReact

Before writing any custom UI logic, component, or style, check whether PrimeReact already exposes the needed behavior as a prop, slot, template, or built-in feature.

- MUST use PrimeReact's exposed API before building custom alternatives
- MUST check the PrimeReact 10 documentation for the specific component before implementing any interaction, layout, or style behavior
- MUST NOT replicate functionality that PrimeReact already provides (e.g. loading states, disabled states, icon slots, overlay panels, tooltips, accordion behavior)
- MAY write custom logic only when PrimeReact's built-in provisions are genuinely inadequate for the requirement — document why in a code comment

### React hooks

Use the correct hook for the job. Wrong hook usage is a hard violation:

| Need | Correct hook | Common wrong choice |
|------|-------------|---------------------|
| Derived/computed value | `useMemo` | `useCallback`, `useEffect + useState` |
| Memoized function reference | `useCallback` | `useMemo` |
| Side effect (fetch, subscription) | `useEffect` | — |
| DOM reference or non-render value | `useRef` | `useState` |
| Shared UI state | `useState` | `useRef` |

### Other libraries

- Evaluate a new library only if no existing dependency covers the need
- If a library is added, document the reason in the plan documents before implementing

---

## SECTION 7 — NAMING CONVENTIONS (locked)

| Type | Convention | Example |
|------|------------|---------|
| Interface | `i` prefix, PascalCase | `iButtonProps`, `iUser` |
| Type alias | `t` prefix, PascalCase | `tVariant`, `tRelinkErrorType` |
| Component | PascalCase file, default export | `Button.tsx` |
| Page component | PascalCase + `Page` suffix (when sharing a folder with a same-name component) | `DashboardPage.tsx` |
| Context | PascalCase + `Context` suffix, named export | `AuthContext.tsx` |
| Hook | camelCase + `use` prefix, named export | `useBalance.ts` |
| Service | camelCase file | `plaidService.ts` |
| Utility | camelCase file | `formatCurrency.ts` |
| SCSS file | camelCase, matching the component name | `button.scss` |

**Export rule:** Default exports for components. Named exports for contexts and hooks.

---

## SECTION 8 — TYPESCRIPT RULES (locked)

- `i` prefix for interfaces (`iUser`, `iButtonProps`); `t` prefix for type aliases (`tVariant`, `tRelinkErrorType`)
- All shared types live in `src/types/types.ts`; local-only types go at the top of the file that uses them
- Use `interface` for object shapes; use `type` for unions and aliases
- Use `import type` syntax for type-only imports
- Every interface property that has a default value MUST include a `/** @default <value> */` JSDoc comment
- Strict mode is enabled — do not disable TypeScript checks

---

## SECTION 9 — SCSS RULES (locked)

- All SCSS files MUST be imported through `src/styles/index.scss` — MUST NOT import component SCSS directly in TypeScript files
- Component SCSS lives in the component's folder; reference variables with a relative path (`../../styles/variables.scss`)
- MUST use CSS custom properties (`var(--primary-color)`) — MUST NOT hardcode color values
- BEM naming: `.block`, `.block__element`, `.block--modifier`
- Maximum 2 levels of nesting
- Keyframe animations MUST be defined at the top of the relevant SCSS file, outside any selector
- No inline styles — use class names
- **PrimeReact overrides:** global overrides go in `src/styles/primeReactOverrides.scss`; scope dark-mode overrides under `[data-theme='dark']`; component-specific PrimeReact overrides may live in the component's own SCSS file

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
|------|-----------|--------|
| _(base)_ | 390px | iPhone 14, iPhone 17 — no breakpoint, base styles apply |
| `mobile-lg` | 412px | Pixel 10, Samsung S25+ — subtle width-sensitive adjustments |
| `landscape` | 844px | All target devices in landscape — layout unchanged (single column) |
| `desktop` | 1024px | Desktop — two-column body grid |

Widths below **390px** and widths **925px–1023px** are out of scope and do not need to be accommodated.

---

## SECTION 10 — TESTING RULES (locked)

### Coverage thresholds

- **80% line coverage and 80% branch coverage** — enforced by Vitest with `@vitest/coverage-v8`
- A session is not done until coverage passes

### Testing strategy per layer

**Services → MSW handlers:**
- Test each service function directly against an MSW handler
- Override per-test with `server.use(handlers.domain.variant)` to test error paths
- Assert on resolved/rejected value — do not test implementation details

**Hooks → `vi.mock` service functions and context hooks, `renderHook`:**
- Test each hook in isolation using `renderHook`
- MUST mock all service functions the hook calls via `vi.mock`
- MUST mock any context hooks consumed (`useAuth`, `useNotify`) via `vi.mock`
- Assert on returned values (`status`, `data`, `error`) and side effects (`triggerToast` calls)
- MUST NOT use MSW in hook tests

**Components → `vi.mock` hooks and context hooks, `render` + `userEvent`:**
- Render the component, interact via `userEvent`, assert on what the user sees
- MUST mock the hook the component depends on via `vi.mock` to drive state (loading/error/success)
- MUST mock context hooks (`useAuth`, `useNotify`) via `vi.mock`
- MAY mock complex child components (charts, third-party SDKs) with lightweight stubs when they would otherwise fail in jsdom
- MUST NOT use MSW in component tests

### Test file location

Co-located with the file being tested:
```
src/components/Button/Button.tsx
src/components/Button/Button.test.tsx
```

**Exception — contexts:** test files for `src/contexts/` live in `src/contexts/contextTests/`:
```
src/contexts/ThemeContext.tsx
src/contexts/contextTests/ThemeContext.test.tsx
```

### Exemption list (no test required)

- `*.config.ts`, `*.config.tsx`, `vite.config.ts`, `vitest.config.ts`
- `main.tsx`
- `*.d.ts`
- `index.ts`, `index.tsx` (barrel/re-export files only)
- `*.types.ts`, `types.ts`
- All files under: `src/types/`, `src/assets/`, `src/styles/`, `src/mocks/`, `src/test/`

### Test structure

**Naming:** `describe` groups by component/state/scenario; `it()` descriptions complete the sentence "it ...". Do not use camelCase or `_when` separators in test names.

**AAA pattern (mandatory in every test):**
```ts
it('displays balance when data loads', async () => {
  // Arrange
  server.use(handlers.balance.success)
  // Act
  render(<BalancePage />)
  // Assert
  expect(await screen.findByText('$1,234.56')).toBeInTheDocument()
})
```

**Assertions:** prefer `screen.getByRole`, `screen.findByText`, `screen.queryByRole`. Never assert on component state directly — assert on rendered output.

### MSW handler structure

Handlers in `src/mocks/handlers.ts`, grouped by domain:
- Nested: `handlers.auth.me.success`, `handlers.auth.me.serverError`
- Nested: `handlers.plaid.linkToken.success`, `handlers.plaid.exchange.serverError`
- Flat: `handlers.balance.success`, `handlers.balance.serverError`
- Flat: `handlers.scheduledDeposits.success`, `handlers.scheduledDeposits.serverError`
- Flat: `handlers.monthlyGlance.success`, `handlers.monthlyGlance.serverError`

Some groups have additional variants: `withRelinkRequired`, `empty`, `unauthorized`, `forbidden`, `badRequest`.

Override per-test: `server.use(handlers.monthlyGlance.serverError)`.

**MSW is used in service tests only.** Hook and component tests MUST use `vi.mock` instead.

### Hard constraints

- Test file MUST exist before the implementation file
- MSW MUST NOT be used in hook or component tests
- `vi.mock` MUST be used (not MSW) in hook and component tests
- E2E tests (Playwright, Cypress) are NOT required
- Full data-path integration tests (MSW → service → hook → component) are NOT used — each layer is tested independently
- Canvas/chart rendering internals (Chart.js plugins, `buildChartData`, etc.) are third-party concerns — stub at the boundary and test only our integration with them; low coverage on canvas helpers is expected and acceptable

---

## SECTION 11 — CURRENT STATE

### Implemented (complete and tested)

**Components:**
- `src/components/Layout/Layout.tsx`
- `src/components/AppHeader/AppHeader.tsx`
- `src/components/AppSidebar/AppSidebar.tsx`
- `src/components/AuthButton/AuthButton.tsx`
- `src/components/ViewportMask/ViewportMask.tsx`
- `src/components/MonthlyGlance/MonthlyGlance.tsx`
- `src/components/ScheduledDeposits/ScheduledDeposits.tsx`
- `src/components/LinkAccount/LinkAccount.tsx`

**Pages:**
- `src/components/Homepage/HomepagePage.tsx` (route: `/dashboard`)
- `src/components/Account/AccountPage.tsx` (route: `/account`)
- `src/components/Settings/SettingsPage.tsx` (route: `/settings`)

**Hooks:**
- `src/hooks/useMonthlyGlance.ts`
- `src/hooks/useScheduledDeposits.ts`
- `src/hooks/useLinkAccount.ts`

**Services:**
- `src/services/authService.ts`
- `src/services/monthlyGlanceService.ts`
- `src/services/scheduledDepositsService.ts`
- `src/services/plaidService.ts`

**Contexts:**
- `src/contexts/ThemeContext.tsx`
- `src/contexts/AuthContext.tsx`
- `src/contexts/NotificationContext.tsx`

**Infrastructure:**
- `src/api/client.ts`
- `src/mocks/handlers.ts`
- `src/mocks/server.ts`
- `src/test/setup.ts`
- `src/types/types.ts`

### Known issues

None currently documented.

### Planned / in progress

<!-- !EXPERIMENTAL! REMOVE BEFORE USING IN PRODUCTION SESSIONS -->
**Quick Account Overview** (not yet implemented)
- Description: An accordion displaying all of the authenticated user's linked Plaid accounts. Each accordion item header shows the account name. The expanded panel shows the account balance and a short list of recent transactions, plus a link to the full account view.
- Status: High-level description only. No plan documents, no design, no API decisions made. Do not begin implementation without a full plan and approval.
<!-- !EXPERIMENTAL! END -->

---

## SECTION 12 — LIVING DOCUMENTS

These documents are the authoritative references. MUST be read at the start of every session before any implementation work begins.

| Document | When to read | Content |
|----------|-------------|---------|
| `_dev/ARCHITECTURE.md` | Before adding any new file, layer, or architectural pattern | Layers, rules, patterns, component detail, mobile-first rules, backend integration |
| `_dev/COMPONENTS.md` | Before creating any new file | Registry of every component, hook, service, context, utility, and shared type |
| `_dev/TESTING_POLICY.md` | Before writing any test file | Testing stack, strategy, conventions, and exemptions |

**Hook enforcement:**

- `_dev/ARCHITECTURE.md` — enforced by `definition_of_done` hook. MUST be updated when any new component, hook, service, context, or utility is added, or when any existing one changes behavior. Functional changes only — non-functional changes (whitespace, comment text) do not require an update.
- `_dev/COMPONENTS.md` — enforced by `definition_of_done` hook. MUST be updated whenever any entry is added, removed, or its interface or description changes.
- `_dev/TESTING_POLICY.md` — manually maintained. Updated only when a testing convention is deliberately changed. Not hook-enforced.

A session is NOT done until `_dev/ARCHITECTURE.md` and `_dev/COMPONENTS.md` reflect all changes made in that session. The `definition_of_done` hook will block if they are stale.

---

## SECTION 13 — HOOK SYSTEM (read-only reference)

### `audit_before_code.ts` (PreToolUse)

Fires when any implementation-related keyword is detected in a prompt. Requires completion of three audits (architecture, component state, feature plans) and delivery of an audit report before any code may be written. Hard blocks if `plans/.active-feature` is missing or points to a folder without all three plan documents.

### `enforce_during_implementation.ts` (PreToolUse / file writes)

Fires on every file write or edit to `src/`. Hard blocks if: no active feature is set, plan documents are incomplete, user approval has not been given, or a new `.ts`/`.tsx` file is being created without a co-located test file already existing. Plan files (`plans/`) and markdown (`.md`) files are always allowed through. Warns when modifying an existing file without updating its test.

### `definition_of_done.ts` (PostToolUse)

Fires when `src/` TypeScript files have changed. Runs Vitest with coverage. Hard blocks if: any test fails, line coverage < 80%, branch coverage < 80%, new or modified `src/` files are not documented in `_dev/ARCHITECTURE.md`, or `_dev/COMPONENTS.md` is stale relative to changed files. Writes `TEST_REPORT.md` and `FIX_PLAN.md` to `reports/<feature-name>/`. When all checks pass the session is done. Do not suggest committing, pushing, or opening a pull request — that is the user's decision.

---

## SECTION 14 — ACTIVE FEATURE TRACKING

`plans/.active-feature` MUST always contain the exact name of the feature currently being worked on. This name MUST match an existing folder under `plans/`.

### Starting a new feature

1. Choose a kebab-case feature name (e.g. `account-overview`)
2. Write that name to `plans/.active-feature`
3. Create `plans/<feature-name>/IMPLEMENTATION_PLAN.md`
4. Create `plans/<feature-name>/TEST_PLAN.md`
5. Create `plans/<feature-name>/DIAGRAMS.md`
6. Present all three to the user and wait for explicit approval
7. Do not write any implementation code until approval is received
8. If any plan document is revised after approval, approval is cleared and MUST be re-given before implementation resumes

### Approval keywords

`approved`, `approve`, `lgtm`, `looks good`, `go ahead`, `proceed`, `ship it`, `good to go`, `confirmed`, `confirm`, `happy with`, `commence`, `start implementation`, `begin implementation`, `start coding`, `begin coding`

---

## SECTION 15 — EMERGENCY STOP (locked)

If the user says **stop**, **cancel**, or **halt** in any form:
- Stop ALL work immediately
- Do not finish the current task
- Do not write any more files
- Do not run any more commands
- Acknowledge the stop and wait for further instructions

---

## SECTION 16 — GENERAL CODING PRINCIPLES (locked)

- Don't add features, refactors, or improvements beyond what was asked
- Don't add comments unless the logic is non-obvious
- Don't add error handling for scenarios that can't happen — trust framework and TypeScript guarantees
- Don't design for hypothetical future requirements
- Surface unexpected edge cases in development only: `if (import.meta.env.DEV) console.warn(...)`
- Prefer non-destructive behavior — do not remove, mutate, or overwrite existing data unless the feature explicitly requires it
- Do not commit code, create pull requests, or suggest committing — commits are solely the user's decision. The `definition_of_done` hook enforces test and build passage as the completion gate. When all checks pass, the session is done. Stop there.
