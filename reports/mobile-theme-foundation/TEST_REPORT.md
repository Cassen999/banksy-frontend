# Test Report — mobile-theme-foundation

## Summary

| Check | Result |
|-------|--------|
| Tests | PASS |
| Line Coverage | 100.0% (PASS) |
| Branch Coverage | 94.4% (PASS) |

## Coverage Results

- **Line coverage:** 100.0% (threshold: 80%)
- **Branch coverage:** 94.4% (threshold: 80%)

### Excluded Files
_Per hook exclusion list — excluded from threshold:_
_None_

### Files Below Threshold
_None_

## Test Results

- **Status:** PASS
- **Failures:** 0

### Vitest Output

```
RUN  v4.1.7 /Users/hannahgerber/code/banksy-frontend
      Coverage enabled with v8

 ✓ src/utils/auth.test.ts > handleUnauthorized > should_redirectToOAuthEndpoint_whenCalled 6ms
 ✓ src/api/client.test.ts > apiClient > should_callHandleUnauthorized_when401ResponseReceived 104ms
 ✓ src/api/client.test.ts > apiClient > should_notCallHandleUnauthorized_when200ResponseReceived 3ms
 ✓ src/api/client.test.ts > apiClient > should_notCallHandleUnauthorized_whenNetworkErrorHasNoResponse 1ms
 ✓ src/contexts/contextTests/ThemeContext.test.tsx > ThemeContext > defaults to light when system prefers light and no stored preference 22ms
 ✓ src/contexts/contextTests/ThemeContext.test.tsx > ThemeContext > defaults to dark when system prefers dark and no stored preference 2ms
 ✓ src/contexts/contextTests/ThemeContext.test.tsx > ThemeContext > uses stored "light" preference even when system prefers dark 1ms
 ✓ src/contexts/contextTests/ThemeContext.test.tsx > ThemeContext > uses stored "dark" preference even when system prefers light 1ms
 ✓ src/contexts/contextTests/ThemeContext.test.tsx > ThemeContext > toggles from light to dark 72ms
 ✓ src/contexts/contextTests/ThemeContext.test.tsx > ThemeContext > toggles from dark to light 11ms
 ✓ src/contexts/contextTests/ThemeContext.test.tsx > ThemeContext > persists new theme to localStorage on toggle 10ms
 ✓ src/contexts/contextTests/ThemeContext.test.tsx > ThemeContext > sets data-theme attribute on document root when theme changes 11ms
 ✓ src/contexts/contextTests/ThemeContext.test.tsx > ThemeContext > updates to dark when system switches to dark and no user override exists 2ms
 ✓ src/contexts/contextTests/ThemeContext.test.tsx > ThemeContext > ignores system preference change when user has a stored override 1ms
 ✓ src/contexts/contextTests/ThemeContext.test.tsx > ThemeContext > throws a descriptive error when useTheme is used outside ThemeProvider 3ms

 Test Files  3 passed (3)
      Tests  15 passed (15)
   Start at  16:34:14
   Duration  1.43s (transform 184ms, setup 680ms, import 190ms, tests 260ms, environment 2.22s)

 % Coverage report from v8
-------------------|---------|----------|---------|---------|-------------------
File               | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s 
-------------------|---------|----------|---------|---------|-------------------
All files          |     100 |    94.44 |     100 |     100 |                   
 contexts          |     100 |    93.75 |     100 |     100 |                   
  ThemeContext.tsx |     100 |    93.75 |     100 |     100 | 56                
-------------------|---------|----------|---------|---------|-------------------

=============================== Coverage summary ===============================
Statements   : 100% ( 46/46 )
Branches     : 94.44% ( 17/18 )
Functions    : 100% ( 14/14 )
Lines        : 100% ( 43/43 )
================================================================================
```

## Observations

_Add any observations about test quality, gaps, or edge cases here._