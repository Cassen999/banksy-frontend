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

  // Emergency brake
  if (isEmergencyStop(userMessages)) process.exit(0);

  const repoRoot = findRepoRoot();
  const activeFeature = findActiveFeature(repoRoot);

  // Step 0 — Not a feature session
  if (!activeFeature) process.exit(0);

  const { all: changedFiles, newFiles } = getChangedFiles(repoRoot);

  // Guard — only run if src/ .ts/.tsx files changed
  if (!changedFiles.some((f) => f.startsWith('src/') && /\.(ts|tsx)$/.test(f))) process.exit(0);

  // Step 1 — Run Vitest
  const vitestResult = spawnSync(
    'npx',
    ['vitest', 'run', '--coverage', '--reporter=verbose'],
    { cwd: repoRoot, timeout: 300_000, encoding: 'utf-8' },
  );
  const vitestOutput = [vitestResult.stdout ?? '', vitestResult.stderr ?? ''].join('\n').trim();
  const failMatch = vitestOutput.match(/(\d+)\s+failed/);
  const testFailures = failMatch ? parseInt(failMatch[1], 10) : 0;
  const testsPassed = vitestResult.status === 0 && testFailures === 0 && !/× /.test(vitestOutput);

  // Step 2 — Parse coverage
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

  // Step 3 — Architecture compliance
  let archContent = '';
  for (const p of [
    path.join(repoRoot, '_dev', 'ARCHITECTURE.md'),
    path.join(repoRoot, 'ARCHITECTURE.md'),
    path.join(repoRoot, 'documentation', 'ARCHITECTURE.md'),
  ]) {
    if (fs.existsSync(p)) { archContent = fs.readFileSync(p, 'utf-8'); break; }
  }

  const archWasUpdated = changedFiles.some((f) =>
    ['ARCHITECTURE.md', '_dev/ARCHITECTURE.md', 'documentation/ARCHITECTURE.md'].includes(f),
  );

  type ArchStatus = 'new-hard-block' | 'modified-not-documented' | 'modified-warn' | 'pass';
  type ArchResult = { component: string; file: string; status: ArchStatus };

  const archResults: ArchResult[] = [];
  const srcChanged = changedFiles.filter(
    (f) => f.startsWith('src/') && /\.(ts|tsx)$/.test(f) && !/\.(test|spec)\.(ts|tsx)$/.test(f) && !isExcluded(f),
  );

  for (const file of srcChanged) {
    const componentName = path.basename(file).replace(/\.(tsx?|jsx?)$/, '');
    const isDocumented = archContent
      ? new RegExp(`\\b${componentName}\\b`, 'i').test(archContent)
      : false;
    const isNew = newFiles.has(file);

    let status: ArchStatus;
    if (!isDocumented) {
      status = isNew ? 'new-hard-block' : 'modified-not-documented';
    } else if (!archWasUpdated) {
      status = 'modified-warn';
    } else {
      status = 'pass';
    }
    archResults.push({ component: componentName, file, status });
  }

  const hardBlockArch = archResults.filter((r) => r.status === 'new-hard-block' || r.status === 'modified-not-documented');
  const warnArch = archResults.filter((r) => r.status === 'modified-warn');

  // Step 4 — Write TEST_REPORT.md
  const coveragePass = linePct >= COVERAGE_THRESHOLD && branchPct >= COVERAGE_THRESHOLD;
  const reportPath = writeTestReport(
    repoRoot, activeFeature, testsPassed, testFailures,
    linePct, branchPct, filesBelow, excludedFiles, vitestOutputFull,
  );

  // Step 5 — Write FIX_PLAN.md if needed
  let fixPlanPath: string | null = null;
  if (!testsPassed || !coveragePass) {
    fixPlanPath = writeFixPlan(repoRoot, activeFeature, testFailures, linePct, branchPct, vitestOutputFull);
  }

  // Step 6 — Build summary
  const icon = (ok: boolean) => (ok ? '✓' : '✗');
  const pf = (ok: boolean, val?: string) => `${ok ? 'PASS' : 'FAIL'}${val ? ` (${val})` : ''}`;

  const archLines = archResults.map((r) => {
    if (r.status === 'new-hard-block') return `    ✗ ${r.component} — new file, not documented in ARCHITECTURE.md`;
    if (r.status === 'modified-not-documented') return `    ✗ ${r.component} — modified, not documented in ARCHITECTURE.md`;
    if (r.status === 'modified-warn') return `    ⚠ ${r.component} — documented; ARCHITECTURE.md not yet updated this session`;
    return `    ✓ ${r.component} — documented, ARCHITECTURE.md updated`;
  });

  const archWarnSection = warnArch.length > 0
    ? [
        '',
        'ARCHITECTURE.md FUNCTIONAL CHANGE DECLARATION REQUIRED:',
        ...warnArch.map((r) => `  - ${r.component} (${r.file})`),
        '',
        'For each file above, declare ONE of:',
        '  • "This change is FUNCTIONAL — I am updating _dev/ARCHITECTURE.md now."',
        '  • "This change is NON-FUNCTIONAL (no change to behaviour, usage, or output) — no update needed."',
        'You must make this declaration before closing the session.',
      ]
    : [];

  const allHardPassed = testsPassed && coveragePass && hardBlockArch.length === 0;

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
    '  ARCHITECTURE.md components:',
    ...archLines,
    ...archWarnSection,
    '',
    '───────────────────────────────────────────────────',
    allHardPassed ? 'ALL CHECKS PASSED' : 'BLOCKED — DO NOT MARK DONE',
    '───────────────────────────────────────────────────',
    '',
    ...(allHardPassed
      ? ['All checks passed. Feature implementation is complete.']
      : [
          ...(!testsPassed ? [`  ✗ Fix ${testFailures} failing test(s). See reports/${activeFeature}/FIX_PLAN.md`] : []),
          ...(linePct < COVERAGE_THRESHOLD ? [`  ✗ Line coverage ${linePct.toFixed(1)}% is below the ${COVERAGE_THRESHOLD}% threshold.`] : []),
          ...(branchPct < COVERAGE_THRESHOLD ? [`  ✗ Branch coverage ${branchPct.toFixed(1)}% is below the ${COVERAGE_THRESHOLD}% threshold.`] : []),
          ...hardBlockArch.map((r) =>
            r.status === 'new-hard-block'
              ? `  ✗ New file '${r.component}' must be documented in _dev/ARCHITECTURE.md.`
              : `  ✗ Modified file '${r.component}' is not documented in _dev/ARCHITECTURE.md.`,
          ),
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
