# Test Report — scheduled-deposits

## Summary

| Check | Result |
|-------|--------|
| Tests | PASS |
| Line Coverage | 85.8% (PASS) |
| Branch Coverage | 83.5% (PASS) |

## Coverage Results

- **Line coverage:** 85.8% (threshold: 80%)
- **Branch coverage:** 83.5% (threshold: 80%)

### Excluded Files
_Per hook exclusion list — excluded from threshold:_
_None_

### Files Below Threshold
- `src/components/MonthlyGlance/MonthlyGlance.tsx — line: 35.1%, branch: 48.6%`

## Test Results

- **Status:** PASS
- **Failures:** 0

### Vitest Output

```
 1ms
 ✓ src/contexts/contextTests/NotificationContext.test.tsx > NotificationContext — independence > hideBanner does not affect toast state 1ms
 ✓ src/contexts/contextTests/NotificationContext.test.tsx > NotificationContext — memoization > context value reference is stable when state has not changed 1ms
 ✓ src/api/client.test.ts > apiClient > should_haveWithCredentials_setToTrue 1ms
 ✓ src/api/client.test.ts > apiClient > should_useViteApiBaseUrl_asBaseURL 0ms

 Test Files  22 passed (22)
      Tests  204 passed (204)
   Start at  11:17:53
   Duration  5.50s (transform 822ms, setup 4.30s, import 3.31s, tests 7.89s, environment 14.49s)

 % Coverage report from v8
-------------------|---------|----------|---------|---------|-------------------
File               | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s 
-------------------|---------|----------|---------|---------|-------------------
All files          |   84.93 |    83.52 |   90.62 |   85.81 |                   
 ...nts/AuthButton |    90.9 |      100 |      80 |      90 |                   
  AuthButton.tsx   |    90.9 |      100 |      80 |      90 | 14                
 components/Layout |   85.71 |    86.66 |    62.5 |      85 |                   
  Layout.tsx       |   85.71 |    86.66 |    62.5 |      85 | 32-36             
 .../MonthlyGlance |   33.89 |    48.57 |   61.53 |   35.08 |                   
  ...hlyGlance.tsx |   33.89 |    48.57 |   61.53 |   35.08 | 27-74,122-128     
 ...eduledDeposits |     100 |     93.1 |     100 |     100 |                   
  ...dDeposits.tsx |     100 |     93.1 |     100 |     100 | 42-43             
 contexts          |     100 |       96 |     100 |     100 |                   
  ThemeContext.tsx |     100 |    93.75 |     100 |     100 | 56                
 hooks             |   95.34 |    81.25 |     100 |     100 |                   
  ...inkAccount.ts |     100 |    83.33 |     100 |     100 | 20-21             
  ...thlyGlance.ts |    93.1 |       80 |     100 |     100 | 36-41             
  ...edDeposits.ts |    92.3 |       80 |     100 |     100 | 28-33             
-------------------|---------|----------|---------|---------|-------------------

=============================== Coverage summary ===============================
Statements   : 84.93% ( 265/312 )
Branches     : 83.52% ( 147/176 )
Functions    : 90.62% ( 87/96 )
Lines        : 85.81% ( 248/289 )
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