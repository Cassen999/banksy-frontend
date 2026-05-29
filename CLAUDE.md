# Banksy Frontend — Claude Guidelines

## Active Feature Tracking

The file `plans/.active-feature` must always contain the name of the feature currently being worked on.

Rules:
- When you create a new plan folder under `plans/`, immediately write the folder name to `plans/.active-feature`
- When switching to a different existing feature, update `plans/.active-feature` before doing anything else
- Never delete `plans/.active-feature`
- The contents must exactly match an existing folder name under `plans/`

## Emergency Stop

If the user says **stop**, **cancel**, or **halt** (in any form), stop ALL work immediately.
Do not finish the current task. Do not write any more files. Do not run any more commands.
Acknowledge that you have stopped and wait for further instructions.

## Hook System

This project enforces a planning-first, test-alongside workflow via `.claude/hooks/`.

### Before writing any code (`audit_before_code.ts`)
Fires on every user prompt that contains implementation-related keywords. You must:
1. Complete all three audits (architecture, state, feature plans)
2. Deliver the required audit report
3. Wait for user confirmation before writing any implementation code

### Before every file write/edit (`enforce_during_implementation.ts`)
Gates enforced in order:
- Plan files (`plans/`) and markdown files (`.md`) are always allowed
- An active feature must be set in `plans/.active-feature`
- All three plan documents must exist for the active feature
- The user must have explicitly approved the plans
- Every new `.ts`/`.tsx` file under `src/` requires a co-located test file to exist first

### After every response (`definition_of_done.ts`)
Fires when `src/` TypeScript files have changed. Runs Vitest with coverage and checks:
- All tests pass
- Line and branch coverage ≥ 80%
- New `src/` files are documented in `_dev/ARCHITECTURE.md`

## Architecture Documentation

`_dev/ARCHITECTURE.md` is the canonical architecture reference. Keep it updated:
- Every new `src/` component, hook, service, or utility must be documented before the session closes
- When modifying an existing component, declare whether the change is **functional** or **non-functional**:
  - **Functional** (changes behaviour, usage, or output) → update `_dev/ARCHITECTURE.md`
  - **Non-functional** (whitespace, comment text, no behaviour change) → no update required

## Feature Plan Workflow

1. Create `plans/<feature-name>/` with three documents:
   - `IMPLEMENTATION_PLAN.md`
   - `TEST_PLAN.md`
   - `DIAGRAMS.md`
2. Update `plans/.active-feature` to the new feature name
3. Present the plans to the user and wait for approval
4. Only begin implementation after explicit approval
5. If you revise a plan document, the `.approved` marker is cleared and re-approval is required

## Test Convention

- Every `.ts` / `.tsx` file under `src/` (except skipped files) requires a co-located test file
- Write the test file **before** the implementation file
- Test file naming: `ComponentName.test.tsx` alongside `ComponentName.tsx`
- Skipped files (no test required): `*.config.ts`, `*.d.ts`, `index.ts`, `index.tsx`, `*.types.ts`, `main.tsx`, `App.tsx`, and files under `src/types/`, `src/assets/`, `src/styles/`, `src/mocks/`, `src/test/`

## Commands

| Command | What it does |
|---------|-------------|
| `npm start` | Start Vite dev server (default port 5173) |
| `npm test` | Run all tests once with Vitest |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run build` | Type-check and build for production |
| `npm run lint` | Run ESLint |

> **CORS note:** The backend allows requests from `localhost:5173`. Do not change the dev server port without updating the backend's `WebConfig`.
> **Pre-commit:** Always run `npm test`, `npm run lint`, and `npm run build` before committing. Do not commit if any fail.

## Key References

- **Architecture, layers, naming, SCSS, routing, git model:** `_dev/ARCHITECTURE.md`
- **Component and hook registry:** `_dev/COMPONENTS.md`
- **Testing policy, stack, naming conventions:** `_dev/TESTING_POLICY.md`
- **Backend endpoint reference:** `backend-reference/ENDPOINTS.md`
- **Database schema reference:** `backend-reference/SCHEMA.md`

## Naming Conventions

| Type | Convention | Example |
|---|---|---|
| Interface | `i` prefix, PascalCase | `iButtonProps`, `iUser` |
| Type alias | `t` prefix, PascalCase | `tVariant`, `tRelinkErrorType` |
| Component | PascalCase, default export | `Button.tsx` |
| Context | PascalCase + `Context` suffix, named export | `AuthContext.tsx` |
| Hook | camelCase + `use` prefix, named export | `useBalance.ts` |
| Service | camelCase | `plaidService.ts` |
| Utility | camelCase | `formatCurrency.ts` |
| SCSS | camelCase, matching component | `button.scss` |

## TypeScript Rules

- Interfaces use the `i` prefix; type aliases use the `t` prefix
- All shared types live in `src/types/types.ts`; local-only types go at the top of the file
- Use `import type` for type-only imports
- Every interface property with a default value must have a `/** @default <value> */` JSDoc comment
- Strict mode is on — do not disable checks

## Component Rules

- Functional components only
- Props typed with an `i`-prefixed interface, destructured in the signature
- Default exports for components; named exports for contexts and hooks
- Semantic HTML and ARIA roles are mandatory

## Context Rules

- **Do not create a context without asking first**
- Context values must be memoized with `useMemo`
- Every context hook must throw a descriptive error when used outside its provider

## SCSS Rules

- All SCSS imported through `src/styles/index.scss` — never import component SCSS directly in TS
- Use CSS custom properties (`var(--name)`) — no hardcoded color values
- BEM naming: `.block`, `.block__element`, `.block--modifier`
- Maximum 2 levels of nesting

## Git Branching

```
main → develop → feature/my-feature
```
- Never commit directly to `main` or `develop`
- Branch off `develop`; PR back into `develop`
- Run `npm test`, `npm run lint`, `npm run build` before every commit

## Best Practices Guardrail

If a request violates best practices for React, TypeScript, SCSS, WCAG, or PrimeReact:
1. State exactly what rule it violates and cite the standard/version
2. Suggest the recommended alternative
3. Ask whether to proceed or use the alternative

Never silently comply with a best-practice violation.

## General Coding Principles

- Don't add features or abstractions beyond what was asked
- Don't add comments unless the logic is non-obvious
- Don't add error handling for scenarios that can't happen
- Don't design for hypothetical future requirements
- Surface unexpected edge cases with `if (import.meta.env.DEV) console.warn(...)` in development

## Edge Case Handling

- Prefer non-destructive behavior — don't remove or overwrite data unless explicitly required
- Log warnings in development with `if (import.meta.env.DEV) console.warn(...)` — silent in production
