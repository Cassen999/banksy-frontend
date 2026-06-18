# Test Plan — Scheduled Deposits

## Test stack

- Vitest + `@testing-library/react`
- MSW (`server` + `handlers`) for service tests
- `vi.mock()` for contexts, services, hooks in unit tests

---

## Mocking strategy

### SVG asset (component tests only)
```ts
vi.mock('../../assets/Piggy Bank.svg', () => ({ default: 'piggy-bank-mock.svg' }));
```

### PrimeReact Accordion (component tests)
PrimeReact renders accordion headers as buttons. Use `screen.getByRole('button', { name: ... })`
to find header buttons. No canvas mock needed (unlike chart.js).

### Contexts
```ts
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));
vi.mock('../../contexts/NotificationContext', () => ({
  useNotify: () => ({ triggerToast: mockTriggerToast }),
}));
```

### Service (for hook tests)
```ts
vi.mock('../services/scheduledDepositsService', () => ({
  fetchScheduledDeposits: () => mockFetchScheduledDeposits(),
}));
```

### Hook (for component tests)
```ts
vi.mock('../../hooks/useScheduledDeposits', () => ({
  useScheduledDeposits: () => mockUseScheduledDeposits(),
}));
```

---

## `src/services/scheduledDepositsService.test.ts`

Uses MSW (same approach as `monthlyGlanceService.test.ts`).

| Test | Assertion |
|------|-----------|
| `calls /api/recurring/scheduled-deposits and returns data` | result equals `mockScheduledDeposits` from `handlers` fixture |
| `throws on 403` | `server.use(handlers.scheduledDeposits.serverError)` → rejects with `{ status: 403 }` |

---

## `src/hooks/useScheduledDeposits.test.ts`

Render with `renderHook`. Default: `mockUseAuth` → `{ user: mockUser, isLoading: false }`,
`mockFetchScheduledDeposits` → resolves with one active deposit.

| Test | Setup | Assertion |
|------|-------|-----------|
| `does not fetch when user is null` | `user: null` | `fetchScheduledDeposits` not called |
| `does not fetch while auth is loading` | `isLoading: true, user: null` | not called |
| `status is loading on mount when user is set` | fetch pending | `status === 'loading'` |
| `status is success on 200` | fetch resolves | `status === 'success'` |
| `filters out isActive: false items` | response has one active + one inactive | `deposits.length === 1` |
| `status is error on failure` | fetch rejects | `status === 'error'` |
| `triggers error toast on failure` | fetch rejects | `triggerToast` called with `severity: 'error'` |
| `retry() triggers re-fetch` | succeed once, call `retry()` | `fetchScheduledDeposits` called twice |
| `status resets to loading when retry() is called from error` | error state, call `retry()` | `status === 'loading'` immediately |

---

## `src/components/ScheduledDeposits/ScheduledDeposits.test.tsx`

Mock: `useAuth`, `useNotify`, `useScheduledDeposits`, `Piggy Bank.svg`.

Default beforeEach: `mockUseAuth` → authenticated user; `mockUseScheduledDeposits` →
`{ status: 'success', deposits: [mockDeposit], retry: mockRetry }`.

### Skeleton state (authLoading || !user)

| Test | Setup | Assertion |
|------|-------|-----------|
| `renders skeleton when user is null` | `useAuth` → `{ user: null, isLoading: false }` | `.p-skeleton` present, accordion absent |
| `renders skeleton while auth is loading` | `{ user: null, isLoading: true }` | `.p-skeleton` present |
| `does not render skeleton when authenticated` | default | `.p-skeleton` absent |

### Loading state

| Test | Setup | Assertion |
|------|-------|-----------|
| `renders mask` | `status: 'loading'` | `.scheduled-deposits__mask` present |
| `renders ProgressSpinner` | `status: 'loading'` | `.p-progress-spinner` present |
| `does not render accordion` | `status: 'loading'` | accordion absent |

### Error state

| Test | Setup | Assertion |
|------|-------|-----------|
| `renders mask` | `status: 'error'` | `.scheduled-deposits__mask` present |
| `renders retry button with pi-undo icon` | `status: 'error'` | `getByRole('button', { name: /retry/i })` present, `.pi-undo` present |
| `clicking retry calls retry()` | `status: 'error'` | `mockRetry` called after click |
| `does not render accordion` | `status: 'error'` | accordion absent |

### Empty state

| Test | Setup | Assertion |
|------|-------|-----------|
| `renders empty message` | `status: 'success', deposits: []` | "No upcoming deposits this month." visible |
| `does not render accordion` | same | accordion absent |

### Success state — mobile (< 1024px)

Mock `window.innerWidth = 800` before render.

| Test | Setup | Assertion |
|------|-------|-----------|
| `renders one accordion item when multiple deposits exist` | 3 deposits, mobile width | 1 accordion tab rendered |
| `accordion header shows merchant name` | 1 deposit | merchant name visible in header |
| `accordion header shows formatted amount` | `averageAmount: { amount: 2500, isoCurrencyCode: 'USD' }` | `$2,500.00` visible |
| `accordion header shows predictedNextDate` | | date visible in header |

### Success state — desktop (≥ 1024px)

Mock `window.innerWidth = 1440` before render.

| Test | Setup | Assertion |
|------|-------|-----------|
| `renders up to 5 items` | 6 deposits | 5 accordion tabs rendered |
| `renders fewer when fewer deposits exist` | 3 deposits | 3 accordion tabs rendered |

### Panel content (expand an accordion item)

| Test | Setup | Assertion |
|------|-------|-----------|
| `panel shows From field` | open accordion | merchant name in panel |
| `panel shows Description field` | open accordion | description in panel |
| `panel shows Frequency formatted as title-case` | `frequency: 'BIWEEKLY'` | "Biweekly" in panel |
| `panel shows Last date and amount` | | last date + formatted lastAmount |
| `panel shows Next date and amount` | | predictedNextDate + formatted averageAmount |
| `null merchantName displays em-dash` | `merchantName: null` | "—" in header and panel |
| `null averageAmount displays em-dash` | `averageAmount: null` | "—" in header and panel |

### Piggy bank image

| Test | Assertion |
|------|-----------|
| `renders piggy bank image in header` | `<img>` with `aria-hidden="true"` and `alt=""` present |

---

## Coverage target

≥ 80% line and branch coverage on all three new `src/` files, enforced by the
`definition_of_done` hook.
