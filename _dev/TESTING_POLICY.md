# Testing Policy — Banksy Frontend

## Coverage

- Minimum **80% line coverage and 80% branch coverage** on all testable code.
- Coverage is enforced by Vitest with `@vitest/coverage-v8`.
- A session is not done until coverage passes. The definition-of-done hook enforces
  this automatically — do not attempt to mark work complete if it is failing.

## Testing Stack (mandatory — do not introduce alternatives without approval)

| Tool | Purpose |
|------|---------|
| Vitest | Test runner and coverage |
| React Testing Library (`@testing-library/react`) | Component rendering and interaction |
| `@testing-library/user-event` | Simulating realistic user interactions |
| `@testing-library/jest-dom` | Custom DOM matchers (`toBeInTheDocument`, etc.) |
| MSW (`msw`) | Mocking HTTP requests to the Banksy backend |

Do not use `enzyme`, `shallow`, `jest`, or any test runner other than Vitest.
Do not mock `fetch` or `axios` with hand-rolled mocks when MSW can do the job.

## Required Test Types

**Service tests — use MSW:**
- Test each service function directly against an MSW handler.
- Override handlers per-test with `server.use(handlers.domain.variant)` to test error paths.
- Assert on the resolved/rejected value — do not test implementation details.

**Hook tests — mock service functions and contexts with `vi.mock`:**
- Test each hook in isolation using `renderHook`.
- Mock the service functions the hook calls (`vi.mock('../services/fooService', () => ({ fetchFoo: mockFn }))`)
  so the test controls responses without going through MSW or a real service.
- Mock any context hooks the hook consumes (`useAuth`, `useNotify`) with `vi.mock` too.
- Wrap the hook in a provider (or a mocked provider) that satisfies any context the hook reads.
- Assert on the values returned (`status`, `data`, `error`, etc.) and on side effects like
  `triggerToast` calls.

**Component tests — mock hooks (and child components when needed) with `vi.mock`:**
- Render the component, interact via `userEvent`, and assert on what the user sees.
- Mock the hook the component depends on (`vi.mock('../../hooks/useMonthlyGlance', ...)`) so
  each test can drive the component into a specific state (loading, error, success) without
  a live hook.
- Mock context hooks (`useAuth`, `useNotify`) with `vi.mock`.
- Mock complex child components (e.g. charts, third-party SDKs) with lightweight stubs when
  they would otherwise blow up in jsdom.

**Not required:**
- End-to-end (E2E) tests (Playwright, Cypress) are NOT required for this project.
- Full data path (MSW → service → hook → component) integration tests are not used — each
  layer is tested independently.
- External dependencies are not tested for their own functionality. For example, Chart.js
  canvas rendering internals (`buildSplitBackgroundPlugin`, `buildChartData`, etc.) are
  third-party concerns — stub or mock the library at the boundary and test only our
  integration with it (e.g. that the chart renders, that the correct data is passed).
  Low coverage on canvas/chart helper functions is expected and acceptable.

## Test File Location

Most test files are co-located with the file they test:
```
src/components/Button/Button.tsx
src/components/Button/Button.test.tsx   ← co-located
```

**Exception — contexts:** test files for `src/contexts/` live in `src/contexts/contextTests/`:
```
src/contexts/ThemeContext.tsx
src/contexts/contextTests/ThemeContext.test.tsx   ← in contextTests/
```

## What Does Not Need a Test

The following files are exempt from coverage and do not require a test file:
- `*.config.ts`, `*.config.tsx`, `vite.config.ts`, `vitest.config.ts`
- `main.tsx`
- `*.d.ts`
- `index.ts`, `index.tsx` (barrel/re-export files only)
- `*.types.ts`, `types.ts`
- Files inside `src/types/`, `src/assets/`, `src/styles/`, `src/mocks/`, `src/test/`

## Test Design Standards

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

**Naming — group with `describe`, describe behavior in plain prose for `it()`:**
```ts
describe('ComponentName', () => {
  describe('loading state', () => {
    it('renders a progress spinner', () => { ... })
    it('does not render the chart', () => { ... })
  })
  describe('error state', () => {
    it('renders the retry button', () => { ... })
    it('clicking retry calls retry()', async () => { ... })
  })
})
```
- Use nested `describe` blocks to group tests by state or scenario.
- Write `it()` descriptions as plain sentences that complete "it ...": `'renders a progress spinner'`,
  `'does not fetch when user is null'`, `'filters out isActive: false items'`.
- Do not use camelCase or `_when` separators in test names.

**Assertions:**
- Multiple assertions are allowed when they validate a single logical behavior.
- Prefer `screen.getByRole`, `screen.findByText`, and `screen.queryByRole` over
  querying by class name or test ID. Test what the user sees, not implementation details.
- Never assert on component state directly — assert on rendered output.

**MSW setup:**
- All MSW handlers live in `src/mocks/handlers.ts`, grouped by domain:
  `handlers.auth`, `handlers.balance`, `handlers.transactions`, `handlers.plaid`,
  `handlers.scheduledDeposits`, `handlers.monthlyGlance`, `handlers.dev`.
- The MSW server is set up in `src/mocks/server.ts` and started/reset in `src/test/setup.ts`.
- Each handler group has at least a `success` and `serverError` variant. Some have additional
  variants (`withRelinkRequired`, `empty`, `unauthorized`, `forbidden`, `badRequest`).
- Some groups are nested: `handlers.auth.me.success`, `handlers.plaid.linkToken.success`,
  `handlers.plaid.exchange.serverError`, etc. Flat groups: `handlers.balance.success`,
  `handlers.scheduledDeposits.serverError`, `handlers.monthlyGlance.success`.
- Override handlers per-test using `server.use(handlers.monthlyGlance.serverError)`.
- MSW is used in **service tests only**. Hook and component tests use `vi.mock` instead.

## Document Lifecycle (enforced by hooks)

Before any implementation:
- `plans/<feature-name>/IMPLEMENTATION_PLAN.md`
- `plans/<feature-name>/TEST_PLAN.md`
- `plans/<feature-name>/DIAGRAMS.md`

After implementation (written automatically by the definition-of-done hook):
- `reports/<feature-name>/TEST_REPORT.md`
- `reports/<feature-name>/FIX_PLAN.md` — only if tests fail or coverage < 80%

## CI/CD

No CI/CD pipeline exists yet. When asked to create one:
- Tests must run on every pull request
- Coverage must be validated in CI
- The build must fail if: any test fails, line coverage < 80%, or branch coverage < 80%
