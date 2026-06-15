# Monthly Glance

**Summary:** A cumulative spending line chart displayed in the first section of the
dashboard. It shows the user's running total spend across all linked accounts for the
current month, plotted against a monthly budget reference line to give an at-a-glance
sense of spending progress. Category filtering is handled entirely by the backend —
the frontend receives pre-filtered data.

---

## Component

**Name:** `MonthlyGlance`  
**Path:** `src/components/MonthlyGlance/MonthlyGlance.tsx`  
**SCSS:** `src/components/MonthlyGlance/monthlyGlance.scss`  
**Test file (write before implementation):** `src/components/MonthlyGlance/MonthlyGlance.test.tsx`

Install dependencies before implementing:
```bash
npm install chart.js react-chartjs-2
```

---

## Budget Placeholder

The monthly budget will eventually be sourced from the user object. For now, declare
it as a local constant at the top of the component:

```ts
const budget: number = 2000;
```

---

## Data

### Endpoint
`GET /api/monthly-glance`

### Response `200`
```json
{
  "dailyTotals": [
    { "transactionDate": "2026-06-01", "total": 0.0 },
    { "transactionDate": "2026-06-02", "total": 42.50 },
    { "transactionDate": "2026-06-12", "total": 18.75 }
  ],
  "relinkRequired": []
}
```

> `relinkRequired` can be ignored for this feature.

### Frontend Data Transformation

Before passing data to the chart, transform `dailyTotals` into a cumulative series.
Each entry's cumulative value is the sum of all `total` values up to and including
that day:

```
June 1: total = $1.00  → cumulative = $1.00
June 2: total = $2.00  → cumulative = $3.00
June 3: total = $0.50  → cumulative = $3.50
```

The chart's Y axis plots the **cumulative** value. Each entry's original `total`
(daily spend) must be stored alongside the cumulative value so both can be surfaced
in tooltips.

---

## Graph

Use `chart.js` with the `react-chartjs-2` React wrapper. The chart occupies the
first section of the dashboard (full-width on mobile, top-left panel on desktop).

### Title
`[currentMonth] Glance` — e.g. "June Glance"

### Axes
- **X axis:** dates of the current month, from day 1 up to and including today.
  No future dates.
- **Y axis:** cumulative dollar amount (running total)

### Requirements

1. Line chart (`Line` component from `react-chartjs-2`)
2. **X axis** — current month dates, today inclusive, no future dates
3. **Y axis** — cumulative spend in dollars
4. **Line color** — `var(--primary-color)`
5. **Background split at the budget line:**
   - A horizontal reference line at `y = budget` using color `var(--teal-400)`
   - Below the budget line: fill with `var(--teal-400)` at low opacity
   - Above the budget line: fill with `var(--red-200)` at low opacity
   - Both fill opacities must match for visual consistency
   - The spending line and all data points must remain clearly readable over the fills
6. **No grid lines**
7. **Tooltips — use Chart.js built-in tooltip/interaction system only. No custom
   tooltip implementation.**
   - **Desktop (viewport ≥ 1024px):** on hover, show the data point's date, the
     amount spent that day (daily `total`), and the cumulative amount up to that day
   - **Mobile (viewport < 1024px):** on click/tap, show the cumulative amount and
     the amount spent that day (daily `total`)
8. Only render data points for dates up to and including today. No future dates.

---

## States

### Loading
- Show a PrimeReact `ProgressSpinner` centered within the component section
- Overlay the section with an opaque gray mask behind the spinner

### Error
- Trigger a toast using `useNotify()` from `src/contexts/NotificationContext.tsx`:
  ```ts
  const { triggerToast } = useNotify();
  triggerToast({
    severity: 'error',
    summary: 'Error',
    detail: 'There was a problem loading the Monthly Glance, please try again'
  });
  ```
- Keep the opaque gray mask visible
- Show the PrimeIcons `pi-undo` icon and the label "Retry" centered in the section
- Clicking Retry re-fires the `/api/monthly-glance` request, returning to loading state

### Success
- Render the chart as described. No additional messaging.

---

## Authentication & Display

Use `useAuth()` from `src/contexts/AuthContext.tsx` to access auth state.

- **While `isLoading` is true OR `user` is null:** render a PrimeReact `Skeleton`
  component sized to fill the same dimensions as the graph section. Do not call
  `/api/monthly-glance`.
- **Once `user` is non-null:** initiate the `/api/monthly-glance` fetch and proceed
  through the loading → success/error states above.

---

## Dashboard Integration

Place `<MonthlyGlance />` in the first section of the dashboard layout — the top
section on mobile and the top-left panel on desktop.
