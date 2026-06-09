# Test Report — link-bank-account

## Summary

| Check | Result |
|-------|--------|
| Tests | PASS |
| Line Coverage | 99.3% (PASS) |
| Branch Coverage | 92.6% (PASS) |

## Coverage Results

- **Line coverage:** 99.3% (threshold: 80%)
- **Branch coverage:** 92.6% (threshold: 80%)

### Excluded Files
_Per hook exclusion list — excluded from threshold:_
_None_

### Files Below Threshold
- `src/components/Layout/Layout.tsx — line: 87.5%, branch: 60.0%`

## Test Results

- **Status:** PASS
- **Failures:** 0

### Vitest Output

```
onSuccess with exchange 500 sets isLoading to false 12ms
 ✓ src/hooks/useLinkAccount.test.ts > useLinkAccount > onExit with no error sets isLoading to false and shows no toast 4ms
 ✓ src/hooks/useLinkAccount.test.ts > useLinkAccount > onExit with error sets isLoading to false 3ms
 ✓ src/hooks/useLinkAccount.test.ts > useLinkAccount > fetchLinkToken 500 sets isLoading to false 2ms
 ✓ src/hooks/useLinkAccount.test.ts > useLinkAccount > fetchLinkToken 500 does not call open() 3ms
 ✓ src/hooks/useLinkAccount.test.ts > useLinkAccount > shows info toast and does not set isLoading when user is not logged in 3ms
 ✓ src/components/Layout/Layout.test.tsx > Layout > body scroll lock > should_restoreBodyScroll_whenSidebarCloses 146ms
 ✓ src/services/authService.test.ts > fetchMe > should_resolveWithUser_on200 29ms
 ✓ src/services/authService.test.ts > fetchMe > should_throw_on401 4ms
 ✓ src/services/authService.test.ts > fetchMe > should_throw_on500 2ms
 ✓ src/api/client.test.ts > apiClient > should_haveWithCredentials_setToTrue 1ms
 ✓ src/api/client.test.ts > apiClient > should_useViteApiBaseUrl_asBaseURL 0ms

 Test Files  13 passed (13)
      Tests  114 passed (114)
   Start at  11:42:00
   Duration  5.05s (transform 866ms, setup 3.88s, import 3.33s, tests 7.70s, environment 13.05s)

 % Coverage report from v8
-------------------|---------|----------|---------|---------|-------------------
File               | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s 
-------------------|---------|----------|---------|---------|-------------------
All files          |   99.32 |    92.64 |   98.03 |   99.29 |                   
 components/Layout |   88.88 |       60 |      80 |    87.5 |                   
  Layout.tsx       |   88.88 |       60 |      80 |    87.5 | 22                
 contexts          |     100 |       96 |     100 |     100 |                   
  ThemeContext.tsx |     100 |    93.75 |     100 |     100 | 56                
 hooks             |     100 |    83.33 |     100 |     100 |                   
  ...inkAccount.ts |     100 |    83.33 |     100 |     100 | 20-21             
-------------------|---------|----------|---------|---------|-------------------

=============================== Coverage summary ===============================
Statements   : 99.32% ( 147/148 )
Branches     : 92.64% ( 63/68 )
Functions    : 98.03% ( 50/51 )
Lines        : 99.29% ( 140/141 )
================================================================================

stderr | src/hooks/useLinkAccount.test.ts > useLinkAccount > sets isLoading to true when initiateLinkFlow is called
An update to TestComponent inside a test was not wrapped in act(...).

When testing, code that causes React state updates should be wrapped into act(...):

act(() => {
  /* fire events that update state */
});
/* assert on the output */

This ensures that you're testing the behavior the user would see in the browser. Learn more at https://react.dev/link/wrap-tests-with-act
```

## Observations

_Add any observations about test quality, gaps, or edge cases here._