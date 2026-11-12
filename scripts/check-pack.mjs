// Checks what npm would publish for each package: every `exports` target and
// `bin` is in the tarball, and no test file is. Runs `npm pack --dry-run`.
//
//   node scripts/check-pack.mjs
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const PACKAGES = ['sdk', 'kit-core', 'kit-astro', 'kit-react'];

const targetsOf = (pkg) => {
  const out = [];
  const walk = (v) => (typeof v === 'string' ? out.push(v) : Object.values(v ?? {}).forEach(walk));
  walk(pkg.exports);
  Object.values(pkg.bin ?? {}).forEach((b) => out.push(b));
  return out.map((t) => t.replace(/^\.\//, ''));
};

let failed = false;
for (const dir of PACKAGES) {
  const cwd = path.join(root, dir);
  const pkg = JSON.parse(readFileSync(path.join(cwd, 'package.json'), 'utf8'));
  const [pack] = JSON.parse(execFileSync('npm', ['pack', '--dry-run', '--json'], { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }));
  const files = pack.files.map((f) => f.path);
  const has = (t) => (t.includes('*') ? files.some((f) => f.startsWith(t.split('*')[0])) : files.includes(t));
  const missing = targetsOf(pkg).filter((t) => !has(t));
  const tests = files.filter((f) => /(^|\/)test\/|\.test\./.test(f));
  const problems = [...missing.map((t) => `missing ${t}`), ...tests.map((t) => `test file ${t}`)];
  if (problems.length) failed = true;
  console.log(`${pkg.name}@${pkg.version}: ${files.length} files, ${Math.round(pack.size / 1024)} kB${problems.length ? `\n  ${problems.join('\n  ')}` : ''}`);
}
process.exit(failed ? 1 : 0);
