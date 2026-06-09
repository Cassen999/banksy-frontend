# New Feature Request - Link Bank Account

Summary:
This feature will provide a Banksy user a way to link bank accounts to Plaid so that we can pull and display their banking data, along with an Accounts page for holding future account management options.

## Prerequisites

1. Install `react-plaid-link`

## Backend connections (Services to build)

1. Call `GET /api/plaid/link-token` and return the `link_token` string
2. Call `POST /api/plaid/exchange` with the public token payload returned by Plaid's `onSuccess` callback after the user completes the modal

## TypeScript types to add to `src/types/types.ts`

1. `iPlaidLinkTokenResponse` — shape of the `GET /api/plaid/link-token` response: `{ link_token: string }`
2. `iPlaidExchangeRequest` — shape of the `POST /api/plaid/exchange` request body: `{ publicToken: string, institutionId: string, institutionName: string, expiredItemId: string | null }`
3. `iPlaidExchangeResponse` — shape of the `POST /api/plaid/exchange` response: `{ status: "ok", message: string }`

## UI Flow (Full user and data flow)

1. User clicks "Link Account" button
2. Frontend calls `GET /api/plaid/link-token` to fetch a link token from the backend
3. Frontend passes the returned `link_token` to the `react-plaid-link` package, which opens the Plaid modal
4. User follows the modal's prompts to link an account entirely within Plaid's hosted UI
5. Once the user completes the modal, Plaid's `onSuccess` callback fires automatically. The frontend must immediately call `POST /api/plaid/exchange` with:
   ```
   {
     publicToken:     string   ← from Plaid's onSuccess callback argument
     institutionId:   string   ← from onSuccess metadata.institution.institution_id
     institutionName: string   ← from onSuccess metadata.institution.name
     expiredItemId:   null     ← always null for a new connection
   }
   ```
6. On a successful exchange response the frontend will trigger a toast notification informing the user their account was linked successfully

## UI Elements to build

### Accounts page

Summary:
A basic page that will live at the `/account` route. This route must be added to the application router. The page will contain buttons to initiate various account-related options. For now the only option is Link Account.

Requirements:

1. H1 reading "Account Actions" — upper left aligned in the layout body
2. Below the H1 a short description of the page, e.g. "These are all the available actions to manage your Banksy bank links. Click a button below to get started"
3. Below that, centered, a grid of buttons for all available actions. For now only the Link Account button described in the Multistate Button section exists
4. Navigation: in the desktop header replace the first placeholder nav option with the label "Accounts" and the wallet icon from PrimeIcons, icon on the left followed by the label. In the mobile sidebar replace the first placeholder option with the same label and icon in the same order. Clicking either navigates to `/account`

### Multistate button

Summary:
This button is labelled "Link Account" and initiates the bank link flow.

Requirements:

1. Built using PrimeReact's Button component, styled as the primary button
2. Must be a standalone component that can be placed anywhere
3. On click, triggers the `GET /api/plaid/link-token` call. Reference `backend-reference/` to construct this request
4. Has two distinct states:
   - **Default state:** Button is labelled "Link Account", enabled, and styled as the standard PrimeReact primary button
   - **Loading state:** Button is disabled with a loading spinner added to the left of the label. Use PrimeReact Button's `loading` and `disabled` properties
5. State transitions:
   - Default state is the initial state and the state the button returns to unless an API call is actively in progress
   - Loading state is triggered **immediately** on user click and persists until one of the following conditions is met:
     - **Condition 1 — Link success:** Backend returns `200` with `{ status: "ok", message: "Plaid authentication successful" }`
     - **Condition 2 — Backend failure:** Backend returns `401` or `500`
     - **Condition 3 — User cancels:** The Plaid modal closes without the user completing the flow (`onExit` fires with no error). No notification is shown
     - **Condition 4 — Plaid modal error:** The Plaid modal closes due to an error (`onExit` fires with a non-null error object). Show the toast notification described in Services below, then return to default state
   - Once any condition is met the button returns to default state
6. The button must be data agnostic and change states only based on external triggers responding to API call outcomes. The button's only responsibilities are:
   - Trigger the API call to initiate the link flow
   - Consume a trigger to flip between default and loading states

## Notification system

Summary: A global notification system to alert the user to important information. Frontend-only for now.

Requirements:

1. A notification context to track current notifications
2. Must support both a toast notification using PrimeReact's Toast component and a banner notification using PrimeReact's Message component
3. Must sit at project root within `Layout.tsx` so any component can request to add or remove a notification
4. The notification context must export a `useNotify` hook with the following:
   - **Show/hide** — a way to show or hide each notification type independently. Toast and banner must each have their own show/hide state
   - **Toast** — a toast configuration object that gives the developer full control over what the toast displays. The context holds a ref to the Toast component and calls `.show()` on it imperatively with this configuration when the show state is set to true
   - **Banner** — a message configuration object that extends the properties available to PrimeReact's Message component so the developer has full control over what the banner displays
   - **Memoized values** — all exported values from the context must be memoized to optimize performance and accurately reflect each internal state's current value
   - Must export the toast ref and banner configuration for `Layout.tsx` to pass to the respective components
5. In `Layout.tsx` there must be an idle Toast component. It is wired to the toast ref held in the notification context. When the context's toast show state is set to true, the context calls `.show()` on the ref with the configured message, causing the Toast component to display. The toast must have an X button to allow the user to dismiss it, and must auto-dismiss after 3 seconds
6. In `Layout.tsx` there must be an idle Message component. Its default state is hidden with an empty message. When a banner notification is triggered via the notification context, the Message component receives the banner configuration values and is displayed centered, 1rem below the header
7. When a notification is dismissed (by the user or by timeout), the dismissed notification's configuration state and show/hide state must be reset to their defaults. Clearing applies only to the respective component — dismissing a toast does not affect the banner and vice versa
8. Toast and banner notifications must be fully independent of each other
9. Notifications must never prevent any user interaction — they are informational only

## Services

### 1. Fetch a link token

**Endpoint:** `GET /api/plaid/link-token`
**Triggered:** User clicks "Link Account" button
**Happy path:** `200` — body contains `{ link_token: string }`. Pass this token to the Plaid SDK to open the modal
**Sad paths:**
- `401` Session expired — no body. Redirect to login, no notification
- `500` Server error — no body. Trigger a toast notification: "Something went wrong linking your bank. Please try again"

### 2. Exchange public token

**Endpoint:** `POST /api/plaid/exchange`
**Triggered:** Automatically inside Plaid's `onSuccess` callback — never directly by the user. Must fire immediately when `onSuccess` fires because the `public_token` returned by Plaid expires after 30 minutes

**Request body:**
```
{
  publicToken:     string   // from Plaid's onSuccess callback
  institutionId:   string   // from onSuccess metadata.institution.institution_id
  institutionName: string   // from onSuccess metadata.institution.name
  expiredItemId:   null     // always null for a new connection
}
```

**Happy path:** `200` — body is `{ status: "ok", message: "Plaid authentication successful" }`. Trigger a toast notification with this success message
**Sad paths:**
- `401` Session expired — no body. Redirect to login, no notification
- `500` Server error — no body. Trigger a toast notification: "Something went wrong linking your bank. Please try again"
