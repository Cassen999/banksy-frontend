# Dashboard — Diagrams

## Mobile Layout (default)

```
┌─────────────────────────────┐  ← AppHeader (sticky, var(--header-height): 64px)
│  [≡]                        │    border-bottom hidden on mobile
├─────────────────────────────┤
│                             │
│   dashboard__graph          │  25% of (100vh - 64px)
│   (line graph placeholder)  │
│                             │
├─────────────────────────────┤
│ dashboard__next-deposit     │  ~PrimeReact Message height (~3rem + padding)
├─────────────────────────────┤
│                             │
│   dashboard__accounts       │  flex: 1 (remaining space)
│   (accounts overview)       │
│                             │
└─────────────────────────────┘
```

## Desktop Layout (≥ 1024px)

```
┌─────────────────────────────────────────────────────┐
│  [Logo]   [Dashboard] [Accounts] [...]   Welcome X! │  border-bottom shown here
├─────────────────────────────────────────────────────┤
│                                                     │
│   dashboard__graph  (grid-column: 1 / -1)           │  25% of functional viewport
│                                                     │
├─────────────────────────────────────────────────────┤
│   dashboard__next-deposit (full width)              │
├─────────────────────────────────────────────────────┤
│                                                     │
│   dashboard__accounts (full width, flex: 1)         │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## Header Border Rule

| Breakpoint | `border-bottom` on `.header` |
|---|---|
| Mobile (< 1024px) | hidden |
| Desktop (≥ 1024px) | `1px solid var(--blue-300)` |
