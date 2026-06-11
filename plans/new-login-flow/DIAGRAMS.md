# Diagrams — New Login Flow

## Route Map

```
/ ──(redirect)──► /dashboard   HomepagePage
                  /account      AccountPage
                  /settings     SettingsPage
```

## Auth Gate — ViewportMask State Machine

```
App loads
    │
    ▼
user === null (isLoading = true)
    │
    ├─► ViewportMask visible (spinner only)
    │       layout inert = true
    │
    ▼
fetchMe() resolves
    │
    ├── user found ──► mask hidden, layout inert = false
    │                  Layout checks sessionStorage flag
    │                  ├── flag present → success toast "Login Successful / Welcome to Banksy!" → clear flag
    │                  └── flag absent  → no toast (returning session)
    │
    └── no user ────► ViewportMask visible (login prompt + AuthButton)
                      layout inert = true
                      ViewportMask checks sessionStorage flag
                      ├── flag present → error toast "Something went wrong..." → clear flag → focus login button
                      └── flag absent  → no toast (fresh unauthenticated visit)
```

## Login Notification — sessionStorage Flag

```
User clicks Login (AuthButton)
    │
    ├── sessionStorage.setItem('banksy_login_pending', '1')
    └── window.location.href = .../oauth2/authorization/google
            │
            ▼
        [Google OAuth]
            │
            ▼
        Backend callback → redirect to frontend
            │
            ▼
        App remounts → fetchMe()
            │
            ├── 200 user   → Layout fires success toast, clears flag
            └── null user  → ViewportMask fires error toast, clears flag, focuses login button
```

## Component Tree (auth-relevant)

```
App
└── AuthProvider
    └── NotificationProvider
        └── <>
            ├── div.layout [inert when !user]
            │   ├── AppHeader
            │   │   ├── (mobile) hamburger only
            │   │   └── (desktop) brand logo + Menubar + welcome text
            │   ├── AppSidebar
            │   └── main.layout__body
            │       ├── /dashboard → HomepagePage
            │       ├── /account   → AccountPage
            │       └── /settings  → SettingsPage
            │                           └── AuthButton
            └── ViewportMask (position: fixed, z-index: 1000)
                    ├── (isLoading) ProgressSpinner
                    └── (!isLoading) "Please login to be finance guy"
                                     AuthButton (ref → loginButtonRef)
```

## AuthButton — forwardRef + Two Use Sites

```
ViewportMask
    └── AuthButton (ref=loginButtonRef) ──► login / logout
            handleLogin: set flag → redirect
            handleLogout: redirect (no flag)

SettingsPage
    └── AuthButton (no ref needed) ──► logout only (user is always logged in here)
```

## Mask CSS — Theme Awareness

```
:root                    → --color-mask-bg: rgba(255, 255, 255, 0.88)
[data-theme='dark']      → --color-mask-bg: rgba(0, 0, 0, 0.88)
```
