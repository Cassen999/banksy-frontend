# Test Report — example-feature

## Summary

| Check | Result |
|-------|--------|
| Tests | PASS |
| Line Coverage | 100.0% (PASS) |
| Branch Coverage | 100.0% (PASS) |

## Coverage Results

- **Line coverage:** 100.0% (threshold: 80%)
- **Branch coverage:** 100.0% (threshold: 80%)

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

 ✓ src/utils/auth.test.ts > handleUnauthorized > should_redirectToOAuthEndpoint_whenCalled 5ms
 ✓ src/api/client.test.ts > apiClient > should_callHandleUnauthorized_when401ResponseReceived 95ms
 ✓ src/api/client.test.ts > apiClient > should_notCallHandleUnauthorized_when200ResponseReceived 4ms
 ✓ src/api/client.test.ts > apiClient > should_notCallHandleUnauthorized_whenNetworkErrorHasNoResponse 2ms

 Test Files  2 passed (2)
      Tests  4 passed (4)
   Start at  15:37:07
   Duration  872ms (transform 97ms, setup 367ms, import 35ms, tests 111ms, environment 805ms)

 % Coverage report from v8
------------|---------|----------|---------|---------|-------------------
File        | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s 
------------|---------|----------|---------|---------|-------------------
------------|---------|----------|---------|---------|-------------------

=============================== Coverage summary ===============================
Statements   : 100% ( 8/8 )
Branches     : 100% ( 2/2 )
Functions    : 100% ( 3/3 )
Lines        : 100% ( 8/8 )
================================================================================
```

## Observations

_Add any observations about test quality, gaps, or edge cases here._