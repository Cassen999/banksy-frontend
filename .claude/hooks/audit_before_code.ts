import * as fs from 'fs';
import * as path from 'path';
import { findRepoRoot, findActiveFeature } from './utils.js';

const STOP_WORDS = new Set(['stop', 'stop.', 'stop!', 'cancel', 'halt', 'cancel.', 'halt.']);

// Synced with settings.json matcher — always keep both lists identical
const TRIGGER_KEYWORDS = [
  'component', 'hook', 'store', 'context', 'route', 'page', 'layout',
  'service', 'fetch', 'api', 'feature', 'create', 'build', 'write',
  'implement', 'add', 'fix', 'update', 'refactor', 'complete', 'make',
  'code', 'type', 'interface', 'util', 'helper', 'form', 'modal', 'view',
  'table', 'list', 'card', 'button', 'input', 'action', 'reducer', 'slice',
  'provider', 'plan', 'plans', 'planning',
];

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

function scanStateFiles(repoRoot: string): string {
  const srcDir = path.join(repoRoot, 'src');
  if (!fs.existsSync(srcDir)) return 'No src/ directory found.';

  const statePathRe = /store|Store|context|Context|slice|Slice|reducer|Reducer|Provider|provider/;
  const stateContentRe = /createContext|createStore|createSlice|useReducer|atom\(/;
  const exportRe = /export\s+(?:const|function|default|type|interface)\s+(\w+)/g;

  const found: Array<{ filePath: string; exports: string[] }> = [];

  function walk(dir: string) {
    let entries: string[];
    try { entries = fs.readdirSync(dir); } catch { return; }

    for (const entry of entries) {
      const fullPath = path.join(dir, entry);
      let stat: fs.Stats;
      try { stat = fs.statSync(fullPath); } catch { continue; }

      if (stat.isDirectory()) { walk(fullPath); continue; }
      if (!/\.(ts|tsx)$/.test(entry)) continue;

      const relativePath = path.relative(repoRoot, fullPath);
      let content: string;
      try { content = fs.readFileSync(fullPath, 'utf-8'); } catch { continue; }

      if (!statePathRe.test(relativePath) && !stateContentRe.test(content)) continue;

      const exports: string[] = [];
      let m: RegExpExecArray | null;
      const re = new RegExp(exportRe.source, 'g');
      while ((m = re.exec(content)) !== null) exports.push(m[1]);

      found.push({ filePath: relativePath, exports });
    }
  }

  walk(srcDir);

  if (found.length === 0) return 'No shared state files found in src/.';

  let table = '| File | Exports |\n|------|---------|';
  for (const { filePath, exports } of found) {
    table += `\n| ${filePath} | ${exports.join(', ') || '(none detected)'} |`;
  }
  return table;
}

function main() {
  let input: { prompt?: string };
  try {
    input = JSON.parse(readStdin());
  } catch (e) {
    process.stderr.write(`audit_before_code: failed to parse stdin JSON: ${e}\n`);
    process.exit(2);
  }

  const prompt = (input.prompt || '').trim();

  // Emergency brake
  if (STOP_WORDS.has(prompt.toLowerCase())) process.exit(0);

  // Keyword filter
  const lower = prompt.toLowerCase();
  if (!TRIGGER_KEYWORDS.some((kw) => lower.includes(kw))) process.exit(0);

  const repoRoot = findRepoRoot();
  const activeFeature = findActiveFeature(repoRoot);

  // Audit 1 — Architecture
  let architectureContent = '';
  for (const p of [
    path.join(repoRoot, '_dev', 'ARCHITECTURE.md'),
    path.join(repoRoot, 'ARCHITECTURE.md'),
    path.join(repoRoot, 'documentation', 'ARCHITECTURE.md'),
  ]) {
    if (fs.existsSync(p)) {
      architectureContent = fs.readFileSync(p, 'utf-8').slice(0, 8000);
      break;
    }
  }
  const architectureSection = architectureContent
    || '⚠️  WARNING: No ARCHITECTURE.md found. Create _dev/ARCHITECTURE.md before writing implementation code.';

  // Audit 2 — State
  const stateSection = scanStateFiles(repoRoot);

  // Audit 3 — Feature plans (soft warning only — no hard-block)
  let plansSection: string;
  if (!activeFeature) {
    plansSection = [
      '⚠️  NO ACTIVE FEATURE',
      '',
      'plans/.active-feature is missing or points to a non-existent folder.',
      '',
      'You may freely create and edit markdown files and plan documents.',
      'To set up a new feature:',
      '  1. Create plans/<feature-name>/ directory',
      '  2. Write plans/.active-feature containing the folder name',
      '  3. Create plans/<feature-name>/IMPLEMENTATION_PLAN.md',
      '  4. Create plans/<feature-name>/TEST_PLAN.md',
      '  5. Create plans/<feature-name>/DIAGRAMS.md',
      '',
      'No implementation code (.ts/.tsx under src/) until all plan documents exist and are approved.',
    ].join('\n');
  } else {
    const featureDir = path.join(repoRoot, 'plans', activeFeature);
    const requiredDocs = ['IMPLEMENTATION_PLAN.md', 'TEST_PLAN.md', 'DIAGRAMS.md'];
    const missing = requiredDocs.filter((doc) => !fs.existsSync(path.join(featureDir, doc)));
    const isApproved = fs.existsSync(path.join(featureDir, '.approved'));

    const lines = [
      `Active feature: ${activeFeature}`,
      `Approval status: ${isApproved ? '✓ APPROVED' : '⏳ PENDING APPROVAL'}`,
      '',
      'Plan document status:',
      ...requiredDocs.map((doc) => `  ${missing.includes(doc) ? '✗' : '✓'} ${doc}`),
    ];

    if (missing.length > 0) {
      lines.push(
        '',
        `⚠️  Missing: ${missing.join(', ')}. Create these before writing any implementation code.`,
      );
    }

    plansSection = lines.join('\n');
  }

  const context = [
    '═══════════════════════════════════════════════════',
    'MANDATORY PRE-CODE AUDIT — DO NOT SKIP',
    '═══════════════════════════════════════════════════',
    '',
    'Before writing any code you must complete all three audits below',
    'and deliver the required report. Implementation code is strictly',
    'forbidden until all three audits are complete, all three plan',
    'documents exist, and the user has confirmed how to proceed.',
    '',
    '───────────────────────────────────────────────────',
    'AUDIT 1 OF 3: ARCHITECTURE',
    '───────────────────────────────────────────────────',
    architectureSection,
    '',
    '───────────────────────────────────────────────────',
    'AUDIT 2 OF 3: STATE / STORE',
    '───────────────────────────────────────────────────',
    stateSection,
    '',
    '───────────────────────────────────────────────────',
    'AUDIT 3 OF 3: FEATURE PLANS',
    '───────────────────────────────────────────────────',
    plansSection,
    '',
    '───────────────────────────────────────────────────',
    'REQUIRED REPORT FORMAT',
    '───────────────────────────────────────────────────',
    '',
    'Respond with this structure. No implementation code until step 4 is confirmed.',
    '',
    'ARCHITECTURE AUDIT',
    '  Overlap found: YES / NO / PARTIAL',
    '  If yes or partial: list every affected component, hook, service, or',
    '  utility with file paths if known.',
    '',
    'STATE AUDIT',
    '  Overlap found: YES / NO / PARTIAL',
    '  If yes or partial: list every store, context, slice, or hook that',
    '  already handles or could handle the requested state.',
    '',
    'PLAN AUDIT',
    '  Feature name: <the kebab-case name you have chosen>',
    '  Plan status: COMPLETE / INCOMPLETE / NOT STARTED',
    '  If incomplete or not started: list exactly which documents are missing',
    '  and confirm you will create them now.',
    '',
    'RECOMMENDATION',
    '  One of:',
    '  A) Extend existing code/state — describe what to modify',
    '  B) New code/state justified — explain why it is warranted',
    '  C) Refactor recommended — describe the unified approach',
    '',
    'DECISION REQUIRED',
    '  If plans are missing: "I will now create the missing plan documents.',
    '  Please review them before I write any code."',
    '  If plans are complete: "Plans confirmed. Please confirm option A, B,',
    '  or C and I will begin implementation."',
    '',
    '═══════════════════════════════════════════════════',
  ].join('\n');

  process.stdout.write(JSON.stringify({ additionalContext: context }));
  process.exit(0);
}

try {
  main();
} catch (e) {
  process.stderr.write(`audit_before_code: unexpected error: ${e}\n`);
  process.exit(2);
}
