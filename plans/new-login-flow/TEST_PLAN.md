# Test Plan — New Login Flow

## AuthButton (`AuthButton.test.tsx`)
- Renders "Login" label when `user` is null
- Renders "Logout" label when `user` is present
- Clicking "Login" sets `sessionStorage['banksy_login_pending']` before redirecting
- Clicking "Login" sets `window.location.href` to the OAuth URL
- Clicking "Logout" sets `window.location.href` to the logout URL (no sessionStorage flag)
- Button has `rounded` prop (check for PrimeReact rounded class)
- Forwards ref to the underlying `<button>` DOM element

## ViewportMask (`ViewportMask.test.tsx`)
- Renders nothing when user is present
- Renders the mask element when user is null and not loading
- Shows a spinner (`ProgressSpinner`) when `isLoading` is true and user is null
- Does not show spinner when `isLoading` is false
- Shows "Please login to be finance guy" when not loading and user is null
- Renders `AuthButton` when not loading and user is null
- Does not render `AuthButton` while loading
- When `banksy_login_pending` flag is in sessionStorage and auth resolves with no user:
  - Calls `triggerToast` with `severity: 'error'` and the correct summary message
  - Removes the flag from sessionStorage
  - Calls focus on the login button ref
- Does not call `triggerToast` when flag is absent

## Layout (`Layout.test.tsx`)
- Dashboard nav item has `url: '/dashboard'`
- Settings nav item has `url: '/settings'`
- Applies `inert` attribute to layout div when user is null
- Does not apply `inert` when user is present
- Renders `<ViewportMask />`
- When `banksy_login_pending` flag is in sessionStorage and auth resolves with a user:
  - Calls `triggerToast` with `severity: 'success'`, `summary: 'Login Successful'`, `detail: 'Welcome to Banksy!'`
  - Removes the flag from sessionStorage
  - Calls `triggerToast` with no explicit duration (uses default)
- Does not call `triggerToast` for success when flag is absent

## SettingsPage (`SettingsPage.test.tsx`)
- Renders a "Settings" heading
- Renders an `AuthButton`

## AppHeader (`AppHeader.test.tsx`)
- Does not render an auth button
- Does not render the mobile app logo (`.header__app-logo`)
- Renders the hamburger button
- Renders the desktop brand logo
- Renders the Menubar with nav items

## HomepagePage (`HomepagePage.test.tsx`)
- Always renders the full homepage content regardless of auth state
- Does not render "Please log in" text under any condition
