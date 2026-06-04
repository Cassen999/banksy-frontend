# Test Report — homepage

## Summary

| Check | Result |
|-------|--------|
| Tests | PASS |
| Line Coverage | 100.0% (PASS) |
| Branch Coverage | 95.5% (PASS) |

## Coverage Results

- **Line coverage:** 100.0% (threshold: 80%)
- **Branch coverage:** 95.5% (threshold: 80%)

### Excluded Files
_Per hook exclusion list — excluded from threshold:_
_None_

### Files Below Threshold
- `src/components/Homepage/HomepagePage.tsx — line: 100.0%, branch: 75.0%`

## Test Results

- **Status:** PASS
- **Failures:** 0

### Vitest Output

```
idebar state > should_closeSidebar_whenOverlayIsClicked 89ms
 ✓ src/services/authService.test.ts > fetchMe > should_resolveWithUser_on200 37ms
 ✓ src/services/authService.test.ts > fetchMe > should_throw_on401 4ms
 ✓ src/services/authService.test.ts > fetchMe > should_throw_on500 2ms
 ✓ src/components/AppHeader/AppHeader.test.tsx > AppHeader > desktop — welcome message > should_showWelcomeMessage_whenUserIsLoggedIn 28ms
 ✓ src/components/AppHeader/AppHeader.test.tsx > AppHeader > desktop — welcome message > should_notShowWelcomeMessage_whenUserIsNull 48ms
 ✓ src/components/AppHeader/AppHeader.test.tsx > AppHeader > desktop — menubar > should_renderMenubarComponent 36ms
 ✓ src/components/AppHeader/AppHeader.test.tsx > AppHeader > desktop — menubar > should_renderMultipleLogoLinksIncludingMenubarStart 61ms
 ✓ src/utils/auth.test.ts > handleUnauthorized > should_redirectToOAuthEndpoint_whenCalled 8ms
 ✓ src/utils/auth.test.ts > handleUnauthorized > should_callRegisteredClearUser_beforeRedirecting 1ms
 ✓ src/utils/auth.test.ts > handleUnauthorized > should_notThrow_whenNoClearUserIsRegistered 1ms
 ✓ src/utils/auth.test.ts > registerClearUser > should_storeFunction_thatIsCalledByHandleUnauthorized 0ms
 ✓ src/utils/auth.test.ts > registerClearUser > should_replaceExistingRegistration_whenCalledAgain 0ms
 ✓ src/components/Layout/Layout.test.tsx > Layout > sidebar state > should_closeSidebar_whenXButtonIsClicked 109ms
 ✓ src/components/Layout/Layout.test.tsx > Layout > sidebar state > should_notShowOverlay_whenSidebarIsClosed 32ms
 ✓ src/components/Layout/Layout.test.tsx > Layout > body scroll lock > should_lockBodyScroll_whenSidebarOpens 58ms
 ✓ src/components/Layout/Layout.test.tsx > Layout > body scroll lock > should_restoreBodyScroll_whenSidebarCloses 61ms

 Test Files  9 passed (9)
      Tests  78 passed (78)
   Start at  16:17:52
   Duration  4.01s (transform 1.22s, setup 3.01s, import 3.10s, tests 4.47s, environment 11.11s)

 % Coverage report from v8
-------------------|---------|----------|---------|---------|-------------------
File               | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s 
-------------------|---------|----------|---------|---------|-------------------
All files          |   98.96 |    95.45 |     100 |     100 |                   
 ...nents/Homepage |   88.88 |       75 |     100 |     100 |                   
  HomepagePage.tsx |   88.88 |       75 |     100 |     100 | 14                
 contexts          |     100 |    94.44 |     100 |     100 |                   
  ThemeContext.tsx |     100 |    93.75 |     100 |     100 | 56                
-------------------|---------|----------|---------|---------|-------------------

=============================== Coverage summary ===============================
Statements   : 98.96% ( 96/97 )
Branches     : 95.45% ( 42/44 )
Functions    : 100% ( 38/38 )
Lines        : 100% ( 89/89 )
================================================================================
```

## Observations

_Add any observations about test quality, gaps, or edge cases here._