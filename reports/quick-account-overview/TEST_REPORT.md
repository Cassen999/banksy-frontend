# Test Report — quick-account-overview

## Summary

| Check | Result |
|-------|--------|
| Tests | PASS |
| Line Coverage | 89.5% (PASS) |
| Branch Coverage | 84.6% (PASS) |

## Coverage Results

- **Line coverage:** 89.5% (threshold: 80%)
- **Branch coverage:** 84.6% (threshold: 80%)

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
st.ts > apiClient > should_useViteApiBaseUrl_asBaseURL 0ms

 Test Files  28 passed (28)
      Tests  275 passed (275)
   Start at  16:43:26
   Duration  8.93s (transform 1.26s, setup 6.66s, import 5.84s, tests 15.69s, environment 23.19s)

 % Coverage report from v8
-------------------|---------|----------|---------|---------|-------------------
File               | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s 
-------------------|---------|----------|---------|---------|-------------------
All files          |   87.89 |    84.58 |   93.28 |    89.5 |                   
 ...nts/AuthButton |    90.9 |      100 |      80 |      90 |                   
  AuthButton.tsx   |    90.9 |      100 |      80 |      90 | 14                
 ...countNameModal |   96.29 |       90 |     100 |     100 |                   
  ...NameModal.tsx |   96.29 |       90 |     100 |     100 | 32                
 components/Layout |   85.71 |    86.66 |    62.5 |      85 |                   
  Layout.tsx       |   85.71 |    86.66 |    62.5 |      85 | 32-36             
 .../MonthlyGlance |   33.89 |    48.57 |   61.53 |   35.08 |                   
  ...hlyGlance.tsx |   33.89 |    48.57 |   61.53 |   35.08 | 27-74,122-128     
 ...ccountOverview |   93.54 |    86.04 |     100 |   96.42 |                   
  ...tOverview.tsx |   93.54 |    86.04 |     100 |   96.42 | 50                
 ...eduledDeposits |     100 |     93.1 |     100 |     100 |                   
  ...dDeposits.tsx |     100 |     93.1 |     100 |     100 | 42-43             
 contexts          |     100 |       96 |     100 |     100 |                   
  ThemeContext.tsx |     100 |    93.75 |     100 |     100 | 56                
 hooks             |   95.13 |    82.69 |     100 |     100 |                   
  ...inkAccount.ts |     100 |    83.33 |     100 |     100 | 20-21             
  ...thlyGlance.ts |    93.1 |       80 |     100 |     100 | 36-41             
  ...ntOverview.ts |   94.82 |       85 |     100 |     100 | 44,64-69          
  ...edDeposits.ts |    92.3 |       80 |     100 |     100 | 28-33             
-------------------|---------|----------|---------|---------|-------------------

=============================== Coverage summary ===============================
Statements   : 87.89% ( 385/438 )
Branches     : 84.58% ( 214/253 )
Functions    : 93.28% ( 125/134 )
Lines        : 89.5% ( 358/400 )
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