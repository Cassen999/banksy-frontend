# Fix Plan — example-feature

## Root Cause

- Line coverage 36.4% < 80%
- Branch coverage 50.0% < 80%

## Step-by-Step Fix

1. <!-- describe step 1 -->
2. <!-- describe step 2 -->
3. <!-- describe step 3 -->

## Fix Applied

_Blank until filled in._

## Relevant Test Output

```
RUN  v4.1.7 /Users/hannahgerber/code/banksy-frontend
      Coverage enabled with v8

 ✓ src/utils/auth.test.ts > handleUnauthorized > should_redirectToOAuthEndpoint_whenCalled 7ms
 ✓ src/api/client.test.ts > apiClient > should_callHandleUnauthorized_when401ResponseReceived 107ms
 ✓ src/api/client.test.ts > apiClient > should_notCallHandleUnauthorized_when200ResponseReceived 6ms

 Test Files  2 passed (2)
      Tests  3 passed (3)
   Start at  15:03:14
   Duration  1.37s (transform 214ms, setup 633ms, import 51ms, tests 128ms, environment 1.40s)

 % Coverage report from v8
--------------|---------|----------|---------|---------|------------------------
File          | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s      
--------------|---------|----------|---------|---------|------------------------
All files     |   36.36 |       50 |    7.89 |   36.36 |                        
 api          |     100 |       50 |     100 |     100 |                        
  client.ts   |     100 |       50 |     100 |     100 | 13                     
 mocks        |   25.53 |      100 |       0 |   25.53 |                        
  handlers.ts |   23.91 |      100 |       0 |   23.91 | ...64-73,81-93,102-179 
--------------|---------|----------|---------|---------|------------------------

=============================== Coverage summary ===============================
Statements   : 36.36% ( 20/55 )
Branches     : 50% ( 1/2 )
Functions    : 7.89% ( 3/38 )
Lines        : 36.36% ( 20/55 )
================================================================================
```