# Fix Plan — quick-account-overview

## Root Cause

- 1 test(s) failing
- Line coverage 0.0% < 80%
- Branch coverage 0.0% < 80%

## Step-by-Step Fix

1. <!-- describe step 1 -->
2. <!-- describe step 2 -->
3. <!-- describe step 3 -->

## Fix Applied

_Blank until filled in._

## Relevant Test Output

```
Detailed View link
 FAIL  src/components/QuickAccountOverview/QuickAccountOverview.test.tsx > QuickAccountOverview > success state — panel content (second tab open) > shows customName text in panel body when customName is set
 FAIL  src/components/QuickAccountOverview/QuickAccountOverview.test.tsx > QuickAccountOverview > success state — panel content (second tab open) > renders -- when lastDeposit is null
 FAIL  src/components/QuickAccountOverview/QuickAccountOverview.test.tsx > QuickAccountOverview > success state — panel content (second tab open) > renders "No recent transactions" when account has no transactions
ReferenceError: isMobile is not defined
 ❯ AccountPanel src/components/QuickAccountOverview/QuickAccountOverview.tsx:71:11
     69|         <div className="quick-account-overview__info-row">
     70|           <span className="quick-account-overview__label">Account Name…
     71|           <div className="quick-account-overview__name-value">
       |           ^
     72|             {isMobile()}
     73|             <CustomAccountNameButton
 ❯ Object.react_stack_bottom_frame node_modules/react-dom/cjs/react-dom-client.development.js:25904:20
 ❯ renderWithHooks node_modules/react-dom/cjs/react-dom-client.development.js:7662:22
 ❯ updateFunctionComponent node_modules/react-dom/cjs/react-dom-client.development.js:10166:19
 ❯ beginWork node_modules/react-dom/cjs/react-dom-client.development.js:11778:18
 ❯ runWithFiberInDEV node_modules/react-dom/cjs/react-dom-client.development.js:874:13
 ❯ performUnitOfWork node_modules/react-dom/cjs/react-dom-client.development.js:17641:22
 ❯ workLoopSync node_modules/react-dom/cjs/react-dom-client.development.js:17469:41
 ❯ renderRootSync node_modules/react-dom/cjs/react-dom-client.development.js:17450:11
 ❯ performWorkOnRoot node_modules/react-dom/cjs/react-dom-client.development.js:16583:35

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/14]⎯
[coverage/coverage-summary.json not found — ensure vitest is configured with json-summary reporter]
```