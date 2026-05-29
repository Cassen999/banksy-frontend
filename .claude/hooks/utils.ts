import * as fs from 'fs';
import * as path from 'path';

export function findRepoRoot(): string {
  let dir = process.cwd();
  while (true) {
    if (fs.existsSync(path.join(dir, 'package.json'))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) return process.cwd();
    dir = parent;
  }
}

export function findActiveFeature(repoRoot: string): string | null {
  const activeFeaturePath = path.join(repoRoot, 'plans', '.active-feature');

  if (fs.existsSync(activeFeaturePath)) {
    const value = fs.readFileSync(activeFeaturePath, 'utf-8').trim();
    if (value && fs.existsSync(path.join(repoRoot, 'plans', value))) {
      return value;
    }
  }

  process.stderr.write(
    'WARNING: plans/.active-feature not found or points to a missing folder. Falling back to most recently modified plan.\n',
  );

  const plansDir = path.join(repoRoot, 'plans');
  if (!fs.existsSync(plansDir)) return null;

  try {
    const candidates = fs
      .readdirSync(plansDir)
      .filter((name) => {
        if (name.startsWith('.')) return false;
        const fullPath = path.join(plansDir, name);
        try {
          return (
            fs.statSync(fullPath).isDirectory() &&
            fs.existsSync(path.join(fullPath, 'IMPLEMENTATION_PLAN.md'))
          );
        } catch {
          return false;
        }
      })
      .map((name) => ({
        name,
        mtime: fs.statSync(path.join(plansDir, name)).mtimeMs,
      }))
      .sort((a, b) => b.mtime - a.mtime);

    return candidates.length > 0 ? candidates[0].name : null;
  } catch {
    return null;
  }
}
