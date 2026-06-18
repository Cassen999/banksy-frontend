# Scheduled Deposits

**Summary:** This is the second section of the user's dashboard. It shows upcoming recurring deposits predicted for the current calendar month, sourced from `GET /api/recurring/scheduled-deposits`. On mobile it shows the single next active upcoming deposit; on desktop it shows up to 5 active upcoming deposits. Both use PrimeReact `Accordion`.

## File Structure

Follow existing project patterns:
- **Component:** `src/components/ScheduledDeposits/ScheduledDeposits.tsx` + `ScheduledDeposits.scss`
- **Hook:** `src/hooks/useScheduledDeposits.ts`
- **Service:** `src/services/scheduledDepositsService.ts`
- **Types:** Add shared interfaces to `src/types/types.ts`
- **Integration:** Render `<ScheduledDeposits />` inside the existing `<div className="dashboard__next-deposit">` in `src/components/Homepage/HomepagePage.tsx`

## Data

Call `GET /api/recurring/scheduled-deposits`. Wire the hook exactly as `useMonthlyGlance.ts` — auth guard via `useAuth()`, `cancelled` cleanup flag, retry via an incrementing counter in state, error toast via `triggerToast` from `useNotify()`. Only fetch when a `user` exists.

The endpoint returns deposits sorted ascending by `predictedNextDate`. Filter client-side to only show items where `isActive: true`.

**Nullable fields:** `merchantName`, `description`, `averageAmount`, `lastAmount`, and `personalFinanceCategory` may be null. Display `—` wherever a null value would appear.

**Empty result:** When the filtered active list is empty (API returned `[]` or all items have `isActive: false`), display a plain message inside the `dashboard__next-deposit` div: _"No upcoming deposits this month."_ No accordion, no mask.

**Amount formatting:** Format using `Intl.NumberFormat` with `style: 'currency'` and `currency: averageAmount.isoCurrencyCode` (e.g. `$2,500.00`). If `averageAmount` is null, display `—`.

**Frequency formatting:** Convert the all-caps API value (e.g. `"BIWEEKLY"`) to title-case (e.g. `"Biweekly"`) before display.

## Accordion

Use PrimeReact `Accordion`. The component lives inside the `dashboard__next-deposit` div.

### Header template (both mobile and desktop)

Each accordion header contains:
- **Left:** The Piggy Bank animation from `src/assets/Piggy Bank.svg`, downsized to fit fully within the header height, playing on loop.
- **Right:** Text reading: _"Next upcoming deposit from [merchantName] for [averageAmount] on [predictedNextDate]"_ — using the formatted values defined above.

### Expanded panel (both mobile and desktop)

Two-column layout:

| Left column | Right column |
|---|---|
| **From:** merchantName | **Last:** lastDate · lastAmount |
| **Description:** description | **Next:** predictedNextDate · averageAmount |
| **Frequency:** frequency | |

Null values display as `—`. Dates display as-is from the API (ISO format, e.g. `2026-06-20`).

### Mobile

Show only the single next upcoming deposit — the first item with `isActive: true` sorted ascending by `predictedNextDate`. One accordion item.

### Desktop

Show up to 5 upcoming deposits — the first 5 items with `isActive: true` sorted ascending by `predictedNextDate`. Allow multiple panels open simultaneously.

## States

### Skeleton (unauthenticated / auth resolving)

When `authLoading || !user`, render a PrimeReact `<Skeleton>` that fills the `dashboard__next-deposit` div. Match the approach used in `MonthlyGlance.tsx`. No data fetch should occur.

### Loading

While the fetch is in-flight, render an opaque mask over the accordion container with a centered PrimeReact `<ProgressSpinner>`. Mirror the mask pattern from `MonthlyGlance.tsx` (absolute positioned, `color-mix` semi-transparent background, `z-index: 1`, flexbox centered).

### Error

1. Fire an error toast via `triggerToast` from `useNotify()` with a user-friendly message.
2. Keep the opaque mask visible, swap the spinner for a centered `<button>` containing `<i className="pi pi-undo" />` and a "Retry" label. On click, refetch by incrementing the retry counter.

## Notes

- No `relinkRequired` handling needed — the endpoint silently skips non-HEALTHY items.
- `firstDate`, `status`, and `personalFinanceCategory` are not displayed.
- ARIA: each accordion item should have a descriptive `aria-label` (e.g. `"Deposit from [merchantName]"`).
- Update `_dev/ARCHITECTURE.md` with the new component, hook, and service after implementation.
