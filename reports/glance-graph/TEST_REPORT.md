# Test Report — glance-graph

## Summary

| Check | Result |
|-------|--------|
| Tests | PASS |
| Line Coverage | 83.7% (PASS) |
| Branch Coverage | 80.9% (PASS) |

## Coverage Results

- **Line coverage:** 83.7% (threshold: 80%)
- **Branch coverage:** 80.9% (threshold: 80%)

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
t changed 1ms
 ✓ src/api/client.test.ts > apiClient > should_haveWithCredentials_setToTrue 1ms
 ✓ src/api/client.test.ts > apiClient > should_useViteApiBaseUrl_asBaseURL 0ms
 ✓ src/services/authService.test.ts > fetchMe > should_resolveWithUser_on200 41ms
 ✓ src/services/authService.test.ts > fetchMe > should_throw_on401 3ms
 ✓ src/services/authService.test.ts > fetchMe > should_throw_on500 2ms
 ✓ src/services/monthlyGlanceService.test.ts > fetchMonthlyGlance > calls /api/monthly-glance and returns dailyTotals 46ms
 ✓ src/services/monthlyGlanceService.test.ts > fetchMonthlyGlance > returns relinkRequired array 4ms
 ✓ src/services/monthlyGlanceService.test.ts > fetchMonthlyGlance > throws on 500 3ms

 Test Files  19 passed (19)
      Tests  167 passed (167)
   Start at  13:57:05
   Duration  7.56s (transform 1.24s, setup 6.04s, import 4.63s, tests 12.00s, environment 21.74s)

 % Coverage report from v8
-------------------|---------|----------|---------|---------|-------------------
File               | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s 
-------------------|---------|----------|---------|---------|-------------------
All files          |   83.14 |    80.91 |   88.88 |   83.66 |                   
 ...nts/AuthButton |    90.9 |      100 |      80 |      90 |                   
  AuthButton.tsx   |    90.9 |      100 |      80 |      90 | 14                
 components/Layout |   83.33 |    84.61 |    62.5 |   82.35 |                   
  Layout.tsx       |   83.33 |    84.61 |    62.5 |   82.35 | 24-28             
 .../MonthlyGlance |   33.89 |    48.57 |   61.53 |   35.08 |                   
  ...hlyGlance.tsx |   33.89 |    48.57 |   61.53 |   35.08 | 27-74,122-128     
 contexts          |     100 |       96 |     100 |     100 |                   
  ThemeContext.tsx |     100 |    93.75 |     100 |     100 | 56                
 hooks             |   96.66 |    81.81 |     100 |     100 |                   
  ...inkAccount.ts |     100 |    83.33 |     100 |     100 | 20-21             
  ...thlyGlance.ts |    93.1 |       80 |     100 |     100 | 36-41             
-------------------|---------|----------|---------|---------|-------------------

=============================== Coverage summary ===============================
Statements   : 83.14% ( 222/267 )
Branches     : 80.91% ( 106/131 )
Functions    : 88.88% ( 72/81 )
Lines        : 83.66% ( 210/251 )
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