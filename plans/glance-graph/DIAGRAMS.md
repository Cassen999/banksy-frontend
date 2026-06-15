# Diagrams — Glance Graph (MonthlyGlance)

## 1. Component tree

```
HomepagePage
└── <section className="dashboard__graph">
    └── MonthlyGlance
        ├── [auth loading / no user]  → <Skeleton />
        ├── [status: loading]         → mask + <ProgressSpinner />
        ├── [status: error]           → mask + retry button (pi-undo)
        └── [status: success]         → <Line /> (react-chartjs-2)
```

---

## 2. Data flow

```
GET /api/monthly-glance
        │
        ▼
monthlyGlanceService.fetchMonthlyGlance()
        │
        ▼  { dailyTotals: [{ transactionDate, total }], relinkRequired }
useMonthlyGlance hook
        │
        │  toCumulative()
        │  [{ date, daily, cumulative }, ...]
        ▼
MonthlyGlance component
        │
        ├── labels  = data.map(d => d.date)
        ├── values  = data.map(d => d.cumulative)
        └── tooltip = d.date + d.daily + d.cumulative
```

---

## 3. Hook state machine

```
             user === null
   ┌──────────────────────────────┐
   │                              │
   ▼                              │
[idle] ──── user set ────► [loading] ──── 200 ────► [success]
                                │
                                └──── error ────► [error]
                                                     │
                                              retry() │
                                                     ▼
                                               [loading]
```

States:
- **idle** — `user` is null; no fetch attempted
- **loading** — fetch in flight; spinner + mask shown
- **success** — data ready; chart rendered
- **error** — fetch failed; toast fired; mask + retry shown

---

## 4. Chart layout (desktop)

```
Y ($)
 ▲
 │ ░░░░░░░░░░░░░░░░  ← red-200 fill (above budget)
$2000 ─────────────────── budget line (teal-400)
 │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  ← teal-400 fill (below budget)
 │       ╱‾‾‾‾
 │   ╱‾‾‾
 │──────────────────► X (dates: Jun 1 … Jun [today])
```

- Line: `var(--primary-color)`
- Budget reference line: `var(--teal-400)`, drawn via `beforeDraw` inline plugin
- Teal fill: below budget line, same opacity as red fill
- Red fill: above budget line, same opacity as teal fill

---

## 5. File map

```
src/
├── types/
│   └── types.ts                          (add 3 interfaces)
├── services/
│   ├── monthlyGlanceService.ts           (new)
│   └── monthlyGlanceService.test.ts      (new, write first)
├── hooks/
│   ├── useMonthlyGlance.ts               (new)
│   └── useMonthlyGlance.test.ts          (new, write first)
└── components/
    ├── MonthlyGlance/
    │   ├── MonthlyGlance.tsx             (new)
    │   ├── MonthlyGlance.test.tsx        (new, write first)
    │   └── monthlyGlance.scss            (new)
    └── Homepage/
        └── HomepagePage.tsx              (edit — add <MonthlyGlance />)
```
