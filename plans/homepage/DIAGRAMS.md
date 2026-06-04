# Homepage — Diagrams

## Component tree

```
App.tsx
└── AuthProvider
    └── Layout
        └── main
            └── HomepagePage          ← new (route: /)
                ├── div.homepage__animation   (mobile only, aria-hidden)
                │   └── <Lottie>
                └── div.homepage__message     (mobile) / div.homepage__overlay (desktop)
                    └── h1
                        ├── [logged out]  "Please log in to be finance guy"
                        └── [logged in]   "Welcome to " + <img alt="Banksy" />
```

---

## Layout — Mobile (<1024px)

```
┌──────────────────────────┐  ← 100vh
│                          │
│    Lottie animation      │  ← ~65vh
│    (budget-animation)    │
│                          │
├──────────────────────────┤
│                          │
│   h1: message            │  ← ~35vh, centered
│                          │
└──────────────────────────┘
```

---

## Layout — Desktop (≥1024px)

```
┌────────────────────────────┬────────────┐
│                            │            │
│   stonks.png               │transparent │
│   (background-image:       │  cutout    │
│    cover)                  │            │
│                            │  h1:       │
│   ~70% of width            │  message   │
│                            │ (vertically│
│                            │  centered) │
│                            │            │
└────────────────────────────┴────────────┘
                               ← ~30% →
```

---

## Auth state flow

```
useAuth() → { user }
    │
    ├─ user === null  →  "Please log in to be finance guy"
    │
    └─ user !== null  →  Mobile: "Welcome to Banksy, where dreams are dreams"
                         Desktop: "Welcome to " + <img banksy-logo.png />
```

---

## Data flow

No API calls. No side effects. Display-only.

```
AuthContext (already loaded by AuthProvider on app boot)
    └── useAuth() → user
            └── HomepagePage renders based on user !== null
```
