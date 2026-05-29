import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { findRepoRoot, findActiveFeature } from './utils.js';

const STOP_WORDS = new Set(['stop', 'stop.', 'stop!', 'cancel', 'halt', 'cancel.', 'halt.']);

const APPROVAL_KEYWORDS = [
  'approved', 'approve', 'lgtm', 'looks good', 'go ahead', 'proceed',
  'ship it', 'good to go', 'confirmed', 'confirm', 'happy with',
  'commence', 'start implementation', 'begin implementation',
  'start coding', 'begin coding', 'you may',
];

const PLAN_DOCS = ['IMPLEMENTATION_PLAN.md', 'TEST_PLAN.md', 'DIAGRAMS.md'];

const TEST_SKIP_PATTERNS = [
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

const TEST_SKIP_DIRS = ['src/types', 'src/assets', 'src/styles', 'src/mocks', 'src/test'];

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
            .filter((b) => b.type === 'text')
            .map((b) => b.text ?? '')
            .join(' ');
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

// Scan the last 5 user messages for approval keywords
function hasApproval(messages: string[]): boolean {
  return messages.slice(-5).some((m) =>
    APPROVAL_KEYWORDS.some((kw) => m.toLowerCase().includes(kw)),
  );
}

function getGitChangedFiles(repoRoot: string): string[] {
  try {
    const staged = execSync('git diff --cached --name-only', { cwd: repoRoot }).toString().split('\n');
    const unstaged = execSync('git diff --name-only', { cwd: repoRoot }).toString().split('\n');
    return [...new Set([...staged, ...unstaged])].filter(Boolean);
  } catch {
    return [];
  }
}

function shouldSkipTestGate(filePath: string, repoRoot: string): boolean {
  const relative = path.relative(repoRoot, filePath);
  if (TEST_SKIP_DIRS.some((d) => relative.startsWith(d + '/') || relative.startsWith(d + path.sep))) return true;
  const basename = path.basename(filePath);
  return TEST_SKIP_PATTERNS.some((re) => re.test(basename) || re.test(relative));
}

function testFileExistsAndIsReal(testPath: string): boolean {
  if (!fs.existsSync(testPath)) return false;
  try {
    return /\bit\(|\btest\(|\bdescribe\(/.test(fs.readFileSync(testPath, 'utf-8'));
  } catch {
    return false;
  }
}

function main() {
  let input: {
    tool_input?: { file_path?: string; path?: string };
    transcript_path?: string;
  };

  try {
    input = JSON.parse(readStdin());
  } catch (e) {
    process.stderr.write(`enforce_during_implementation: failed to parse stdin JSON: ${e}\n`);
    process.exit(2);
  }

  const filePath = input.tool_input?.file_path || input.tool_input?.path || '';
  const transcriptPath = input.transcript_path || '';
  const userMessages = extractUserMessages(transcriptPath);

  // Emergency brake
  if (isEmergencyStop(userMessages)) process.exit(0);

  if (!filePath) process.exit(0);

  const repoRoot = findRepoRoot();
  const relPath = path.relative(repoRoot, filePath);

  // Gate 0a — Allow plan files (and clear .approved if a plan doc is being modified)
  if (relPath.startsWith('plans/') || relPath.startsWith('plans' + path.sep)) {
    const basename = path.basename(filePath);
    if (PLAN_DOCS.includes(basename)) {
      // Clear approval marker so revised plans require re-approval
      const parts = relPath.split(/[\\/]/);
      if (parts.length >= 2) {
        const approvedPath = path.join(repoRoot, 'plans', parts[1], '.approved');
        if (fs.existsSync(approvedPath)) {
          try { fs.unlinkSync(approvedPath); } catch { }
        }
      }
    }
    process.exit(0);
  }

  // Gate 0b — Allow all markdown files freely
  if (filePath.endsWith('.md')) process.exit(0);

  // Gate 1 — Active feature must exist
  const activeFeature = findActiveFeature(repoRoot);
  if (!activeFeature) {
    process.stderr.write([
      'BLOCKED — NO ACTIVE FEATURE',
      '  plans/.active-feature does not exist or points to a missing folder.',
      '  Create plans/.active-feature containing your current feature name,',
      '  then create the three required plan documents before writing any code.',
      '',
    ].join('\n'));
    process.exit(2);
  }

  // Gate 2 — All three plan documents must exist
  const featureDir = path.join(repoRoot, 'plans', activeFeature);
  const missingDocs = PLAN_DOCS.filter((doc) => !fs.existsSync(path.join(featureDir, doc)));
  if (missingDocs.length > 0) {
    process.stderr.write([
      `BLOCKED — MISSING PLAN DOCUMENTS for '${activeFeature}'`,
      '  Missing:',
      ...missingDocs.map((d) => `    - plans/${activeFeature}/${d}`),
      '',
      '  Create all required plan documents before writing any code.',
      '',
    ].join('\n'));
    process.exit(2);
  }

  // Gate 3 — User must have explicitly approved the plans
  const approvedMarkerPath = path.join(featureDir, '.approved');
  if (!fs.existsSync(approvedMarkerPath)) {
    if (hasApproval(userMessages)) {
      try { fs.writeFileSync(approvedMarkerPath, new Date().toISOString()); } catch { }
    } else {
      process.stderr.write([
        `BLOCKED — WAITING FOR USER APPROVAL`,
        `  All three plan documents exist for '${activeFeature}' but the user has not yet`,
        '  explicitly approved them.',
        '',
        '  Present the contents of:',
        `    plans/${activeFeature}/IMPLEMENTATION_PLAN.md`,
        `    plans/${activeFeature}/TEST_PLAN.md`,
        `    plans/${activeFeature}/DIAGRAMS.md`,
        '',
        '  Then stop and wait. Do NOT write any code until the user responds',
        '  with one of: approved, lgtm, looks good, go ahead, proceed,',
        '  ship it, good to go, confirmed.',
        '',
      ].join('\n'));
      process.exit(2);
    }
  }

  // Gate 4 — Co-located test file for .ts/.tsx files under src/
  const isSrcFile = relPath.startsWith('src/') || relPath.startsWith('src' + path.sep);
  const isTsFile = /\.(ts|tsx)$/.test(filePath);
  const isTestFile = /\.(test|spec)\.(ts|tsx)$/.test(filePath);

  if (isSrcFile && isTsFile && !isTestFile && !shouldSkipTestGate(filePath, repoRoot)) {
    const ext = filePath.endsWith('.tsx') ? '.tsx' : '.ts';
    const baseName = path.basename(filePath, ext);
    const expectedTestPath = path.join(path.dirname(filePath), `${baseName}.test${ext}`);
    const relExpected = path.relative(repoRoot, expectedTestPath);
    const fileAlreadyExists = fs.existsSync(filePath);

    if (!testFileExistsAndIsReal(expectedTestPath)) {
      if (!fileAlreadyExists) {
        process.stderr.write([
          `BLOCKED: You are creating ${relPath} without a co-located test file.`,
          `  Expected: ${relExpected}`,
          '',
          `  Write ${relExpected} first, then return to this file.`,
          '',
        ].join('\n'));
      } else {
        process.stderr.write([
          `BLOCKED: You are modifying ${relPath} but its co-located test file does not exist.`,
          `  Expected: ${relExpected}`,
          '',
          `  Create ${relExpected} before modifying this file.`,
          '',
        ].join('\n'));
      }
      process.exit(2);
    }

    // Soft warning — test file exists but has not been modified in this git session
    const changedFiles = getGitChangedFiles(repoRoot);
    const normalised = (f: string) => f.replace(/\\/g, '/');
    if (!changedFiles.some((f) => normalised(f) === normalised(relExpected))) {
      const warning = [
        `REMINDER: You are modifying ${path.basename(filePath)}. Its existing tests must also be`,
        `reviewed and updated if behaviour has changed. Ensure ${path.basename(expectedTestPath)} reflects this change.`,
      ].join('\n');
      process.stdout.write(JSON.stringify({ additionalContext: warning }));
      process.exit(0);
    }
  }

  process.exit(0);
}

try {
  main();
} catch (e) {
  process.stderr.write(`enforce_during_implementation: unexpected error: ${e}\n`);
  process.exit(2);
}
