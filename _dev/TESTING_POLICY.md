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

**Unit tests (~70% of all tests):**
- Custom hooks (test in isolation using `renderHook`)
- Context reducers
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

## What Does Not Need a Test

The following files are exempt from coverage and do not require a co-located test:
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
- All MSW handlers live in `src/mocks/handlers.ts`, grouped by domain
  (`handlers.balance`, `handlers.transactions`, `handlers.auth`, `handlers.plaid`).
- The MSW server is set up in `src/mocks/server.ts` and started/reset in `src/test/setup.ts`.
- Each handler has at least a `success` and `error` (or `serverError`) variant.
- Override handlers per-test using `server.use(handlers.balance.withRelinkRequired)`.

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
