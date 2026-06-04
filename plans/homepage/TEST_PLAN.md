# Homepage — Test Plan

## Test file
`src/components/Homepage/HomepagePage.test.tsx`

## Approach
- Render `HomepagePage` wrapped in a mock `AuthProvider` (or mock `useAuth`)
- Use `@testing-library/react`
- Mock `lottie-react` (export a no-op component) to avoid canvas/animation in jsdom
- Mock asset imports (`stonks.png`, `banksy-logo.png`, `budget-animation.json`) — Vite's test config already handles static asset mocking

---

## Test cases

### Logged-out state
1. Renders `h1` with text `"Please log in to be finance guy"` when `user` is `null`
2. Does NOT render the Banksy logo `<img>` when logged out
3. Does NOT render the logged-in welcome text when logged out

### Logged-in state
4. Renders `h1` containing `"Welcome to"` when `user` is defined
5. Renders `<img alt="Banksy">` inside the h1 when logged in
6. Does NOT render the logged-out message when logged in

### Structural / Accessibility
7. Contains exactly one `h1` element
8. Lottie container has `aria-hidden="true"`

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

### `lottie-react`
```ts
vi.mock('lottie-react', () => ({
  default: () => <div data-testid="lottie-mock" />,
}))
```

### Asset imports
Handled by Vite/Vitest config — static assets return their filename string in tests.
