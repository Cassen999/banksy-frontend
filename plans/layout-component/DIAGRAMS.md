# Diagrams — Layout Component

---

## 1. Component Tree

```
main.tsx
└── StrictMode
    └── ThemeProvider          [stays in main.tsx — not moved]
        └── BrowserRouter
            └── PrimeReactProvider
                └── App.tsx
                    └── AuthProvider           ← NEW (src/contexts/AuthContext.tsx)
                        └── Layout             ← NEW (src/components/Layout/)
                            ├── AppHeader      ← NEW (src/components/AppHeader/)
                            ├── AppSidebar     ← NEW (src/components/AppSidebar/) [mobile only, CSS-hidden on desktop]
                            ├── Backdrop div   [portal-free overlay, rendered by Layout]
                            └── <main>
                                └── {children} ← future page-level context providers wrap here
                                    └── Routes (from App.tsx)
                                        └── <Route path="/" element={<p>placeholder</p>} />
```

---

## 2. Mobile Layout (base, 390px–1023px)

```
┌─────────────────────────────────┐  ← viewport
│ ┌─────────────────────────────┐ │
│ │ HEADER  (role="banner")     │ │  ← full width, single row
│ │ [☰] [app-logo] [Login btn] │ │
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │ MAIN  (role="main")         │ │
│ │                             │ │  ← single column
│ │  <h1>Page Title</h1>        │ │
│ │  page content               │ │
│ │                             │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

**Mobile — Sidebar Open:**

```
┌─────────────────────────────────┐
│ ┌──────────────┐┌──────────────┐│
│ │ SIDEBAR      ││ BACKDROP     ││
│ │ [X]          ││ (semi-opaque)││
│ │ [👤] Jane Doe││              ││  ← sidebar overlays header + content
│ │ ─────────    ││   tap to     ││
│ │ Dashboard    ││   close      ││
│ │ Accounts     ││              ││
│ │ Transactions ││              ││
│ │ Reports      ││              ││
│ │ Settings     ││              ││
│ │              ││              ││
│ │ © Banksy     ││              ││  ← pinned to bottom
│ └──────────────┘└──────────────┘│
└─────────────────────────────────┘
```

---

## 3. Desktop Layout (1024px+)

```
┌─────────────────────────────────────────────────────────────────┐
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ HEADER  (role="banner")                                     │ │
│ │ [banksy-logo] ┌─────────────────────┐ Welcome Jane! [Logout]│ │
│ │               │ ╭─────────────────╮ │                       │ │
│ │               │ │  [app-logo] Nav │ │  ← floating pill      │ │
│ │               │ ╰─────────────────╯ │                       │ │
│ │               └─────────────────────┘                       │ │
│ └─────────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ MAIN  (role="main")            two-column grid              │ │
│ │                                                             │ │
│ │  ┌────────────────────┐   ┌────────────────────┐           │ │
│ │  │  col 1             │   │  col 2             │           │ │
│ │  │  <h1>Page</h1>     │   │                    │           │ │
│ │  │  content           │   │  content           │           │ │
│ │  └────────────────────┘   └────────────────────┘           │ │
│ │                                                             │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Sidebar Animation State Machine

```
               ┌─────────────────┐
               │  CLOSED         │
               │  translateX(-100%)│
               │  aria-hidden=true│
               └────────┬────────┘
                        │ user clicks ☰ (header)
                        ▼
               ┌─────────────────┐
               │  OPEN           │
               │  translateX(0)  │
               │  role="dialog"  │
               │  aria-modal=true│
               └────────┬────────┘
                        │ user clicks:
                        │  • X button (inside sidebar)
                        │  • backdrop overlay
                        ▼
               ┌─────────────────┐
               │  CLOSED         │
               │  translateX(-100%)│
               └─────────────────┘

  CSS transition: transform 300ms ease (GPU-composited, no layout thrash)
  Body scroll:    overflow:hidden on <body> while open; restored on close
```

---

## 5. Auth State Flow

```
App loads
    │
    ▼
AuthProvider mounts
    │
    ├── isLoading: true
    ├── registers clearUser with auth.ts (for 401 interceptor)
    │
    ▼
authService.fetchMe() → GET /api/auth/me
    │
    ├── 200 OK ──────────────────────────────────────────────────────────►  user = iUser
    │                                                                        isLoading = false
    │
    └── any error ────────────────────────────────────────────────────────►  user = null
         (302→/login→Google, network err, etc.)                              isLoading = false

─────────────────────────────────────────────────────────────────────────────

Login button clicked (user === null)
    │
    ▼
window.location.href = `${VITE_API_BASE_URL}/login`
    │
    ▼
Browser → Spring Security → Google OAuth → backend callback
    │
    ▼
Spring redirects to /api/auth/me (defaultSuccessUrl)
    │
    ▼
React app re-mounts / user navigates back → AuthProvider fetchMe() runs → user populated

─────────────────────────────────────────────────────────────────────────────

Logout button clicked (user !== null)
    │
    ▼
authService.logout() → POST /api/auth/logout
    │
    ├── success
    │       │
    │       ├── clearUser() → user = null
    │       └── window.location.href = `${VITE_API_BASE_URL}/login`
    │
    └── error → surface in DEV console (non-destructive, user stays logged in visually)

─────────────────────────────────────────────────────────────────────────────

Any protected endpoint → 401
    │
    ▼
apiClient interceptor → handleUnauthorized()
    │
    ├── _clearUser?.()  (registered by AuthProvider on mount)
    └── window.location.href = `${VITE_API_BASE_URL}/oauth2/authorization/google`
```

---

## 6. File Dependency Graph

```
src/utils/auth.ts
  ← exports: handleUnauthorized, registerClearUser
  ← used by: apiClient interceptor, AuthContext (to register clearUser)

src/services/authService.ts
  ← uses: apiClient
  ← exports: fetchMe, logout
  ← used by: AuthContext (fetchMe on mount), AppHeader (logout on button click)

src/contexts/AuthContext.tsx
  ← uses: authService.fetchMe, registerClearUser from auth.ts
  ← exports: AuthProvider, useAuth
  ← used by: App.tsx (AuthProvider), AppHeader (useAuth), AppSidebar (useAuth)

src/components/AppSidebar/AppSidebar.tsx
  ← uses: useAuth
  ← receives: isOpen, onClose, items (MenuItem[])
  ← used by: Layout

src/components/AppHeader/AppHeader.tsx
  ← uses: useAuth, authService.logout
  ← receives: isSidebarOpen, onSidebarToggle, items (MenuItem[])
  ← used by: Layout

src/components/Layout/Layout.tsx
  ← uses: AppHeader, AppSidebar
  ← owns: isSidebarOpen state, NAV_ITEMS
  ← used by: App.tsx
```
