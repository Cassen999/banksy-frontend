# Test Report — mobile-theme-foundation

## Summary

| Check | Result |
|-------|--------|
| Tests | PASS |
| Line Coverage | 99.3% (PASS) |
| Branch Coverage | 93.2% (PASS) |

## Coverage Results

- **Line coverage:** 99.3% (threshold: 80%)
- **Branch coverage:** 93.2% (threshold: 80%)

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
st.ts > useLinkAccount > onExit with no error sets isLoading to false and shows no toast 5ms
 ✓ src/hooks/useLinkAccount.test.ts > useLinkAccount > onExit with error sets isLoading to false 4ms
 ✓ src/hooks/useLinkAccount.test.ts > useLinkAccount > fetchLinkToken 500 sets isLoading to false 3ms
 ✓ src/hooks/useLinkAccount.test.ts > useLinkAccount > fetchLinkToken 500 does not call open() 5ms
 ✓ src/hooks/useLinkAccount.test.ts > useLinkAccount > shows info toast and does not set isLoading when user is not logged in 1ms
 ✓ src/services/plaidService.test.ts > fetchLinkToken > returns link_token on 200 33ms
 ✓ src/services/plaidService.test.ts > fetchLinkToken > throws on 500 4ms
 ✓ src/services/plaidService.test.ts > exchangePublicToken > returns status and message on 200 3ms
 ✓ src/services/plaidService.test.ts > exchangePublicToken > sends correct request body 2ms
 ✓ src/services/plaidService.test.ts > exchangePublicToken > throws on 500 2ms
 ✓ src/api/client.test.ts > apiClient > should_haveWithCredentials_setToTrue 1ms
 ✓ src/api/client.test.ts > apiClient > should_useViteApiBaseUrl_asBaseURL 0ms

 Test Files  13 passed (13)
      Tests  118 passed (118)
   Start at  14:08:35
   Duration  4.95s (transform 814ms, setup 3.73s, import 3.72s, tests 7.03s, environment 12.60s)

 % Coverage report from v8
-------------------|---------|----------|---------|---------|-------------------
File               | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s 
-------------------|---------|----------|---------|---------|-------------------
All files          |   99.34 |    93.24 |   98.03 |   99.31 |                   
 components/Layout |   88.88 |       60 |      80 |    87.5 |                   
  Layout.tsx       |   88.88 |       60 |      80 |    87.5 | 22                
 contexts          |     100 |       96 |     100 |     100 |                   
  ThemeContext.tsx |     100 |    93.75 |     100 |     100 | 56                
 hooks             |     100 |    83.33 |     100 |     100 |                   
  ...inkAccount.ts |     100 |    83.33 |     100 |     100 | 20-21             
-------------------|---------|----------|---------|---------|-------------------

=============================== Coverage summary ===============================
Statements   : 99.34% ( 152/153 )
Branches     : 93.24% ( 69/74 )
Functions    : 98.03% ( 50/51 )
Lines        : 99.31% ( 145/146 )
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