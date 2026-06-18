# Implementation Plan — Scheduled Deposits

## Overview

Add `ScheduledDeposits` to the dashboard's `dashboard__next-deposit` section. Fetches
`GET /api/recurring/scheduled-deposits`, filters client-side to `isActive: true`, and
renders them as a PrimeReact `Accordion`. Mirrors `MonthlyGlance` for auth-gating,
loading mask, error + retry, and skeleton state.

---

## Files to Create (write test before implementation)

| Order | Test file | Implementation file |
|-------|-----------|---------------------|
| 1 | `src/services/scheduledDepositsService.test.ts` | `src/services/scheduledDepositsService.ts` |
| 2 | `src/hooks/useScheduledDeposits.test.ts` | `src/hooks/useScheduledDeposits.ts` |
| 3 | `src/components/ScheduledDeposits/ScheduledDeposits.test.tsx` | `src/components/ScheduledDeposits/ScheduledDeposits.tsx` |
| 4 | _(no test)_ | `src/components/ScheduledDeposits/scheduledDeposits.scss` |

## Files to Modify

- `src/types/types.ts` — add `iScheduledDepositAmount`, `iScheduledDeposit`
- `src/mocks/handlers.ts` — add `scheduledDeposits` handlers; add success case to `defaultHandlers`
- `src/components/Homepage/HomepagePage.tsx` — render `<ScheduledDeposits />`
- `src/components/Homepage/HomepagePage.test.tsx` — mock `ScheduledDeposits`, add render test
- `src/styles/index.scss` — add `@use` for `scheduledDeposits`
- `_dev/ARCHITECTURE.md` — document new component, hook, service

---

## Step 1 — Types (`src/types/types.ts`)

Append to existing file (no new file, no test required):

```ts
export interface iScheduledDepositAmount {
  amount: number;
  isoCurrencyCode: string;
}

export interface iScheduledDeposit {
  merchantName: string | null;
  description: string | null;
  frequency: string;
  firstDate: string;
  lastDate: string;
  predictedNextDate: string;
  averageAmount: iScheduledDepositAmount | null;
  lastAmount: iScheduledDepositAmount | null;
  isActive: boolean;
  personalFinanceCategory: { primary: string; detailed: string } | null;
  status: string;
}
```

---

## Step 2 — MSW Handlers (`src/mocks/handlers.ts`)

Add fixture and handler group; register success case in `defaultHandlers`.

```ts
const mockScheduledDeposits = [
  {
    merchantName: 'Employer Inc',
    description: 'DIRECT DEPOSIT',
    frequency: 'BIWEEKLY',
    firstDate: '2025-01-03',
    lastDate: '2026-06-01',
    predictedNextDate: '2026-06-20',
    averageAmount: { amount: 2500.00, isoCurrencyCode: 'USD' },
    lastAmount: { amount: 2500.00, isoCurrencyCode: 'USD' },
    isActive: true,
    personalFinanceCategory: { primary: 'INCOME', detailed: 'INCOME_WAGES' },
    status: 'MATURE',
  },
];

const scheduledDeposits = {
  success: http.get(`${API}/api/recurring/scheduled-deposits`, () =>
    HttpResponse.json(mockScheduledDeposits),
  ),
  empty: http.get(`${API}/api/recurring/scheduled-deposits`, () =>
    HttpResponse.json([]),
  ),
  serverError: http.get(`${API}/api/recurring/scheduled-deposits`, () =>
    new HttpResponse('Error getting scheduled deposit data', { status: 403 }),
  ),
};
```

Add to exports: `export const handlers = { ..., scheduledDeposits };`
Add to `defaultHandlers`: `handlers.scheduledDeposits.success`

---

## Step 3 — Service (`src/services/scheduledDepositsService.ts`)

Write test first (uses MSW, mirrors `monthlyGlanceService.test.ts`).

```ts
import { apiClient } from '../api/client';
import type { iScheduledDeposit } from '../types/types';

export async function fetchScheduledDeposits(): Promise<iScheduledDeposit[]> {
  const response = await apiClient.get<iScheduledDeposit[]>('/api/recurring/scheduled-deposits');
  return response.data;
}
```

---

## Step 4 — Hook (`src/hooks/useScheduledDeposits.ts`)

Write test first. Mirror `useMonthlyGlance.ts` exactly: auth guard via `useAuth()`,
`cancelled` cleanup flag, `fetchCount` retry counter, `triggerToast` on error.

One addition after `.then()`: filter the response to `isActive: true` before storing.

```ts
type tStatus = 'idle' | 'loading' | 'error' | 'success';
type tInternalStatus = 'idle' | 'error' | 'success';

export function useScheduledDeposits(): {
  status: tStatus;
  deposits: iScheduledDeposit[];
  retry: () => void;
}
```

Inside `.then()`:
```ts
setDeposits(response.filter((d) => d.isActive));
setInternalStatus('success');
```

Status derivation (identical to `useMonthlyGlance`):
```ts
const status: tStatus = !user
  ? 'idle'
  : internalStatus === 'idle'
  ? 'loading'
  : internalStatus;
```

---

## Step 5 — Component (`src/components/ScheduledDeposits/ScheduledDeposits.tsx`)

Write test first.

### Imports
```ts
import piggyBankUrl from '../../assets/Piggy Bank.svg';
import { Accordion, AccordionTab } from 'primereact/accordion';
import { Skeleton } from 'primereact/skeleton';
import { ProgressSpinner } from 'primereact/progressspinner';
import { useAuth } from '../../contexts/AuthContext';
import { useScheduledDeposits } from '../../hooks/useScheduledDeposits';
import type { iScheduledDeposit, iScheduledDepositAmount } from '../../types/types';
```

### Helpers (module-level, not exported)
```ts
function formatAmount(amount: iScheduledDepositAmount | null): string {
  if (!amount) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: amount.isoCurrencyCode,
  }).format(amount.amount);
}

function formatFrequency(frequency: string): string {
  return frequency.charAt(0).toUpperCase() + frequency.slice(1).toLowerCase();
}
```

### Subcomponents (module-level, not exported)
```tsx
function AccordionHeader({ deposit }: { deposit: iScheduledDeposit }) {
  return (
    <div className="scheduled-deposits__header">
      <img src={piggyBankUrl} alt="" aria-hidden="true" className="scheduled-deposits__piggy" />
      <span>
        Next upcoming deposit from {deposit.merchantName ?? '—'} for{' '}
        {formatAmount(deposit.averageAmount)} on {deposit.predictedNextDate}
      </span>
    </div>
  );
}

function AccordionPanel({ deposit }: { deposit: iScheduledDeposit }) {
  return (
    <dl className="scheduled-deposits__detail">
      <div className="scheduled-deposits__col">
        <div><dt>From</dt><dd>{deposit.merchantName ?? '—'}</dd></div>
        <div><dt>Description</dt><dd>{deposit.description ?? '—'}</dd></div>
        <div><dt>Frequency</dt><dd>{formatFrequency(deposit.frequency)}</dd></div>
      </div>
      <div className="scheduled-deposits__col">
        <div><dt>Last</dt><dd>{deposit.lastDate} · {formatAmount(deposit.lastAmount)}</dd></div>
        <div><dt>Next</dt><dd>{deposit.predictedNextDate} · {formatAmount(deposit.averageAmount)}</dd></div>
      </div>
    </dl>
  );
}
```

### Default export
```tsx
export default function ScheduledDeposits() {
  const { user, isLoading: authLoading } = useAuth();
  const { status, deposits, retry } = useScheduledDeposits();

  if (authLoading || !user) {
    return <Skeleton className="scheduled-deposits__skeleton" />;
  }

  const isMobile = window.innerWidth < 1024;
  const visibleDeposits = isMobile ? deposits.slice(0, 1) : deposits.slice(0, 5);

  return (
    <div className="scheduled-deposits">
      {(status === 'loading' || status === 'error') && (
        <div className="scheduled-deposits__mask">
          {status === 'loading' && (
            <ProgressSpinner aria-label="Loading scheduled deposits" />
          )}
          {status === 'error' && (
            <button className="scheduled-deposits__retry" onClick={retry} aria-label="Retry">
              <i className="pi pi-undo" />
              Retry
            </button>
          )}
        </div>
      )}
      {status === 'success' && deposits.length === 0 && (
        <p className="scheduled-deposits__empty">No upcoming deposits this month.</p>
      )}
      {status === 'success' && deposits.length > 0 && (
        <Accordion multiple>
          {visibleDeposits.map((deposit, i) => (
            <AccordionTab
              key={i}
              header={<AccordionHeader deposit={deposit} />}
              pt={{ headerAction: { 'aria-label': `Deposit from ${deposit.merchantName ?? 'Unknown'}` } }}
            >
              <AccordionPanel deposit={deposit} />
            </AccordionTab>
          ))}
        </Accordion>
      )}
    </div>
  );
}
```

---

## Step 6 — SCSS (`src/components/ScheduledDeposits/scheduledDeposits.scss`)

```scss
@use '../../styles/variables' as *;

.scheduled-deposits {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  box-sizing: border-box;

  &__skeleton {
    width: 100%;
    height: 100%;
  }

  &__mask {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: color-mix(in srgb, var(--surface-ground) 70%, transparent);
    border-radius: inherit;
    z-index: 1;
  }

  &__retry {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    background: none;
    border: none;
    cursor: pointer;
    color: var(--text-color);
    font-size: 1rem;

    .pi {
      font-size: 1.5rem;
    }
  }

  &__empty {
    padding: 1rem;
    color: var(--text-color-secondary);
  }

  &__header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  &__piggy {
    height: 2rem;
    width: auto;
    flex-shrink: 0;
  }

  &__detail {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem 1rem;
    margin: 0;

    dt {
      font-weight: 600;
      font-size: 0.8rem;
      color: var(--text-color-secondary);
      margin-bottom: 0.125rem;
    }

    dd {
      margin: 0;
      color: var(--text-color);
    }
  }

  &__col {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
}
```

---

## Step 7 — Dashboard integration

### `src/components/Homepage/HomepagePage.tsx`
```tsx
import ScheduledDeposits from '../ScheduledDeposits/ScheduledDeposits';
// ...
<div className="dashboard__next-deposit" role="region" aria-label="Next scheduled deposit">
  <ScheduledDeposits />
</div>
```

### `src/components/Homepage/HomepagePage.test.tsx`
Add mock alongside the existing `MonthlyGlance` mock:
```ts
vi.mock('../ScheduledDeposits/ScheduledDeposits', () => ({
  default: () => <div data-testid="scheduled-deposits-mock" />,
}));
```
Add test in the `structure` describe block:
```ts
it('should_renderScheduledDeposits', () => {
  renderPage();
  expect(screen.getByTestId('scheduled-deposits-mock')).toBeInTheDocument();
});
```

---

## Step 8 — SCSS barrel (`src/styles/index.scss`)

```scss
@use '../components/ScheduledDeposits/scheduledDeposits';
```

---

## Step 9 — Architecture docs (`_dev/ARCHITECTURE.md`)

Document `ScheduledDeposits` component, `useScheduledDeposits` hook,
`scheduledDepositsService` service, and the two new interfaces in `src/types/types.ts`.
