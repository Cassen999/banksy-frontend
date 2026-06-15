# Test Report — dashboard

## Summary

| Check | Result |
|-------|--------|
| Tests | PASS |
| Line Coverage | 97.6% (PASS) |
| Branch Coverage | 94.2% (PASS) |

## Coverage Results

- **Line coverage:** 97.6% (threshold: 80%)
- **Branch coverage:** 94.2% (threshold: 80%)

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
cationContext — toast > calls toastRef.current.show() with config including life 2ms
 ✓ src/contexts/contextTests/NotificationContext.test.tsx > NotificationContext — toast > hideToast resets showToast and toastConfig 1ms
 ✓ src/contexts/contextTests/NotificationContext.test.tsx > NotificationContext — banner > triggerBanner sets showBanner to true and stores config 1ms
 ✓ src/contexts/contextTests/NotificationContext.test.tsx > NotificationContext — banner > hideBanner resets showBanner and bannerConfig 1ms
 ✓ src/contexts/contextTests/NotificationContext.test.tsx > NotificationContext — independence > hideToast does not affect banner state 1ms
 ✓ src/contexts/contextTests/NotificationContext.test.tsx > NotificationContext — independence > hideBanner does not affect toast state 1ms
 ✓ src/contexts/contextTests/NotificationContext.test.tsx > NotificationContext — memoization > context value reference is stable when state has not changed 1ms

 Test Files  16 passed (16)
      Tests  139 passed (139)
   Start at  11:43:10
   Duration  5.76s (transform 816ms, setup 4.84s, import 3.77s, tests 7.83s, environment 15.59s)

 % Coverage report from v8
-------------------|---------|----------|---------|---------|-------------------
File               | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s 
-------------------|---------|----------|---------|---------|-------------------
All files          |   97.74 |    94.18 |    93.1 |   97.61 |                   
 ...nts/AuthButton |    90.9 |      100 |      80 |      90 |                   
  AuthButton.tsx   |    90.9 |      100 |      80 |      90 | 14                
 components/Layout |   83.33 |    84.61 |    62.5 |   82.35 |                   
  Layout.tsx       |   83.33 |    84.61 |    62.5 |   82.35 | 24-28             
 contexts          |     100 |       96 |     100 |     100 |                   
  ThemeContext.tsx |     100 |    93.75 |     100 |     100 | 56                
 hooks             |     100 |    83.33 |     100 |     100 |                   
  ...inkAccount.ts |     100 |    83.33 |     100 |     100 | 20-21             
-------------------|---------|----------|---------|---------|-------------------

=============================== Coverage summary ===============================
Statements   : 97.74% ( 173/177 )
Branches     : 94.18% ( 81/86 )
Functions    : 93.1% ( 54/58 )
Lines        : 97.61% ( 164/168 )
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