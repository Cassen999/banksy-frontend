# Test Report — header-nav-centering

## Summary

| Check | Result |
|-------|--------|
| Tests | PASS |
| Line Coverage | 100.0% (PASS) |
| Branch Coverage | 97.6% (PASS) |

## Coverage Results

- **Line coverage:** 100.0% (threshold: 80%)
- **Branch coverage:** 97.6% (threshold: 80%)

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
er/AppHeader.test.tsx > AppHeader > auth button — logged in > should_navigateToLogoutUrl_whenLogoutClicked 51ms
 ✓ src/components/Layout/Layout.test.tsx > Layout > sidebar state > should_closeSidebar_whenOverlayIsClicked 95ms
 ✓ src/components/AppHeader/AppHeader.test.tsx > AppHeader > desktop — welcome message > should_showWelcomeMessage_whenUserIsLoggedIn 26ms
 ✓ src/components/AppHeader/AppHeader.test.tsx > AppHeader > desktop — welcome message > should_notShowWelcomeMessage_whenUserIsNull 21ms
 ✓ src/components/AppHeader/AppHeader.test.tsx > AppHeader > desktop — menubar > should_renderMenubarComponent 27ms
 ✓ src/components/AppHeader/AppHeader.test.tsx > AppHeader > desktop — menubar > should_renderMultipleLogoLinksIncludingMenubarStart 43ms
 ✓ src/services/authService.test.ts > fetchMe > should_resolveWithUser_on200 23ms
 ✓ src/services/authService.test.ts > fetchMe > should_throw_on401 3ms
 ✓ src/services/authService.test.ts > fetchMe > should_throw_on500 1ms
 ✓ src/components/Layout/Layout.test.tsx > Layout > sidebar state > should_closeSidebar_whenXButtonIsClicked 104ms
 ✓ src/components/Layout/Layout.test.tsx > Layout > sidebar state > should_notShowOverlay_whenSidebarIsClosed 35ms
 ✓ src/components/Layout/Layout.test.tsx > Layout > body scroll lock > should_lockBodyScroll_whenSidebarOpens 50ms
 ✓ src/utils/auth.test.ts > handleUnauthorized > should_redirectToOAuthEndpoint_whenCalled 4ms
 ✓ src/utils/auth.test.ts > handleUnauthorized > should_callRegisteredClearUser_beforeRedirecting 1ms
 ✓ src/utils/auth.test.ts > handleUnauthorized > should_notThrow_whenNoClearUserIsRegistered 1ms
 ✓ src/utils/auth.test.ts > registerClearUser > should_storeFunction_thatIsCalledByHandleUnauthorized 0ms
 ✓ src/utils/auth.test.ts > registerClearUser > should_replaceExistingRegistration_whenCalledAgain 0ms
 ✓ src/components/Layout/Layout.test.tsx > Layout > body scroll lock > should_restoreBodyScroll_whenSidebarCloses 67ms

 Test Files  9 passed (9)
      Tests  80 passed (80)
   Start at  13:40:54
   Duration  3.14s (transform 671ms, setup 2.60s, import 2.02s, tests 3.91s, environment 8.33s)

 % Coverage report from v8
-------------------|---------|----------|---------|---------|-------------------
File               | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s 
-------------------|---------|----------|---------|---------|-------------------
All files          |     100 |    97.61 |     100 |     100 |                   
 contexts          |     100 |    94.44 |     100 |     100 |                   
  ThemeContext.tsx |     100 |    93.75 |     100 |     100 | 56                
-------------------|---------|----------|---------|---------|-------------------

=============================== Coverage summary ===============================
Statements   : 100% ( 92/92 )
Branches     : 97.61% ( 41/42 )
Functions    : 100% ( 37/37 )
Lines        : 100% ( 86/86 )
================================================================================
```

## Observations

_Add any observations about test quality, gaps, or edge cases here._