# Homepage — Diagrams

## Component tree

```
App.tsx
└── AuthProvider
    └── Layout
        └── main
            └── HomepagePage          (route: /)
                └── div.homepage
                    └── div.homepage__content
                        ├── h1.homepage__heading
                        │   ├── [logged out]  "Please log in to be finance guy"
                        │   └── [logged in]   "Welcome to " + <img alt="Banksy" />
                        └── nav.homepage__nav   [logged in only]
                            ├── <Button> Dashboard
                            ├── <Button> Accounts
                            ├── <Button> Transactions
                            ├── <Button> Reports
                            └── <Button> Settings
```

---

## Layout — Mobile (<1024px, logged-in)

```
┌──────────────────────────┐
│                          │
│  Welcome to [logo]       │  ← h1, centered
│                          │
│  [Dashboard]             │
│  [Accounts]              │  ← nav, flex column
│  [Transactions]          │
│  [Reports]               │
│  [Settings]              │
│                          │
└──────────────────────────┘
```

---

## Layout — Desktop (≥1024px, logged-in)

```
┌─────────────────────────────────────────────────┐
│                                                   │
│          Welcome to [banksy-logo]                 │  ← h1, inline-flex, centered
│                                                   │
│          [Dashboard]     [Accounts]               │
│          [Transactions]  [Reports]                │  ← nav, 2-col CSS grid
│          [Settings]                               │
│                                                   │
│                                                   │
└─────────────────────────────────────────────────┘
```

Grid auto-flow: 5 items in 2 columns → col 1: Dashboard / Transactions / Settings (3), col 2: Accounts / Reports (2)

---

## Layout — Logged-out (both viewports)

```
┌──────────────────────────┐
│                          │
│  Please log in to be     │  ← h1, centered
│  finance guy             │
│                          │
└──────────────────────────┘
```

---

## Auth state flow

```
useAuth() → { user }
    │
    ├─ user === null  →  "Please log in to be finance guy"  (no nav)
    │
    └─ user !== null  →  "Welcome to " + <img banksy-logo.png />
                         + <nav> with 5 buttons
```

---

## Data flow

No API calls. No side effects beyond reading auth context. Display-only.

```
AuthContext (already loaded by AuthProvider on app boot)
    └── useAuth() → user
            └── HomepagePage renders based on user !== null
```
