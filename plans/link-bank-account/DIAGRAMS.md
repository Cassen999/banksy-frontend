# Diagrams — Link Bank Account

---

## 1. Component tree (after this feature)

```
App.tsx
└── AuthProvider
    └── NotificationProvider         ← new; wraps Layout so Layout can call useNotify()
        └── Layout
            ├── AppHeader             (updated: Accounts item navigates to /account)
            ├── AppSidebar            (updated: Accounts item renders as <Link>)
            ├── <Toast ref={toastRef}> ← new; wired to NotificationContext toastRef
            ├── <Message ...>         ← new; conditionally rendered from banner state
            └── <main>
                └── Routes
                    ├── /    → HomepagePage
                    └── /account → AccountPage  ← new
                                   └── Account
                                       └── LinkAccount  ← new; uses useLinkAccount hook
```

---

## 2. Architecture layers — new files

```
Layer 1 — Pages/Views
  AccountPage.tsx           thin route wrapper

Layer 2 — Components
  Account.tsx               page layout: H1, description, actions grid
  LinkAccount.tsx           multistate button (default ↔ loading)

Layer 3 — Hooks
  useLinkAccount.ts         orchestrates Plaid modal + API calls + toasts

Layer 4 — Services
  plaidService.ts           fetchLinkToken(), exchangePublicToken()

Layer 5 — Types
  types.ts (additions)      iPlaidLinkTokenResponse, iPlaidExchangeRequest, iPlaidExchangeResponse

Context (global state)
  NotificationContext.tsx   toast ref + show/hide + banner config + show/hide
```

---

## 3. Notification context data flow

```
Any component calls:
  useNotify().showToast(config)
          │
          ▼
  NotificationContext
    sets showToast = true
    sets toastConfig = config
          │
          ▼ (useEffect watches showToast)
  toastRef.current.show(toastConfig)
          │
          ▼
  <Toast ref={toastRef} />      ← rendered in Layout.tsx
    displays message, auto-dismisses after 3 s (life: 3000 in config)
    X button calls onHide → context.hideToast()
          │
          ▼ (hideToast)
  showToast = false, toastConfig = null

─────────────────────────────────────────────────

Any component calls:
  useNotify().showBanner(config)
          │
          ▼
  NotificationContext
    sets showBanner = true
    sets bannerConfig = config
          │
          ▼
  Layout.tsx renders:
  {showBanner && <Message {...bannerConfig} />}
    centered, 1rem below header

  Dismiss: component calls useNotify().hideBanner()
    → showBanner = false, bannerConfig = null
```

---

## 4. LinkAccount button state machine

```
         ┌─────────────────┐
         │    DEFAULT      │  ← initial state
         │  label: "Link   │
         │   Account"      │
         │  disabled: false │
         └────────┬────────┘
                  │ user clicks
                  ▼
         ┌─────────────────┐
         │    LOADING      │
         │  spinner + label│
         │  disabled: true │
         └────────┬────────┘
                  │
          ┌───────┴──────────────────────────────┐
          │                                       │
          ▼                                       ▼
  Plaid onSuccess                         Plaid onExit
  + exchange 200 OK                           │
  → show success toast                ┌───────┴──────────┐
  → return DEFAULT                    │                   │
                                  no error            error present
                                  (user cancel)       (Plaid error)
                                  → return DEFAULT    → show error toast
                                                      → return DEFAULT

          Backend failure (fetch token 500):
          → show error toast
          → return DEFAULT
```

---

## 5. Plaid link flow — sequence

```
User           LinkAccount        useLinkAccount      plaidService       Plaid SDK
  │                │                    │                   │                │
  │── click ──────▶│                    │                   │                │
  │                │── initiate ───────▶│                   │                │
  │                │                    │── fetchLinkToken ─▶│                │
  │                │                    │                   │── GET /api/plaid/link-token
  │                │                    │                   │◀─ 200 {link_token}
  │                │                    │◀── link_token ────│                │
  │                │                    │                   │                │
  │                │                    │── setLinkToken ───▶ (state update) │
  │                │                    │                                    │
  │                │                    │ useEffect: ready && token          │
  │                │                    │─────── open() ────────────────────▶│
  │                │                    │                                    │
  │◀─── Plaid modal opens ──────────────────────────────────────────────────│
  │  (user interacts entirely within Plaid's hosted UI)                      │
  │                                                                           │
  │── completes modal ───────────────────────────────────── onSuccess() ───▶│
  │                │                    │◀── (publicToken, metadata) ───────│
  │                │                    │── exchangePublicToken ─────────────▶
  │                │                    │                   │── POST /api/plaid/exchange
  │                │                    │                   │◀─ 200 {status: "ok", ...}
  │                │                    │◀── response ──────│
  │                │                    │── showToast(success message)
  │                │                    │── isLoading = false
  │◀─── toast "Plaid authentication successful" ─────────────────────────────
```

---

## 6. Nav integration — Accounts item

```
Layout.tsx (inside component function, not module-level const)
  const navigate = useNavigate()
  const NAV_ITEMS: MenuItem[] = [
    { label: 'Dashboard',     icon: 'pi pi-home' },
    { label: 'Accounts',      icon: 'pi pi-wallet', command: () => navigate('/account'), url: '/account' },
    { label: 'Transactions',  icon: 'pi pi-list' },
    { label: 'Reports',       icon: 'pi pi-chart-bar' },
    { label: 'Settings',      icon: 'pi pi-cog' },
  ]

AppHeader (Menubar)
  items passed from Layout → PrimeReact Menubar calls item.command on click
  → navigate('/account') via React Router (no full page reload)

AppSidebar (custom <li> renderer)
  if (item.url)
    <li><Link to={item.url}><i .../> <span>label</span></Link></li>
  else
    <li><i .../> <span>label</span></li>
```
