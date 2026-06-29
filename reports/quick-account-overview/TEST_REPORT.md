# Test Report — quick-account-overview

## Summary

| Check | Result |
|-------|--------|
| Tests | PASS |
| Line Coverage | 89.5% (PASS) |
| Branch Coverage | 85.3% (PASS) |

## Coverage Results

- **Line coverage:** 89.5% (threshold: 80%)
- **Branch coverage:** 85.3% (threshold: 80%)

### Excluded Files
_Per hook exclusion list — excluded from threshold:_
_None_

### Files Below Threshold
- `src/components/CustomAccountNameButton/CustomAccountNameButton.tsx — line: 100.0%, branch: 75.0%`
- `src/components/MonthlyGlance/MonthlyGlance.tsx — line: 33.9%, branch: 48.6%`

## Test Results

- **Status:** PASS
- **Failures:** 0

### Vitest Output

```
nsform 1.23s, setup 6.38s, import 4.35s, tests 12.77s, environment 20.70s)

 % Coverage report from v8
-------------------|---------|----------|---------|---------|-------------------
File               | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s 
-------------------|---------|----------|---------|---------|-------------------
All files          |   87.95 |    85.28 |   93.33 |   89.55 |                   
 ...nts/AuthButton |    90.9 |      100 |      80 |      90 |                   
  AuthButton.tsx   |    90.9 |      100 |      80 |      90 | 14                
 ...ountNameButton |     100 |       75 |     100 |     100 |                   
  ...ameButton.tsx |     100 |       75 |     100 |     100 | 31                
 ...countNameModal |   96.29 |       90 |     100 |     100 |                   
  ...NameModal.tsx |   96.29 |       90 |     100 |     100 | 32                
 components/Layout |   85.71 |    90.47 |    62.5 |      85 |                   
  Layout.tsx       |   85.71 |    90.47 |    62.5 |      85 | 32-36             
 .../MonthlyGlance |   32.75 |    48.57 |   61.53 |   33.92 |                   
  ...hlyGlance.tsx |   32.75 |    48.57 |   61.53 |   33.92 | 28-75,123-129     
 ...ccountOverview |   94.11 |    89.36 |     100 |   96.77 |                   
  ...tOverview.tsx |   94.11 |    89.36 |     100 |   96.77 | 53                
 ...eduledDeposits |     100 |     93.1 |     100 |     100 |                   
  ...dDeposits.tsx |     100 |     93.1 |     100 |     100 | 43-44             
 contexts          |     100 |       96 |     100 |     100 |                   
  ThemeContext.tsx |     100 |    93.75 |     100 |     100 | 56                
 hooks             |   95.13 |    82.69 |     100 |     100 |                   
  ...inkAccount.ts |     100 |    83.33 |     100 |     100 | 20-21             
  ...thlyGlance.ts |    93.1 |       80 |     100 |     100 | 36-41             
  ...ntOverview.ts |   94.82 |       85 |     100 |     100 | 44,64-69          
  ...edDeposits.ts |    92.3 |       80 |     100 |     100 | 28-33             
-------------------|---------|----------|---------|---------|-------------------

=============================== Coverage summary ===============================
Statements   : 87.95% ( 387/440 )
Branches     : 85.28% ( 226/265 )
Functions    : 93.33% ( 126/135 )
Lines        : 89.55% ( 360/402 )
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