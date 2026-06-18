# Diagrams — Scheduled Deposits

## 1. Component tree

```
HomepagePage
└── <div className="dashboard__next-deposit">
    └── ScheduledDeposits
        ├── [authLoading || !user]        → <Skeleton />
        ├── [status: loading]             → container + mask + <ProgressSpinner />
        ├── [status: error]               → container + mask + retry button (pi-undo)
        ├── [status: success, empty]      → "No upcoming deposits this month."
        └── [status: success, data]       → <Accordion multiple>
                                               <AccordionTab header={<AccordionHeader />}>
                                                 <AccordionPanel />
                                               </AccordionTab>
                                               ... (1 on mobile, up to 5 on desktop)
                                           </Accordion>
```

---

## 2. Data flow

```
GET /api/recurring/scheduled-deposits
          │
          ▼
scheduledDepositsService.fetchScheduledDeposits()
          │  iScheduledDeposit[]
          ▼
useScheduledDeposits hook
          │  .filter(d => d.isActive)
          │  → deposits: iScheduledDeposit[]
          ▼
ScheduledDeposits component
          │  mobile: deposits.slice(0, 1)
          │  desktop: deposits.slice(0, 5)
          ▼
AccordionHeader           AccordionPanel
  piggy bank img            dt/dd grid (2 cols)
  merchant · amount · date  From | Last
                            Description | Next
                            Frequency |
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
- **idle** — `user` is null; no fetch attempted; `deposits = []`
- **loading** — fetch in flight; mask + spinner shown
- **success** — data ready; filtered deposits rendered in accordion
- **error** — fetch failed; toast fired; mask + retry button shown

---

## 4. Mobile vs Desktop visibility

```
window.innerWidth < 1024   →   deposits.slice(0, 1)   → 1 accordion item
window.innerWidth ≥ 1024   →   deposits.slice(0, 5)   → up to 5 accordion items
```

All sliced items must have `isActive: true` (filtering applied in hook before returning).

---

## 5. Accordion panel layout

```
┌─────────────────────────────────────────────────────┐
│  [piggy] Next upcoming deposit from Employer Inc     │
│           for $2,500.00 on 2026-06-20               ▶ │
└─────────────────────────────────────────────────────┘
  ↓ expanded
┌────────────────────────┬────────────────────────────┐
│ From                   │ Last                        │
│ Employer Inc           │ 2026-06-01 · $2,500.00     │
│                        │                             │
│ Description            │ Next                        │
│ DIRECT DEPOSIT         │ 2026-06-20 · $2,500.00     │
│                        │                             │
│ Frequency              │                             │
│ Biweekly               │                             │
└────────────────────────┴────────────────────────────┘
```

---

## 6. File map

```
src/
├── types/
│   └── types.ts                                  (add 2 interfaces)
├── mocks/
│   └── handlers.ts                               (add scheduledDeposits handlers)
├── services/
│   ├── scheduledDepositsService.ts               (new)
│   └── scheduledDepositsService.test.ts          (new, write first)
├── hooks/
│   ├── useScheduledDeposits.ts                   (new)
│   └── useScheduledDeposits.test.ts              (new, write first)
└── components/
    ├── ScheduledDeposits/
    │   ├── ScheduledDeposits.tsx                 (new)
    │   ├── ScheduledDeposits.test.tsx            (new, write first)
    │   └── scheduledDeposits.scss                (new)
    └── Homepage/
        ├── HomepagePage.tsx                      (edit — add <ScheduledDeposits />)
        └── HomepagePage.test.tsx                 (edit — add mock + render test)
styles/
└── index.scss                                    (add @use for scheduledDeposits)
_dev/
└── ARCHITECTURE.md                               (document new files)
```
