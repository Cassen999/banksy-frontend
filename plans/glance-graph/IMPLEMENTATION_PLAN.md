# Implementation Plan — Glance Graph (MonthlyGlance)

## Overview

Add a cumulative monthly spending line chart (`MonthlyGlance`) to the dashboard's
`dashboard__graph` section. The chart uses `chart.js` + `react-chartjs-2`, fetches
pre-filtered data from `GET /api/monthly-glance`, transforms it into a running total,
and renders loading / error / success states with auth-gating.

---

## New Files (write test before implementation in every case)

| Order | Test file | Implementation file |
|-------|-----------|---------------------|
| 1 | `src/services/monthlyGlanceService.test.ts` | `src/services/monthlyGlanceService.ts` |
| 2 | `src/hooks/useMonthlyGlance.test.ts` | `src/hooks/useMonthlyGlance.ts` |
| 3 | `src/components/MonthlyGlance/MonthlyGlance.test.tsx` | `src/components/MonthlyGlance/MonthlyGlance.tsx` |
| 4 | _(no test)_ | `src/components/MonthlyGlance/monthlyGlance.scss` |

---

## Step 0 — Install dependencies

```bash
npm install chart.js react-chartjs-2
```

---

## Step 1 — Types (`src/types/types.ts`)

Add the following interfaces (do not create a new file — append to existing types):

```ts
export interface iMonthlyGlanceDailyTotal {
  transactionDate: string;
  total: number;
}

export interface iMonthlyGlanceResponse {
  dailyTotals: iMonthlyGlanceDailyTotal[];
  relinkRequired: unknown[];
}

export interface iMonthlyGlanceDataPoint {
  date: string;
  cumulative: number;
  daily: number;
}
```

---

## Step 2 — Service (`src/services/monthlyGlanceService.ts`)

```ts
import { apiClient } from '../api/client';
import type { iMonthlyGlanceResponse } from '../types/types';

export async function fetchMonthlyGlance(): Promise<iMonthlyGlanceResponse> {
  const response = await apiClient.get<iMonthlyGlanceResponse>('/api/monthly-glance');
  return response.data;
}
```

Pattern: identical to `plaidService.ts` — thin wrapper over `apiClient`.

---

## Step 3 — Hook (`src/hooks/useMonthlyGlance.ts`)

Responsibilities:
- Guard against calling the API when `user` is null (from `useAuth()`)
- Manage `status: 'idle' | 'loading' | 'error' | 'success'`
- Transform the raw `dailyTotals` array into cumulative `iMonthlyGlanceDataPoint[]`
- Expose a `retry()` function that re-triggers the fetch

```ts
export function useMonthlyGlance(): {
  status: 'idle' | 'loading' | 'error' | 'success';
  data: iMonthlyGlanceDataPoint[];
  retry: () => void;
}
```

**Data transformation** (pure helper, not exported):
```ts
function toCumulative(dailyTotals: iMonthlyGlanceDailyTotal[]): iMonthlyGlanceDataPoint[] {
  let running = 0;
  return dailyTotals.map(({ transactionDate, total }) => {
    running += total;
    return { date: transactionDate, cumulative: running, daily: total };
  });
}
```

**Retry pattern**: keep a `fetchCount` state (`useState(0)`); `useEffect` depends on
it; `retry()` increments it. Only fire the effect when `user` is non-null.

**Error handling**: on catch, set status to `'error'` and call `triggerToast` with
the exact message from the spec.

---

## Step 4 — Component (`src/components/MonthlyGlance/MonthlyGlance.tsx`)

### Auth gate
Use `useAuth()`. While `isLoading || !user`, render:
```tsx
<Skeleton className="monthly-glance__skeleton" />
```
Do not call `useMonthlyGlance` (or let the hook guard it — either approach is fine,
but the skeleton replaces the entire component output).

### States (once authenticated)

**Loading** (`status === 'loading'`):
```tsx
<div className="monthly-glance__mask">
  <ProgressSpinner aria-label="Loading Monthly Glance" />
</div>
```

**Error** (`status === 'error'`):
```tsx
<div className="monthly-glance__mask">
  <button className="monthly-glance__retry" onClick={retry} aria-label="Retry">
    <i className="pi pi-undo" />
    Retry
  </button>
</div>
```
Toast is already fired by the hook.

**Success** (`status === 'success'`): render the chart (see below).

### Chart setup

Register Chart.js components at module level (once):
```ts
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler);
```

### Budget placeholder
```ts
const budget: number = 2000;
```

### Chart title
```ts
const title = `${new Date().toLocaleString('default', { month: 'long' })} Glance`;
```

### Split background plugin

Use Chart.js's inline plugin API (`plugins` array in the options) to draw the split
background and budget line in `beforeDraw`. Canvas context does not support CSS custom
properties directly — resolve them at draw time:

```ts
const el = document.documentElement;
const teal = getComputedStyle(el).getPropertyValue('--teal-400').trim();
const red = getComputedStyle(el).getPropertyValue('--red-200').trim();
```

Draw two filled rectangles split at `scales.y.getPixelForValue(budget)`, then stroke
the budget line in `var(--teal-400)`. Match opacities (e.g. `0.2`) for both fills.

### Tooltip config (built-in only, no custom components)

**Desktop (≥ 1024 px):** default hover interaction — use `callbacks.label` to output
date, daily amount, and cumulative amount:
```ts
callbacks: {
  label: (ctx) => {
    const point = data[ctx.dataIndex];
    return [
      `Date: ${point.date}`,
      `Spent today: $${point.daily.toFixed(2)}`,
      `Total so far: $${point.cumulative.toFixed(2)}`,
    ];
  }
}
```

**Mobile (< 1024 px):** switch Chart.js `events` to `['click']` (no hover events on
touch). Same `callbacks.label` content (cumulative + daily). Detect at component
render time: `const isMobile = window.innerWidth < 1024;`.

### SCSS (`monthlyGlance.scss`)

```scss
.monthly-glance {
  position: relative;
  width: 100%;
  height: 100%;

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
    background-color: rgba(var(--surface-ground-rgb, 255 255 255) / 0.7);
    border-radius: inherit;
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
  }
}
```

Adjust the mask background to use the project's surface token — check
`src/styles/variables.scss` for the correct custom property.

---

## Step 5 — Dashboard integration (`src/components/Homepage/HomepagePage.tsx`)

Replace the empty `<section className="dashboard__graph" ... />` with:
```tsx
<section className="dashboard__graph" aria-label="Spending trend graph">
  <MonthlyGlance />
</section>
```

The existing `HomepagePage.test.tsx` tests that this section is present — they will
continue to pass. No other test changes are required for this file.

---

## Step 6 — Architecture docs (`_dev/ARCHITECTURE.md`)

After implementation, document:
- `MonthlyGlance` component
- `useMonthlyGlance` hook
- `monthlyGlanceService` service
- The types added to `src/types/types.ts`
