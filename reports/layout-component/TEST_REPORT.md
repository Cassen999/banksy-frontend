# Test Report — layout-component

## Summary

| Check | Result |
|-------|--------|
| Tests | PASS |
| Line Coverage | 100.0% (PASS) |
| Branch Coverage | 97.5% (PASS) |

## Coverage Results

- **Line coverage:** 100.0% (threshold: 80%)
- **Branch coverage:** 97.5% (threshold: 80%)

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
der/AppHeader.test.tsx > AppHeader > auth button — logged in > should_navigateToLogoutUrl_whenLogoutClicked 36ms
 ✓ src/components/AppHeader/AppHeader.test.tsx > AppHeader > desktop — welcome message > should_showWelcomeMessage_whenUserIsLoggedIn 24ms
 ✓ src/components/Layout/Layout.test.tsx > Layout > sidebar state > should_openSidebar_whenHamburgerIsClicked 68ms
 ✓ src/components/Layout/Layout.test.tsx > Layout > sidebar state > should_showOverlay_whenSidebarIsOpen 65ms
 ✓ src/utils/auth.test.ts > handleUnauthorized > should_redirectToOAuthEndpoint_whenCalled 4ms
 ✓ src/utils/auth.test.ts > handleUnauthorized > should_callRegisteredClearUser_beforeRedirecting 1ms
 ✓ src/utils/auth.test.ts > handleUnauthorized > should_notThrow_whenNoClearUserIsRegistered 1ms
 ✓ src/utils/auth.test.ts > registerClearUser > should_storeFunction_thatIsCalledByHandleUnauthorized 0ms
 ✓ src/utils/auth.test.ts > registerClearUser > should_replaceExistingRegistration_whenCalledAgain 0ms
 ✓ src/components/AppHeader/AppHeader.test.tsx > AppHeader > desktop — welcome message > should_notShowWelcomeMessage_whenUserIsNull 25ms
 ✓ src/components/AppHeader/AppHeader.test.tsx > AppHeader > desktop — menubar > should_renderMenubarComponent 30ms
 ✓ src/components/AppHeader/AppHeader.test.tsx > AppHeader > desktop — menubar > should_renderMultipleLogoLinksIncludingMenubarStart 47ms
 ✓ src/components/Layout/Layout.test.tsx > Layout > sidebar state > should_closeSidebar_whenOverlayIsClicked 80ms
 ✓ src/components/Layout/Layout.test.tsx > Layout > sidebar state > should_closeSidebar_whenXButtonIsClicked 78ms
 ✓ src/components/Layout/Layout.test.tsx > Layout > sidebar state > should_notShowOverlay_whenSidebarIsClosed 28ms
 ✓ src/components/Layout/Layout.test.tsx > Layout > body scroll lock > should_lockBodyScroll_whenSidebarOpens 52ms
 ✓ src/components/Layout/Layout.test.tsx > Layout > body scroll lock > should_restoreBodyScroll_whenSidebarCloses 62ms

 Test Files  8 passed (8)
      Tests  70 passed (70)
   Start at  16:11:50
   Duration  3.09s (transform 480ms, setup 2.56s, import 1.99s, tests 3.13s, environment 7.69s)

 % Coverage report from v8
-------------------|---------|----------|---------|---------|-------------------
File               | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s 
-------------------|---------|----------|---------|---------|-------------------
All files          |     100 |     97.5 |     100 |     100 |                   
 contexts          |     100 |    94.44 |     100 |     100 |                   
  ThemeContext.tsx |     100 |    93.75 |     100 |     100 | 56                
-------------------|---------|----------|---------|---------|-------------------

=============================== Coverage summary ===============================
Statements   : 100% ( 88/88 )
Branches     : 97.5% ( 39/40 )
Functions    : 100% ( 35/35 )
Lines        : 100% ( 82/82 )
================================================================================
```

## Observations

_Add any observations about test quality, gaps, or edge cases here._