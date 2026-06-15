# Test Plan — Glance Graph (MonthlyGlance)

## Test stack

- Vitest + `@testing-library/react`
- `vi.mock()` for all external dependencies (contexts, services, chart.js)
- MSW is available but not needed here — mock `apiClient` or the service directly

---

## Mocking strategy

### chart.js / react-chartjs-2
Canvas is not available in jsdom. Mock at the top of component tests:
```ts
vi.mock('react-chartjs-2', () => ({
  Line: () => <canvas data-testid="monthly-glance-chart" />,
}));
vi.mock('chart.js', () => ({ Chart: { register: vi.fn() } }));
```

### Contexts (apply to all files that use them)
```ts
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));
vi.mock('../contexts/NotificationContext', () => ({
  useNotify: () => ({ triggerToast: mockTriggerToast }),
}));
```

### Service (for hook tests)
```ts
vi.mock('../services/monthlyGlanceService', () => ({
  fetchMonthlyGlance: () => mockFetchMonthlyGlance(),
}));
```

---

## `src/services/monthlyGlanceService.test.ts`

Mock `apiClient`:
```ts
vi.mock('../api/client', () => ({
  apiClient: { get: vi.fn() },
}));
```

| Test | Assertion |
|------|-----------|
| `calls /api/monthly-glance` | `apiClient.get` called with `'/api/monthly-glance'` |
| `returns response data` | resolves to `mockResponse.data` |
| `propagates rejection` | rejects when `apiClient.get` rejects |

---

## `src/hooks/useMonthlyGlance.test.ts`

Render with `renderHook`. Set `mockUseAuth` to return `{ user: mockUser, isLoading: false }` by default.

| Test | Setup | Assertion |
|------|-------|-----------|
| `does not fetch when user is null` | `user: null` | `fetchMonthlyGlance` not called |
| `does not fetch while auth is loading` | `isLoading: true, user: null` | `fetchMonthlyGlance` not called |
| `sets status to loading on mount` | `user` set, fetch pending | `status === 'loading'` before resolve |
| `sets status to success on 200` | fetch resolves with valid data | `status === 'success'` |
| `data is transformed to cumulative` | `dailyTotals: [{total:1},{total:2},{total:3}]` | `data[2].cumulative === 6` |
| `daily value is preserved` | same setup | `data[1].daily === 2` |
| `sets status to error on fetch failure` | fetch rejects | `status === 'error'` |
| `triggers error toast on failure` | fetch rejects | `triggerToast` called with `severity: 'error'` |
| `toast detail matches spec` | fetch rejects | `detail === 'There was a problem loading the Monthly Glance, please try again'` |
| `retry() triggers re-fetch` | succeed once, then call `retry()` | `fetchMonthlyGlance` called twice |
| `status resets to loading on retry` | error state, call `retry()` | `status === 'loading'` immediately |

---

## `src/components/MonthlyGlance/MonthlyGlance.test.tsx`

Mock `react-chartjs-2`, `chart.js`, `useAuth`, `useNotify`, and `useMonthlyGlance`.

```ts
const mockUseMonthlyGlance = vi.fn();
vi.mock('../../hooks/useMonthlyGlance', () => ({
  useMonthlyGlance: () => mockUseMonthlyGlance(),
}));
```

### Auth gate

| Test | Setup | Assertion |
|------|-------|-----------|
| `renders skeleton when user is null` | `useAuth` → `{ user: null, isLoading: false }` | PrimeReact Skeleton present, chart absent |
| `renders skeleton while auth is loading` | `useAuth` → `{ user: null, isLoading: true }` | Skeleton present |
| `does not render skeleton when user is set` | `useAuth` → `{ user: mockUser, isLoading: false }` | Skeleton absent |

### Loading state

| Test | Setup | Assertion |
|------|-------|-----------|
| `renders ProgressSpinner` | hook → `{ status: 'loading', ... }` | spinner present |
| `renders mask overlay` | hook → `{ status: 'loading', ... }` | mask element present |
| `does not render chart` | hook → `{ status: 'loading', ... }` | chart absent |

### Error state

| Test | Setup | Assertion |
|------|-------|-----------|
| `renders retry button` | hook → `{ status: 'error', ... }` | element with text "Retry" present |
| `renders pi-undo icon` | hook → `{ status: 'error', ... }` | element with class `pi-undo` present |
| `mask overlay remains visible` | hook → `{ status: 'error', ... }` | mask element present |
| `clicking retry calls retry()` | hook → `{ status: 'error', retry: mockRetry }` | `mockRetry` called after click |
| `does not render chart` | hook → `{ status: 'error', ... }` | chart absent |

### Success state

| Test | Setup | Assertion |
|------|-------|-----------|
| `renders chart` | hook → `{ status: 'success', data: [...] }` | `data-testid="monthly-glance-chart"` present |
| `does not render mask` | hook → `{ status: 'success', ... }` | mask absent |
| `does not render retry` | hook → `{ status: 'success', ... }` | "Retry" absent |

---

## Coverage target

≥ 80% line and branch coverage on all three new `src/` files, enforced by the
`definition_of_done` hook.
