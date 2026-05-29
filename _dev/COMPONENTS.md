# Banksy Frontend — Component Registry

**Always check this file before creating any new component, hook, service, or utility.**
If the item you need already exists, extend it rather than creating a duplicate.

Update this file whenever a new entry is added or removed.

---

## Infrastructure (non-feature)

| Name | File | Type | Description |
|------|------|------|-------------|
| `apiClient` | `src/api/client.ts` | API client | Axios instance with `withCredentials`, `baseURL`, and centralized 401 interceptor. Configures `axios-hooks`. |
| `handleUnauthorized` | `src/utils/auth.ts` | Utility | Redirects user to OAuth login URL on 401. Clear auth context state here when AuthContext is built. |
| `server` | `src/mocks/server.ts` | Test infra | MSW server instance for tests. Uses `defaultHandlers`. |
| `handlers` | `src/mocks/handlers.ts` | Test infra | All MSW handlers grouped by domain: `auth`, `balance`, `transactions`, `plaid`. Each has `success` and `error` variants. |

---

## Components

_None yet. Add entries here as components are implemented._

| Name | File | Type | Props interface | Description |
|------|------|------|-----------------|-------------|

---

## Pages / Views

_None yet. Add entries here as pages are implemented._

| Name | File | Route | Description |
|------|------|-------|-------------|

---

## Hooks

_None yet. Add entries here as hooks are implemented._

| Name | File | Returns | Description |
|------|------|---------|-------------|

---

## Services

_None yet. Add entries here as service functions are implemented._

| Name | File | Method | Endpoint | Description |
|------|------|--------|----------|-------------|

---

## Contexts

_None yet. Do not add a context without approval — see Context Policy in `_dev/ARCHITECTURE.md`._

| Name | File | State it holds | Description |
|------|------|----------------|-------------|

---

## Utilities (`src/utils/`)

| Name | File | Description |
|------|------|-------------|
| `handleUnauthorized` | `src/utils/auth.ts` | Redirect to OAuth on 401 (see Infrastructure above) |
