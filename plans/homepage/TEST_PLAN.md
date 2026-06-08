# Homepage — Test Plan

## Test file
`src/components/Homepage/HomepagePage.test.tsx`

## Approach
- Render `HomepagePage` wrapped in `BrowserRouter`
- Mock `useAuth` via `vi.mock`
- Asset imports handled by Vitest config

---

## Test cases

### Logged-out state
1. Renders `h1` with text `"Please log in to be finance guy"` when `user` is `null`
2. Does NOT render the Banksy logo `<img>` when logged out
3. Does NOT render the welcome text when logged out
4. Does NOT render any nav buttons when logged out

### Logged-in state
5. Renders `h1` containing `"Welcome to"` when `user` is defined
6. Renders `<img alt="Banksy">` inside the h1 when logged in
7. Does NOT render the logged-out message when logged in
8. Renders all 5 nav buttons when logged in
9. Renders a `<nav>` element when logged in

### Structural / Accessibility
10. Contains exactly one `h1` element
11. Nav has accessible label `"Main navigation"`

---

## Mocking strategy

### `useAuth`
```ts
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}))
```
Set return value per test:
```ts
(useAuth as ReturnType<typeof vi.fn>).mockReturnValue({ user: null, isLoading: false, clearUser: vi.fn() })
```

### Asset imports
Handled by Vite/Vitest config — static assets return their filename string in tests.
