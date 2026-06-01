# Claude Code Hooks Setup Prompt — TypeScript / React Frontend

Use this prompt verbatim inside a new TypeScript/React project to set up the same
planning-first, test-alongside workflow enforced in the backend. Paste it as your
first message to Claude Code after opening the frontend repo.

---

## Prompt

I want you to set up a Claude Code hooks system for this TypeScript/React project.
These hooks enforce a planning-first, test-alongside development workflow. I am going
to describe exactly what to build. Read all of it before writing anything.

### Overview of what to create

```
.claude/
  hooks/
    utils.ts
    audit_before_code.ts
    enforce_during_implementation.ts
    definition_of_done.ts
  settings.json

plans/
  .active-feature          ← contains the name of the current feature folder
  example-feature/
    IMPLEMENTATION_PLAN.md
    TEST_PLAN.md
    DIAGRAMS.md
```

All four hook scripts must be written in TypeScript and run with `npx ts-node`.
Do not use Python. Do not use shell scripts.

---

### `utils.ts` — shared helpers

Export two functions used by the other three hooks.

**`findRepoRoot(): string`**
Walk up from `process.cwd()` until a directory containing `package.json` is found.
Return that directory. If no `package.json` is found, return `process.cwd()`.

**`findActiveFeature(repoRoot: string): string | null`**
Read `plans/.active-feature` (relative to `repoRoot`). Trim whitespace.
If the value is a non-empty string and `plans/<value>/` is an existing directory,
return the value.
Otherwise print a warning to stderr:
  `"WARNING: plans/.active-feature not found or points to a missing folder. ..."`
Then fall back: list all subdirectories of `plans/` that contain
`IMPLEMENTATION_PLAN.md`, sort by mtime descending, return the first one.
Return `null` if no candidates exist.

---

### `audit_before_code.ts` — UserPromptSubmit hook

This hook fires before Claude writes any code. It reads the user's prompt and injects
context that forces Claude to audit for overlap before implementing anything.

**Input**: JSON on stdin with shape `{ prompt: string }`.
**Output**: print `JSON.stringify({ additionalContext: "..." })` on success (exit 0),
or print error message to stderr and exit 2 to hard-block.

**Step 1 — Keyword filter**
If the prompt (lowercased) does not contain any of these words, exit 0 immediately
(do nothing):

```
component, hook, store, context, route, page, layout, service, fetch, api,
feature, create, build, write, implement, add, fix, update, refactor,
complete, make, code, type, interface, util, helper, form, modal, view,
table, list, card, button, input, action, reducer, slice, provider
```

**Step 2 — Collect context**

Collect all three of the following. Then either inject the context or hard-block.

**Audit 1 — Architecture**
Read `ARCHITECTURE.md` from the repo root (or `documentation/ARCHITECTURE.md`).
If found, include up to 8000 characters. If not found, note the warning.

**Audit 2 — State and store audit**
Scan `src/` for files that are likely to define shared state. Match any file whose
path contains one of: `store`, `Store`, `context`, `Context`, `slice`, `Slice`,
`reducer`, `Reducer`, `Provider`, `provider`. Also match files whose content
contains `createContext`, `createStore`, `createSlice`, `useReducer`, `atom(`
(for Jotai).

For each matched file, extract:
- The file path (relative to repo root)
- Any exported names found via a simple regex scan for `export const`, `export function`,
  `export default`, `export type`, `export interface`

Present a summary table so Claude can see what state already exists before proposing
new state.

**Audit 3 — Feature plans**
Read `plans/.active-feature`. Check whether `plans/<active-feature>/` exists and
contains all three of:
  - `IMPLEMENTATION_PLAN.md`
  - `TEST_PLAN.md`
  - `DIAGRAMS.md`

Hard-block (exit 2) if:
- `plans/.active-feature` does not exist or points to a missing folder
- Any of the three plan documents are missing for the active feature

**Step 3 — Inject context**
If not blocked, print a JSON object with `additionalContext` containing a message
in this format:

```
═══════════════════════════════════════════════════
MANDATORY PRE-CODE AUDIT — DO NOT SKIP
═══════════════════════════════════════════════════

Before writing any code you must complete all three audits below
and deliver the required report. Implementation code is strictly
forbidden until all three audits are complete, all three plan
documents exist, and the user has confirmed how to proceed.

───────────────────────────────────────────────────
AUDIT 1 OF 3: ARCHITECTURE
───────────────────────────────────────────────────
[content of ARCHITECTURE.md or warning if missing]

───────────────────────────────────────────────────
AUDIT 2 OF 3: STATE / STORE
───────────────────────────────────────────────────
[summary of existing stores, contexts, and slices found in src/]

───────────────────────────────────────────────────
AUDIT 3 OF 3: FEATURE PLANS
───────────────────────────────────────────────────
[list of plan folders and their status]

───────────────────────────────────────────────────
REQUIRED REPORT FORMAT
───────────────────────────────────────────────────

Respond with this structure. No implementation code until step 4 is confirmed.

ARCHITECTURE AUDIT
  Overlap found: YES / NO / PARTIAL
  If yes or partial: list every affected component, hook, service, or
  utility with file paths if known.

STATE AUDIT
  Overlap found: YES / NO / PARTIAL
  If yes or partial: list every store, context, slice, or hook that
  already handles or could handle the requested state.

PLAN AUDIT
  Feature name: <the kebab-case name you have chosen>
  Plan status: COMPLETE / INCOMPLETE / NOT STARTED
  If incomplete or not started: list exactly which documents are missing
  and confirm you will create them now.

RECOMMENDATION
  One of:
  A) Extend existing code/state — describe what to modify
  B) New code/state justified — explain why it is warranted
  C) Refactor recommended — describe the unified approach

DECISION REQUIRED
  If plans are missing: "I will now create the missing plan documents.
  Please review them before I write any code."
  If plans are complete: "Plans confirmed. Please confirm option A, B,
  or C and I will begin implementation."

═══════════════════════════════════════════════════
```

---

### `enforce_during_implementation.ts` — PreToolUse hook (Write / Edit)

Fires before Claude writes or edits any file.

**Input**: JSON on stdin with shape `{ tool_input: { file_path?: string, path?: string } }`.
Also receives `transcript_path: string` for reading the session transcript.

**Output**: exit 0 to allow the write, exit 2 to block it, or print
`JSON.stringify({ additionalContext: "..." })` for a soft warning.

**Gate 0 — Allow plan files**
If the file path contains `/plans/` or starts with `plans/`, exit 0 immediately.

**Gate 1 — Active feature must exist**
If `findActiveFeature()` returns null, print to stderr:

```
BLOCKED — NO ACTIVE FEATURE
  plans/.active-feature does not exist or points to a missing folder.
  Create plans/.active-feature containing your current feature name,
  then create the three required plan documents before writing any code.
```
Exit 2.

**Gate 2 — All three plan documents must exist**
Check `plans/<feature>/IMPLEMENTATION_PLAN.md`, `TEST_PLAN.md`, `DIAGRAMS.md`.
If any are missing, print to stderr listing which ones and block (exit 2).

**Gate 3 — User must have explicitly approved the plans**
Check for a marker file at `plans/<feature>/.approved`.
If it does not exist, scan the session transcript (JSONL at `transcript_path`) for
the most recent user message. If it contains any of these approval keywords
(case-insensitive), create the `.approved` marker file and continue:

```
approved, approve, lgtm, looks good, go ahead, proceed, ship it,
good to go, confirmed, confirm, happy with, commence,
start implementation, begin implementation, start coding, begin coding, you may
```

If the `.approved` marker does not exist AND the last user message contains none
of these keywords, print to stderr:

```
BLOCKED — WAITING FOR USER APPROVAL
  All three plan documents exist for '<feature>' but the user has not yet
  explicitly approved them.

  Present the contents of:
    plans/<feature>/IMPLEMENTATION_PLAN.md
    plans/<feature>/TEST_PLAN.md
    plans/<feature>/DIAGRAMS.md

  Then stop and wait. Do NOT write any code until the user responds
  with one of: approved, lgtm, looks good, go ahead, proceed,
  ship it, good to go, confirmed.
```
Exit 2.

**Gate 4 — Co-located test file must exist first**
Only applies to implementation files: `.tsx` or `.ts` files under `src/` that are
NOT test files themselves (i.e., do not contain `.test.` or `.spec.` in the name).

Skip this gate for files matching any of these patterns:
```
*.config.ts, *.config.tsx, vite.config.ts, vitest.config.ts,
main.tsx, App.tsx, *.d.ts, index.ts, index.tsx,
*.types.ts, types.ts
```
Also skip for files inside `src/types/`, `src/assets/`, `src/styles/`.

For all other implementation files, the co-located test file must already exist.
The expected test path is: same directory, same base name, with `.test.tsx` or
`.test.ts` appended (prefer `.test.tsx` for `.tsx` files, `.test.ts` for `.ts`).

A test file counts as existing only if it contains at least one `it(`, `test(`,
or `describe(` call (scan with a simple regex).

If the test file does not exist and Claude is **creating** a new implementation file,
block with:
```
BLOCKED: You are creating <file_path> without a co-located test file.
  Expected: <expected_test_path>

Write <expected_test_path> first, then return to this file.
```

If the test file does not exist and Claude is **modifying** an existing
implementation file, block with:
```
BLOCKED: You are modifying <file_path> but its co-located test file does not exist.
  Expected: <expected_test_path>

Create <expected_test_path> before modifying this file.
```

**Soft warning — test file not updated**
If the implementation file is being modified AND its test file already exists AND
the test file was not modified in this git session (check `git diff --name-only`
and `git diff --cached --name-only`), print a soft warning via additionalContext:

```
REMINDER: You are modifying <filename>. Its existing tests must also be reviewed
and updated if behavior has changed. Ensure <test_filename> reflects this change.
```

---

### `definition_of_done.ts` — Stop hook

Fires when Claude finishes a response. Runs the test suite, checks coverage, and
verifies architecture documentation.

**Input**: JSON on stdin with shape `{ transcript_path: string }`.

**Emergency brake**: Read the session transcript and find the most recent user
message. If it is exactly one of `stop`, `stop.`, `stop!`, `cancel`, `halt`,
`cancel.`, `halt.` (case-insensitive), exit 0 immediately without running anything.

**Step 0 — Check active feature**
If no active feature, exit 0 (not a feature session, do nothing).

**Step 1 — Run Vitest**
Run `npx vitest run --coverage --reporter=verbose` from the repo root.
Capture stdout and stderr together. Timeout after 300 seconds.
Parse for failures: count lines matching `× ` (failed test indicator in Vitest output)
or look for the summary line `X failed`.

**Step 2 — Parse coverage**
Vitest with `@vitest/coverage-v8` or `@vitest/coverage-istanbul` writes a JSON
summary to `coverage/coverage-summary.json`. Parse it.

The format is:
```json
{
  "total": {
    "lines":    { "total": N, "covered": N, "pct": N },
    "branches": { "total": N, "covered": N, "pct": N }
  },
  "src/components/Button.tsx": {
    "lines":    { "total": N, "covered": N, "pct": N },
    "branches": { "total": N, "covered": N, "pct": N }
  }
}
```

Extract overall line and branch percentages from `total`.
Also collect per-file entries that fall below 80% for either metric.

**Coverage threshold**: 80% for both line and branch coverage.

**Coverage exclusions** — do not count these files toward the threshold, and
do not report them as failing:
```
*.config.ts, *.config.tsx, vite.config.ts, vitest.config.ts,
main.tsx, *.d.ts, index.ts, index.tsx, *.types.ts, types.ts,
files under src/types/, files under src/assets/
```

**Step 3 — Architecture.md component compliance**
Read `ARCHITECTURE.md` (repo root or `documentation/ARCHITECTURE.md`).
Get changed files via:
  - `git diff --cached --name-only`
  - `git diff --name-only`
  - `git ls-files --others --exclude-standard`

Filter to implementation files: `.tsx` or `.ts` under `src/`, not test files,
not in the exclusion list.

For each:
- Derive the component name from the file's base name (strip extension).
  e.g. `Button.tsx` → `Button`, `useAuth.ts` → `useAuth`
- Check whether this name appears as a whole word in `ARCHITECTURE.md`
  (case-insensitive, regex `\bComponentName\b`).

Rules (same as backend):
- **New file not documented** → hard block
- **Modified file not documented** → hard block (treat as missing)
- **Modified file documented but ARCHITECTURE.md was NOT updated this session** → hard block
- **Modified file documented and ARCHITECTURE.md WAS updated** → pass

"ARCHITECTURE.md was updated this session" means `ARCHITECTURE.md` appears in
the combined set of changed files.

**Step 4 — Write TEST_REPORT.md**
Write to `testing/<feature-name>/TEST_REPORT.md`. Create the directory if needed.
Format:

```markdown
# Test Report — <feature-name>

## Summary

| Check | Result |
|-------|--------|
| Tests | PASS / FAIL |
| Line Coverage | XX% (PASS / FAIL) |
| Branch Coverage | XX% (PASS / FAIL) |

## Coverage Results

- **Line coverage:** XX% (threshold: 80%)
- **Branch coverage:** XX% (threshold: 80%)

### Excluded Files
_Per hook exclusion list — excluded from threshold:_
- <file>

### Files Below Threshold

- `src/components/Foo.tsx` — line: XX%, branch: XX%

## Test Results

- **Status:** PASS / FAIL
- **Failures:** N

### Vitest Output

```
[last 3000 chars of combined stdout/stderr]
```

## Observations

_Add any observations about test quality, gaps, or edge cases here._
```

**Step 5 — Write FIX_PLAN.md if needed**
If tests failed or coverage is below threshold, write
`testing/<feature-name>/FIX_PLAN.md`.
This file is informational only — there is no closure gate on it.
Format it with: Root Cause, Step-by-Step Fix (with numbered placeholder steps),
Fix Applied (blank until filled in), and Relevant Test Output (last 2000 chars).

**Step 6 — Determine outcome**
Build a summary and either inject it as `additionalContext` (if all checks pass)
or print it to stderr and exit 2 (if any check fails).

Hard block conditions:
- Any test failures
- Line coverage < 80% (after exclusions)
- Branch coverage < 80% (after exclusions)
- Any architecture compliance violations

The summary format mirrors the backend:

```
═══════════════════════════════════════════════════
DEFINITION OF DONE — RESULTS
═══════════════════════════════════════════════════

Feature: <feature-name>

Actions taken by this hook:
  ✓ Created testing/<feature>/TEST_REPORT.md
  ✓ Created testing/<feature>/FIX_PLAN.md  (if applicable)

───────────────────────────────────────────────────
CHECKS
───────────────────────────────────────────────────

  Tests:           PASS / FAIL (N failures)
  Line coverage:   XX% (PASS / FAIL)
  Branch coverage: XX% (PASS / FAIL)
  ARCHITECTURE.md components:
    ✓ Button — modified, ARCHITECTURE.md updated (pass)
    ✗ NewWidget — new, not documented

───────────────────────────────────────────────────
BLOCKED — DO NOT MARK DONE   (or ALL CHECKS PASSED)
───────────────────────────────────────────────────

[block messages or success message]

═══════════════════════════════════════════════════
```

---

### `.claude/settings.json`

Wire up the three active hooks. Use `npx ts-node` as the runner.
If the project uses ESM (`"type": "module"` in package.json), use
`npx ts-node --esm` instead.

```json
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "matcher": "component|hook|store|context|route|page|create|build|write|implement|add|feature|fix|update|refactor",
        "hooks": [
          {
            "type": "command",
            "command": "npx ts-node .claude/hooks/audit_before_code.ts"
          }
        ]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Write|Edit|MultiEdit",
        "hooks": [
          {
            "type": "command",
            "command": "npx ts-node .claude/hooks/enforce_during_implementation.ts"
          }
        ]
      }
    ],
    "Stop": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "npx ts-node .claude/hooks/definition_of_done.ts"
          }
        ]
      }
    ]
  }
}
```

---

### `plans/` bootstrap

Create:
- `plans/.active-feature` — contents: `example-feature`
- `plans/example-feature/IMPLEMENTATION_PLAN.md` — stub with `# Implementation Plan — example-feature`
- `plans/example-feature/TEST_PLAN.md` — stub with `# Test Plan — example-feature`
- `plans/example-feature/DIAGRAMS.md` — stub with `# Diagrams — example-feature`

The CLAUDE.md for this project must include these rules for maintaining
`plans/.active-feature`:

```
## Active Feature Tracking

The file `plans/.active-feature` must always contain the name of the
feature currently being worked on.

Rules:
- When you create a new plan folder under `plans/`, immediately write
  the folder name to `plans/.active-feature`
- When switching to a different existing feature, update
  `plans/.active-feature` before doing anything else
- Never delete `plans/.active-feature`
- The contents must exactly match an existing folder name under `plans/`
```

---

### Implementation notes

- All hooks must handle JSON parse errors on stdin gracefully (catch and exit 2
  with a clear message to stderr).
- All hooks must catch unexpected exceptions and exit 2 with a message rather than
  crashing silently.
- Do not install any new npm packages beyond what Vitest and ts-node require.
  If `ts-node` is not yet in `devDependencies`, add it.
- After creating all files, run a quick sanity check:
  `echo '{"prompt":"create a component"}' | npx ts-node .claude/hooks/audit_before_code.ts`
  and confirm it either injects context or hard-blocks cleanly (not crashes).

Now build everything described above. Start with `utils.ts`, then the three hook
scripts, then `settings.json`, then the `plans/` bootstrap, then update `CLAUDE.md`.