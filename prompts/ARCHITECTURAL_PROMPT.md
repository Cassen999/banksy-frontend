# Claude Agent Project Setup Prompt

Use this prompt verbatim (or adapt minimally) when initializing a Claude agent for a new project that shares this stack. Everything below is generic — no project-specific content is included.

---

## Prompt

You are building a React + TypeScript SPA with the following stack:

- **React 19** with functional components and hooks
- **TypeScript ~5.9** in strict mode
- **Vite 7** as bundler and dev server
- **SCSS/Sass** for styling (no CSS-in-JS)
- **PrimeReact 10** as the component library
- **React Router 7** for client-side routing
- **Vitest 4** + **React Testing Library 16** + **userEvent 14** for testing
- **ESLint 9** with `typescript-eslint` and `eslint-plugin-react-hooks`

The project architecture, conventions, commands, and testing strategy below define how this project is built. Follow them exactly.

---

## _dev/ Documentation

Maintain a `_dev/` folder at the project root with the following files:

- `_dev/ARCHITECTURE.md` — folder structure, routing table, file naming conventions, adding-new-files checklist, SCSS conventions, context policy
- `_dev/COMPONENTS.md` — a living registry of every component, page, hook, service, and helper. Update it whenever a new one is added or removed.
- `_dev/plans/` — subfolder for feature plans and testing plans

**Always read `_dev/ARCHITECTURE.md` and `_dev/COMPONENTS.md` before making any structural changes. Check `_dev/COMPONENTS.md` before creating any new component, hook, or service — it may already exist.**

---

## Folder Structure

```
src/
├── main.tsx               # Entry — mounts App with StrictMode
├── App.tsx                # Route definitions (default export)
├── components/            # One folder per component; page + SCSS colocate inside
│   └── MyComponent/
│       ├── MyComponent.tsx
│       ├── MyComponentPage.tsx   # if this component has an associated page
│       └── myComponent.scss
├── contexts/              # React contexts — do not add without permission
├── hooks/                 # Custom hooks — must use 'use' prefix
├── services/              # External API calls and storage adapters
├── helpers/               # Pure utility functions (no side effects)
├── styles/                # Global and root styles only
│   ├── index.scss         # Aggregates all SCSS imports
│   ├── globalStyles.scss
│   ├── root.scss
│   └── variables.scss
├── test/
│   └── setup.ts           # Vitest setup file
├── types/
│   └── types.ts           # All shared TypeScript types
└── assets/                # Static files
```

---

## Naming Conventions

| Type | Convention | Example |
|---|---|---|
| Interface | `i` prefix, PascalCase | `iButtonProps` |
| Type alias | `t` prefix, PascalCase | `tVariant` |
| Component | PascalCase file, default export | `Button.tsx` |
| Page component | PascalCase + `Page` suffix if sharing a folder with a same-name component | `DashboardPage.tsx` |
| Context | PascalCase + `Context` suffix, named export | `ThemeContext.tsx` |
| Hook | camelCase + `use` prefix, named export | `useDebounce.ts` |
| Service | camelCase | `userService.ts` |
| Helper | camelCase | `formatHelpers.ts` |
| SCSS | camelCase, matching the component | `button.scss` |

---

## TypeScript

- All shared types live in `src/types/types.ts`
- Local-only types are defined at the top of the file that uses them
- Use `interface` for object shapes (prefixed `i`); use `type` for unions and aliases (prefixed `t`)
- Every interface property that has a default value **must** include a `/** @default <value> */` JSDoc comment. Apply this to all new types and any existing type you edit.
- Use `import type` syntax for type-only imports

---

## Components

- Functional components only — no class components
- Props are typed with an `i`-prefixed interface and destructured in the function signature
- Default exports for components; named exports for contexts and hooks
- Use `useMemo` for expensive derived values and for all context values
- When state is needed inside `setInterval` or event callbacks, use both `useState` (for re-renders) and `useRef` (to avoid stale closures) in tandem

---

## Context

- **Do not create a new context without asking first.** If state needs to be shared across files, raise it to a common ancestor rather than creating a new context.
- Context values must be memoized with `useMemo`
- Group related state and setters together in the context value object
- Every context hook must throw a descriptive error when used outside its provider

---

## SCSS / Styling

- All SCSS files are imported centrally through `src/styles/index.scss`
- Component SCSS files live in the component's folder
- Global and root styles live in `src/styles/`
- Reference `variables.scss` from a component SCSS file with a relative path (e.g. `../../styles/variables.scss`)
- Use CSS custom properties (`var(--primary-color)`) — no hardcoded color values
- BEM naming: `.block`, `.block__element`, `.block--modifier`
- Maximum 2 levels of nesting — nest only when it adds clarity
- Keyframe animations are defined at the top of the relevant SCSS file, outside any selector
- Avoid inline styles; use class names instead

---

## File Structure Rules

- Each component lives in its own folder under `src/components/`
- Its associated page lives in the same folder (suffix the page file with `Page` to avoid a filename collision)
- Its SCSS file lives in the same folder
- If a page and a component share the same domain, they share a single SCSS file in that folder
- `src/styles/index.scss` imports all SCSS — reference component SCSS with the path `../components/<Name>/<file>.scss`

### Adding New Files Checklist

**New page:**
1. Determine if it shares a domain with an existing component
   - If yes: create `src/components/Foo/FooPage.tsx` alongside the component
   - If no: create `src/components/Foo/Foo.tsx` in a new folder
2. Add a `<Route>` in `App.tsx`
3. Add a nav item in the navigation component
4. Create the SCSS file and import it in `src/styles/index.scss`

**New component:**
1. Create `src/components/MyComponent/MyComponent.tsx`
2. Create `src/components/MyComponent/myComponent.scss`
3. Import the SCSS in `src/styles/index.scss`

**New hook:**
1. Create `src/hooks/useMyHook.ts`

**New service:**
1. Create `src/services/myService.ts`

**New types:**
- Shared → `src/types/types.ts`
- Local → top of the file that uses them

---

## Git

Branch model: `main` → `develop` → feature branches

- **`main`** — stable/release only. Never commit here directly.
- **`develop`** — integration branch. Never commit here directly.
- **Feature branches** — always branch off `develop`. PR back into `develop` when done.
- Before any commit, confirm the current branch is a feature branch (not `main` or `develop`)

---

## npm Scripts

```bash
npm start             # Vite dev server
npm run build         # tsc + vite build
npm run lint          # ESLint
npm test              # Vitest watch mode
npm run test:run      # Single run (run before every commit)
npm run test:coverage # Single run with coverage report
```

**Run `npm run test:run`, `npm run lint`, and `npm run build` before every commit. Do not commit if any of them fail.**

---

## CLAUDE.md

Create a `CLAUDE.md` at the project root. It must include:

1. A pointer to `_dev/` for architecture and component registry
2. All naming conventions (above)
3. TypeScript rules (above)
4. Component rules (above)
5. Context rules (above)
6. SCSS/styling rules (above)
7. File structure rules and adding-new-files checklist (above)
8. Git branching model (above)
9. Best practices guardrail (below)
10. General coding principles (below)
11. Testing rules (below)
12. Edge case handling (below)

---

## Best Practices Guardrail

If a request contradicts current best practices for React, TypeScript, CSS, SCSS, Vite, JavaScript, WCAG accessibility, or PrimeReact, **flag it before proceeding**:

- State exactly what rule or guideline it violates
- Name the standard/version where relevant (e.g. WCAG 2.2, React 19, PrimeReact v10)
- Suggest the recommended alternative
- Ask whether to proceed with the request or use the suggested approach

Do not silently comply with something that violates best practices.

---

## General Coding Principles

- Don't add features, refactors, or improvements beyond what was asked
- Don't add comments unless the logic is non-obvious (a hidden constraint, subtle invariant, or workaround for a specific bug)
- Don't add error handling for scenarios that can't happen — trust framework and TypeScript guarantees; only validate at system boundaries
- Don't design for hypothetical future requirements
- Keep responses short and direct
- In development, surface edge cases with `if (import.meta.env.DEV) console.warn(...)` rather than silently swallowing them

---

## Testing Strategy

Full strategy lives in `_dev/plans/testing/TESTING_STRATEGY.md`. Read it before writing or running any tests.

### Setup

- Test runner: **Vitest** configured in `vite.config.ts`
- Setup file: `src/test/setup.ts` (imports `@testing-library/jest-dom`)
- `vite.config.ts` test config:

```ts
test: {
  globals: true,
  environment: 'jsdom',
  setupFiles: ['./src/test/setup.ts'],
  coverage: {
    provider: 'v8',
    thresholds: {
      lines: 90,
      branches: 85,
      functions: 90,
      statements: 90,
    },
    exclude: ['node_modules', 'src/test/**', 'vite.config.ts'],
  },
},
```

### File Organization

- Test files are colocated with the component: `<ComponentName>.test.tsx`
- Every file in `src/helpers/` and `src/services/` must have a colocated `.test.ts`

### Rules

- Test **user-observable behavior**, not implementation details
- Use the **Arrange / Act / Assert** pattern with `describe` blocks and human-readable test names
- Query priority: `getByRole` → `getByLabelText` → `getByText` → `getByPlaceholderText` → `getByTestId` (last resort)
- Use `userEvent` for all interactions; use `fireEvent` only when `userEvent` is not viable
- When a component registers `window.addEventListener`, test it with `fireEvent` on `window` or `document`
- Dialog tests must cover the full flow: submit, cancel, and any conditional state — opening alone is not sufficient
- Every exported function in `src/helpers/` and `src/services/` must be tested with explicit inputs and outputs
- Mock at the network/service boundary only; do not mock the component under test or React internals
- Call `vi.clearAllMocks()` in `beforeEach` when mocks are present

### Coverage

Run `npm run test:coverage` before closing any testing task. If the file under test is below global thresholds, add tests before moving on.

### Context Testing

Use an inline `TestConsumer` to test context functions directly:

```tsx
const TestConsumer = () => {
  const { myFn } = useMyContext()
  return <button onClick={myFn}>Run</button>
}
render(<MyProvider><TestConsumer /></MyProvider>)
```

Also test each context hook's error-guard throw by rendering the consumer outside its provider.

### Failure Reporting

If tests fail, immediately generate:
- A report entry in `_dev/plans/testing/TESTING_REPORTS.md` with ID `TEST-YYYYMMDD-XXX`
- A fix plan in `_dev/plans/testing/FIX_PLANS.md`

Only implement a fix plan when explicitly instructed.

### PrimeReact-Specific Patterns

- **Dropdown:** mock with a native `<select>` via `vi.mock('primereact/dropdown', ...)` and interact via `fireEvent.change`
- **ColorPicker:** exempt from coverage — mock with a plain `<button>` and document in the SKIP table
- **Input interactions:** test focus → type → blur in sequence using `userEvent`

---

## Edge Case Handling

When an edge case is not explicitly defined in the plan or feature spec:

- **Prefer non-destructive behavior** — do not remove, mutate, or overwrite existing data unless the feature explicitly requires it
- **Log a warning in development** using `if (import.meta.env.DEV) console.warn(...)` — visible during development, silent in production

