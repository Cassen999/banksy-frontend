/* eslint-disable no-empty */
import * as fs from 'fs';
import * as path from 'path';
import { execSync, spawnSync } from 'child_process';
import { findRepoRoot, findActiveFeature } from './utils.js';

const STOP_WORDS = new Set(['stop', 'stop.', 'stop!', 'cancel', 'halt', 'cancel.', 'halt.']);
const COVERAGE_THRESHOLD = 80;

const EXCLUDED_PATTERNS = [
  /\.config\.(ts|tsx)$/,
  /vite\.config\.(ts|tsx)$/,
  /vitest\.config\.(ts|tsx)$/,
  /main\.tsx$/,
  /^App\.(tsx|ts)$/,
  /\.d\.ts$/,
  /index\.(ts|tsx)$/,
  /\.types\.ts$/,
  /^types\.ts$/,
];
const EXCLUDED_DIRS = ['src/types', 'src/assets', 'src/mocks', 'src/test'];

// ------------------------------------------------------------
// Component type classification
// Used to route block messages to the correct document and
// section so the agent knows exactly where to add the entry.
// ------------------------------------------------------------
type ComponentKind = 'component' | 'hook' | 'service' | 'context' | 'utility' | 'page' | 'other';

function classifyComponentKind(file: string): ComponentKind {
  const base = path.basename(file);
  if (/\.test\.(ts|tsx)$/.test(base)) return 'other';
  if (base.startsWith('use') && /\.(ts|tsx)$/.test(base)) return 'hook';
  if (file.includes('src/contexts/')) return 'context';
  if (file.includes('src/services/')) return 'service';
  if (file.includes('src/utils/')) return 'utility';
  if (file.includes('src/hooks/')) return 'hook';
  if (/Page\.(tsx|ts)$/.test(base)) return 'page';
  if (file.includes('src/components/')) return 'component';
  return 'other';
}

function kindToArchSection(kind: ComponentKind): string {
  switch (kind) {
    case 'component': return 'Components section';
    case 'page':      return 'Pages / Views section';
    case 'hook':      return 'Hooks section';
    case 'service':   return 'Services section';
    case 'context':   return 'Contexts section';
    case 'utility':   return 'Utilities section';
    default:          return 'appropriate section';
  }
}

function kindToComponentsTable(kind: ComponentKind): string {
  switch (kind) {
    case 'component': return 'Components table';
    case 'page':      return 'Pages / Views table';
    case 'hook':      return 'Hooks table';
    case 'service':   return 'Services table';
    case 'context':   return 'Contexts table';
    case 'utility':   return 'Utilities table';
    default:          return 'appropriate table';
  }
}

interface FileCoverage {
  lines: { pct: number };
  branches: { pct: number };
}
interface CoverageSummary {
  total: FileCoverage;
  [file: string]: FileCoverage;
}

function readStdin(): string {
  try {
    return fs.readFileSync('/dev/stdin', 'utf-8');
  } catch {
    try {
      return fs.readFileSync(0, 'utf-8');
    } catch {
      return '';
    }
  }
}

function extractUserMessages(transcriptPath: string): string[] {
  if (!transcriptPath || !fs.existsSync(transcriptPath)) return [];
  try {
    const messages: string[] = [];
    for (const line of fs.readFileSync(transcriptPath, 'utf-8').split('\n').filter(Boolean)) {
      try {
        const entry = JSON.parse(line);
        let role: string | undefined;
        let content: unknown;
        if (entry.role) { role = entry.role; content = entry.content; }
        else if (entry.message?.role) { role = entry.message.role; content = entry.message.content; }
        else if (entry.type === 'user') { role = 'user'; content = entry.message?.content ?? entry.content; }
        if (role !== 'user') continue;
        if (typeof content === 'string') {
          messages.push(content);
        } else if (Array.isArray(content)) {
          const text = (content as Array<{ type: string; text?: string }>)
            .filter((b) => b.type === 'text').map((b) => b.text ?? '').join(' ');
          if (text) messages.push(text);
        }
      } catch { }
    }
    return messages;
  } catch {
    return [];
  }
}

function isEmergencyStop(messages: string[]): boolean {
  if (messages.length === 0) return false;
  return STOP_WORDS.has(messages[messages.length - 1].trim().toLowerCase());
}

function getChangedFiles(repoRoot: string): { all: string[]; newFiles: Set<string> } {
  const run = (cmd: string) => {
    try { return execSync(cmd, { cwd: repoRoot }).toString().split('\n').filter(Boolean); }
    catch { return []; }
  };
  const staged = run('git diff --cached --name-only');
  const unstaged = run('git diff --name-only');
  const untracked = run('git ls-files --others --exclude-standard');

  const newFiles = new Set<string>();
  untracked.forEach((f) => newFiles.add(f));
  try {
    execSync('git diff --cached --name-status', { cwd: repoRoot })
      .toString().split('\n').filter(Boolean).forEach((line) => {
        if (line.startsWith('A\t')) newFiles.add(line.slice(2).trim());
      });
  } catch { }

  const all = [...new Set([...staged, ...unstaged, ...untracked])];
  return { all, newFiles };
}

function isExcluded(relPath: string): boolean {
  const basename = path.basename(relPath);
  if (EXCLUDED_PATTERNS.some((re) => re.test(basename))) return true;
  return EXCLUDED_DIRS.some((d) => relPath.startsWith(d + '/') || relPath.includes('/' + d + '/'));
}

function ensureDir(dirPath: string) {
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
}

// ------------------------------------------------------------
// Option B name detection
//
// Checks whether `name` appears in the document as:
//   - A markdown table cell:  | name |  or  | name.ts |
//   - A markdown code span:   `name`  or  `name.ts`
//
// This is intentionally strict. A name that appears only in
// prose (e.g. mentioned in another component's description)
// will NOT pass. The agent must add a proper table row or
// code span entry for the check to pass.
//
// NOTE: This check runs after the agent has had the opportunity
// to update the documents. The PostToolUse timing means the
// documents on disk reflect the agent's latest writes. If the
// agent updated the document correctly the check passes; if it
// skipped the update the check fails and the block message
// tells the agent exactly what to do to fix it.
// ------------------------------------------------------------
function isDocumentedInDoc(name: string, content: string): boolean {
  // Match name or name.ts / name.tsx in a table cell or code span
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const tableCell = new RegExp(`\\|[^|\\n]*\\b${escaped}\\b[^|\\n]*\\|`, 'i');
  const codeSpan  = new RegExp(`\`${escaped}(?:\\.(tsx?|jsx?))?\``, 'i');
  return tableCell.test(content) || codeSpan.test(content);
}

function resolveDocPath(repoRoot: string, candidates: string[]): string {
  for (const p of candidates) {
    if (fs.existsSync(path.join(repoRoot, p))) return path.join(repoRoot, p);
  }
  return '';
}

// ------------------------------------------------------------
// Report writers
// ------------------------------------------------------------
function writeTestReport(
  repoRoot: string,
  featureName: string,
  testsPassed: boolean,
  testFailures: number,
  linePct: number,
  branchPct: number,
  filesBelow: string[],
  excludedFiles: string[],
  vitestOutput: string,
): string {
  const dir = path.join(repoRoot, 'reports', featureName);
  ensureDir(dir);
  const pf = (ok: boolean) => (ok ? 'PASS' : 'FAIL');

  const content = [
    `# Test Report — ${featureName}`,
    '',
    '## Summary',
    '',
    '| Check | Result |',
    '|-------|--------|',
    `| Tests | ${pf(testsPassed)} |`,
    `| Line Coverage | ${linePct.toFixed(1)}% (${pf(linePct >= COVERAGE_THRESHOLD)}) |`,
    `| Branch Coverage | ${branchPct.toFixed(1)}% (${pf(branchPct >= COVERAGE_THRESHOLD)}) |`,
    '',
    '## Coverage Results',
    '',
    `- **Line coverage:** ${linePct.toFixed(1)}% (threshold: ${COVERAGE_THRESHOLD}%)`,
    `- **Branch coverage:** ${branchPct.toFixed(1)}% (threshold: ${COVERAGE_THRESHOLD}%)`,
    '',
    '### Excluded Files',
    '_Per hook exclusion list — excluded from threshold:_',
    ...(excludedFiles.length > 0 ? excludedFiles.map((f) => `- ${f}`) : ['_None_']),
    '',
    '### Files Below Threshold',
    ...(filesBelow.length > 0 ? filesBelow.map((f) => `- \`${f}\``) : ['_None_']),
    '',
    '## Test Results',
    '',
    `- **Status:** ${pf(testsPassed)}`,
    `- **Failures:** ${testFailures}`,
    '',
    '### Vitest Output',
    '',
    '```',
    vitestOutput.slice(-3000),
    '```',
    '',
    '## Observations',
    '',
    '_Add any observations about test quality, gaps, or edge cases here._',
  ].join('\n');

  const reportPath = path.join(dir, 'TEST_REPORT.md');
  fs.writeFileSync(reportPath, content);
  return path.join('reports', featureName, 'TEST_REPORT.md');
}

function writeFixPlan(
  repoRoot: string,
  featureName: string,
  testFailures: number,
  linePct: number,
  branchPct: number,
  vitestOutput: string,
): string {
  const dir = path.join(repoRoot, 'reports', featureName);
  ensureDir(dir);

  const issues: string[] = [];
  if (testFailures > 0) issues.push(`${testFailures} test(s) failing`);
  if (linePct < COVERAGE_THRESHOLD) issues.push(`Line coverage ${linePct.toFixed(1)}% < ${COVERAGE_THRESHOLD}%`);
  if (branchPct < COVERAGE_THRESHOLD) issues.push(`Branch coverage ${branchPct.toFixed(1)}% < ${COVERAGE_THRESHOLD}%`);

  const content = [
    `# Fix Plan — ${featureName}`,
    '',
    '## Root Cause',
    '',
    ...issues.map((i) => `- ${i}`),
    '',
    '## Step-by-Step Fix',
    '',
    '1. <!-- describe step 1 -->',
    '2. <!-- describe step 2 -->',
    '3. <!-- describe step 3 -->',
    '',
    '## Fix Applied',
    '',
    '_Blank until filled in._',
    '',
    '## Relevant Test Output',
    '',
    '```',
    vitestOutput.slice(-2000),
    '```',
  ].join('\n');

  const fixPath = path.join(dir, 'FIX_PLAN.md');
  fs.writeFileSync(fixPath, content);
  return path.join('reports', featureName, 'FIX_PLAN.md');
}

// ------------------------------------------------------------
// Main
// ------------------------------------------------------------
function main() {
  let input: { transcript_path?: string };
  try {
    input = JSON.parse(readStdin());
  } catch (e) {
    process.stderr.write(`definition_of_done: failed to parse stdin JSON: ${e}\n`);
    process.exit(2);
  }

  const transcriptPath = input.transcript_path || '';
  const userMessages = extractUserMessages(transcriptPath);

  if (isEmergencyStop(userMessages)) process.exit(0);

  const repoRoot = findRepoRoot();
  const activeFeature = findActiveFeature(repoRoot);

  if (!activeFeature) process.exit(0);

  const { all: changedFiles, newFiles } = getChangedFiles(repoRoot);

  // Only run if src/ .ts/.tsx files changed
  if (!changedFiles.some((f) => f.startsWith('src/') && /\.(ts|tsx)$/.test(f))) process.exit(0);

  // ── Step 1 — Run Vitest ────────────────────────────────────
  const vitestResult = spawnSync(
    'npx',
    ['vitest', 'run', '--coverage', '--reporter=verbose'],
    { cwd: repoRoot, timeout: 300_000, encoding: 'utf-8' },
  );
  const vitestOutput = [vitestResult.stdout ?? '', vitestResult.stderr ?? ''].join('\n').trim();
  const failMatch = vitestOutput.match(/(\d+)\s+failed/);
  const testFailures = failMatch ? parseInt(failMatch[1], 10) : 0;
  const testsPassed = vitestResult.status === 0 && testFailures === 0 && !/× /.test(vitestOutput);

  // ── Step 2 — Parse coverage ────────────────────────────────
  const coveragePath = path.join(repoRoot, 'coverage', 'coverage-summary.json');
  let linePct = 0;
  let branchPct = 0;
  const filesBelow: string[] = [];
  const excludedFiles: string[] = [];
  let coverageNote = '';

  if (fs.existsSync(coveragePath)) {
    try {
      const summary: CoverageSummary = JSON.parse(fs.readFileSync(coveragePath, 'utf-8'));
      linePct = summary.total?.lines?.pct ?? 0;
      branchPct = summary.total?.branches?.pct ?? 0;

      for (const [file, data] of Object.entries(summary)) {
        if (file === 'total') continue;
        const rel = path.relative(repoRoot, file);
        if (isExcluded(rel)) { excludedFiles.push(rel); continue; }
        const lp = data.lines?.pct ?? 100;
        const bp = data.branches?.pct ?? 100;
        if (lp < COVERAGE_THRESHOLD || bp < COVERAGE_THRESHOLD) {
          filesBelow.push(`${rel} — line: ${lp.toFixed(1)}%, branch: ${bp.toFixed(1)}%`);
        }
      }
    } catch (e) {
      coverageNote = `\n[Coverage parse error: ${e}]`;
    }
  } else {
    coverageNote = '\n[coverage/coverage-summary.json not found — ensure vitest is configured with json-summary reporter]';
  }

  const vitestOutputFull = vitestOutput + coverageNote;

  // ── Step 3 — Load living documents ────────────────────────
  //
  // Both ARCHITECTURE.md and COMPONENTS.md are read fresh from
  // disk here. By the time this hook fires (PostToolUse) the
  // agent has already had the opportunity to update them.
  // The checks below reflect the current state of the files —
  // if the agent updated them correctly the checks pass.
  // If the agent skipped the updates the checks fail and the
  // block messages below tell the agent exactly what to do.

  const archDocPath = resolveDocPath(repoRoot, [
    '_dev/ARCHITECTURE.md',
    'ARCHITECTURE.md',
    'documentation/ARCHITECTURE.md',
  ]);
  const componentsDocPath = resolveDocPath(repoRoot, [
    '_dev/COMPONENTS.md',
    'COMPONENTS.md',
    'documentation/COMPONENTS.md',
  ]);

  const archContent      = archDocPath      ? fs.readFileSync(archDocPath, 'utf-8')      : '';
  const componentsContent = componentsDocPath ? fs.readFileSync(componentsDocPath, 'utf-8') : '';

  const archRelPath       = archDocPath      ? path.relative(repoRoot, archDocPath)      : '_dev/ARCHITECTURE.md';
  const componentsRelPath = componentsDocPath ? path.relative(repoRoot, componentsDocPath) : '_dev/COMPONENTS.md';

  const archWasUpdated = changedFiles.some((f) =>
    ['ARCHITECTURE.md', '_dev/ARCHITECTURE.md', 'documentation/ARCHITECTURE.md'].includes(f),
  );
  const componentsWasUpdated = changedFiles.some((f) =>
    ['COMPONENTS.md', '_dev/COMPONENTS.md', 'documentation/COMPONENTS.md'].includes(f),
  );

  // ── Step 4 — Architecture + Components compliance ──────────
  //
  // For each changed non-test src/ file we check two things:
  //   A) Is the component name documented in ARCHITECTURE.md?
  //      Uses Option B detection: name must appear in a markdown
  //      table cell or code span — not just anywhere in prose.
  //   B) Is the component name documented in COMPONENTS.md?
  //      Same Option B detection.
  //
  // A new file that fails either check is a hard block.
  // A modified file that fails either check is also a hard block
  // because the documents should have been updated to reflect
  // whatever changed.
  //
  // A modified file that passes both checks but neither document
  // was updated this session gets a soft warning — the agent
  // must declare whether the change was functional or not.

  type DocStatus = 'hard-block' | 'warn' | 'pass';

  interface ComponentResult {
    component: string;
    file: string;
    kind: ComponentKind;
    isNew: boolean;
    inArch: boolean;
    inComponents: boolean;
    archUpdated: boolean;
    componentsUpdated: boolean;
    status: DocStatus;
  }

  const srcChanged = changedFiles.filter(
    (f) =>
      f.startsWith('src/') &&
      /\.(ts|tsx)$/.test(f) &&
      !/\.(test|spec)\.(ts|tsx)$/.test(f) &&
      !isExcluded(f),
  );

  const componentResults: ComponentResult[] = [];

  for (const file of srcChanged) {
    const componentName = path.basename(file).replace(/\.(tsx?|jsx?)$/, '');
    const kind = classifyComponentKind(file);
    const isNew = newFiles.has(file);

    // Skip files that don't map to a registerable kind
    if (kind === 'other') continue;

    const inArch       = archContent       ? isDocumentedInDoc(componentName, archContent)       : false;
    const inComponents = componentsContent ? isDocumentedInDoc(componentName, componentsContent) : false;

    let status: DocStatus;
    if (!inArch || !inComponents) {
      // Missing from one or both documents — always a hard block
      // regardless of whether the file is new or modified.
      status = 'hard-block';
    } else if (!archWasUpdated && !componentsWasUpdated) {
      // Documented in both, but neither doc was touched this session.
      // Soft warning — agent must declare functional vs non-functional.
      status = 'warn';
    } else {
      status = 'pass';
    }

    componentResults.push({
      component: componentName,
      file,
      kind,
      isNew,
      inArch,
      inComponents,
      archUpdated: archWasUpdated,
      componentsUpdated: componentsWasUpdated,
      status,
    });
  }

  const hardBlockComponents = componentResults.filter((r) => r.status === 'hard-block');
  const warnComponents      = componentResults.filter((r) => r.status === 'warn');

  // ── Step 5 — Write TEST_REPORT.md ─────────────────────────
  const coveragePass = linePct >= COVERAGE_THRESHOLD && branchPct >= COVERAGE_THRESHOLD;
  const reportPath = writeTestReport(
    repoRoot, activeFeature, testsPassed, testFailures,
    linePct, branchPct, filesBelow, excludedFiles, vitestOutputFull,
  );

  // ── Step 6 — Write FIX_PLAN.md if needed ──────────────────
  let fixPlanPath: string | null = null;
  if (!testsPassed || !coveragePass) {
    fixPlanPath = writeFixPlan(repoRoot, activeFeature, testFailures, linePct, branchPct, vitestOutputFull);
  }

  // ── Step 7 — Build summary ─────────────────────────────────
  const icon = (ok: boolean) => (ok ? '✓' : '✗');
  const pf   = (ok: boolean, val?: string) => `${ok ? 'PASS' : 'FAIL'}${val ? ` (${val})` : ''}`;

  // Build per-component lines for the summary
  const componentLines = componentResults.map((r) => {
    if (r.status === 'hard-block') {
      const missingFrom: string[] = [];
      if (!r.inArch)       missingFrom.push(archRelPath);
      if (!r.inComponents) missingFrom.push(componentsRelPath);
      return `    ✗ ${r.component} — not documented in: ${missingFrom.join(', ')}`;
    }
    if (r.status === 'warn') {
      return `    ⚠ ${r.component} — documented; neither living doc was updated this session`;
    }
    return `    ✓ ${r.component} — documented in both living docs`;
  });

  // Build the warn declaration block (soft — does not block)
  const warnSection = warnComponents.length > 0
    ? [
        '',
        'LIVING DOC DECLARATION REQUIRED:',
        ...warnComponents.map((r) => `  - ${r.component} (${r.file})`),
        '',
        'For each file above, declare ONE of:',
        '  • "This change is FUNCTIONAL — I am updating both living docs now."',
        '  • "This change is NON-FUNCTIONAL (no change to behaviour, usage, or output) — no update needed."',
        'You must make this declaration before the session is considered done.',
      ]
    : [];

  // Build precise fix instructions for each hard-blocked component.
  // These tell the agent exactly what to do so it can unblock itself
  // without guessing at the correct document format.
  const hardBlockInstructions = hardBlockComponents.flatMap((r) => {
    const lines: string[] = [
      '',
      `  REQUIRED ACTION for ${r.component} (${r.file}):`,
    ];

    if (!r.inArch) {
      lines.push(
        `    1. Open ${archRelPath}`,
        `    2. Find the ${kindToArchSection(r.kind)}`,
        `    3. Add a new row to the table for ${r.component}:`,
        `       - Follow the exact column format of the existing rows in that section`,
        `       - Include: name, file path, props interface (if component), return shape (if hook),`,
        `         method+endpoint (if service), state held (if context), and description`,
        `       - The entry MUST appear in a markdown table cell for the doc check to pass`,
      );
    }

    if (!r.inComponents) {
      lines.push(
        `    ${r.inArch ? '1' : '4'}. Open ${componentsRelPath}`,
        `    ${r.inArch ? '2' : '5'}. Find the ${kindToComponentsTable(r.kind)}`,
        `    ${r.inArch ? '3' : '6'}. Add a new row to the table for ${r.component}:`,
        `       - Follow the exact column format of the existing rows in that table`,
        `       - The entry MUST appear in a markdown table cell for the doc check to pass`,
      );
    }

    lines.push(
      `    After updating the document(s), this hook will re-run and pass`,
      `    for ${r.component} if the entry is correctly formatted.`,
    );

    return lines;
  });

  const allHardPassed = testsPassed && coveragePass && hardBlockComponents.length === 0;

  const summary = [
    '═══════════════════════════════════════════════════',
    'DEFINITION OF DONE — RESULTS',
    '═══════════════════════════════════════════════════',
    '',
    `Feature: ${activeFeature}`,
    '',
    'Actions taken by this hook:',
    `  ✓ Created ${reportPath}`,
    ...(fixPlanPath ? [`  ✓ Created ${fixPlanPath}`] : []),
    '',
    '───────────────────────────────────────────────────',
    'CHECKS',
    '───────────────────────────────────────────────────',
    '',
    `  Tests:           ${icon(testsPassed)} ${pf(testsPassed, `${testFailures} failures`)}`,
    `  Line coverage:   ${icon(linePct >= COVERAGE_THRESHOLD)} ${linePct.toFixed(1)}% (${pf(linePct >= COVERAGE_THRESHOLD)})`,
    `  Branch coverage: ${icon(branchPct >= COVERAGE_THRESHOLD)} ${branchPct.toFixed(1)}% (${pf(branchPct >= COVERAGE_THRESHOLD)})`,
    '  Living docs:',
    ...(componentResults.length > 0 ? componentLines : ['    — no registerable src/ changes detected']),
    ...warnSection,
    '',
    '───────────────────────────────────────────────────',
    allHardPassed ? 'ALL CHECKS PASSED' : 'BLOCKED — DO NOT MARK DONE',
    '───────────────────────────────────────────────────',
    '',
    ...(allHardPassed
      ? ['All checks passed. The session is done.']
      : [
          ...(!testsPassed
            ? [`  ✗ Fix ${testFailures} failing test(s). See reports/${activeFeature}/FIX_PLAN.md`]
            : []),
          ...(linePct < COVERAGE_THRESHOLD
            ? [`  ✗ Line coverage ${linePct.toFixed(1)}% is below the ${COVERAGE_THRESHOLD}% threshold.`]
            : []),
          ...(branchPct < COVERAGE_THRESHOLD
            ? [`  ✗ Branch coverage ${branchPct.toFixed(1)}% is below the ${COVERAGE_THRESHOLD}% threshold.`]
            : []),
          ...(hardBlockComponents.length > 0
            ? [
                '  ✗ The following files are not fully documented in the living docs:',
                ...hardBlockComponents.map((r) => `      ${r.component} (${r.file})`),
                '',
                'HOW TO FIX — update the living documents then re-run:',
                ...hardBlockInstructions,
              ]
            : []),
        ]),
    '',
    '═══════════════════════════════════════════════════',
  ].join('\n');

  if (!allHardPassed) {
    process.stderr.write(summary);
    process.exit(2);
  } else {
    // Pass — inject as context (may include soft arch warnings)
    process.stdout.write(JSON.stringify({ additionalContext: summary }));
    process.exit(0);
  }
}

try {
  main();
} catch (e) {
  process.stderr.write(`definition_of_done: unexpected error: ${e}\n`);
  process.exit(2);
}
