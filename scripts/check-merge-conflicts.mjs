import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const ROOT_DIR = process.cwd();
const IGNORE_DIRS = new Set(['node_modules', '.git', 'dist', 'build', '.builds']);
const VALID_EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx', '.json', '.md', '.css', '.html']);
const MARKERS = ['<<<<<<<', '=======', '>>>>>>>'];

const violations = [];

const walk = (dir) => {
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      if (!IGNORE_DIRS.has(entry)) {
        walk(fullPath);
      }
      continue;
    }

    const ext = extname(fullPath);
    if (!VALID_EXTENSIONS.has(ext)) continue;

    const content = readFileSync(fullPath, 'utf8');
    const lines = content.split(/\r?\n/);

    lines.forEach((line, index) => {
      if (MARKERS.some((marker) => line.startsWith(marker))) {
        violations.push(`${fullPath.replace(`${ROOT_DIR}/`, '')}:${index + 1} -> ${line.trim()}`);
      }
    });
  }
};

walk(ROOT_DIR);

if (violations.length > 0) {
  console.error('❌ Merge conflict markers detected:');
  violations.forEach((v) => console.error(`  - ${v}`));
  process.exit(1);
}

console.log('✅ No merge conflict markers detected');
