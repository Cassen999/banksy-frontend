# Dashboard — Test Plan

## File
`src/components/Homepage/HomepagePage.test.tsx` — full rewrite (existing tests cover removed functionality)

## Test Cases

### Rendering
- `should_renderGraphSection` — section with aria-label "Spending trend graph" is in the document
- `should_renderNextDepositSection` — element with aria-label "Next scheduled deposit" is in the document
- `should_renderAccountsSection` — section with aria-label "Account overview" is in the document
- `should_renderDashboardContainer` — `.dashboard` wrapper is present

### No Removed Content
- `should_notRenderWelcomeHeading` — no h1 with "Welcome to" text
- `should_notRenderNavButtons` — no buttons rendered

## Mocks
None required — component has no context dependencies in skeleton form.
