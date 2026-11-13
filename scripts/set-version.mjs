// Sets one version on the four published packages (sdk, kit-core, kit-astro, kit-react) and
// the peer ranges between them. They are released together, from one tag.
//
//   node scripts/set-version.mjs 0.3.0   # then commit, tag v0.3.0, push the tag
//   node scripts/set-version.mjs --check v0.3.0   # CI: the tag matches every package
//   node scripts/set-version.mjs --check           # CI: the current version
//
// --check also needs a `## <version>` entry in kit-core/CHANGELOG.md.
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const PACKAGES = ['sdk', 'kit-core', 'kit-astro', 'kit-react'];
const OURS = ['@realadvisor/sites-sdk', '@realadvisor/sites-kit-core'];
const SEMVER = /^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/;

const file = (dir) => path.join(root, dir, 'package.json');
const read = (dir) => JSON.parse(readFileSync(file(dir), 'utf8'));

const [first, second] = process.argv.slice(2);

if (first === '--check') {
  const want = (second ?? read('kit-core').version).replace(/^v/, '');
  const wrong = PACKAGES.map((dir) => [dir, read(dir).version]).filter(([, v]) => v !== want);
  if (!SEMVER.test(want) || wrong.length) {
    console.error(`${second ?? want} does not match: ${wrong.map(([d, v]) => `${d} is ${v}`).join(', ') || 'not a version'}`);
    process.exit(1);
  }
  const changelog = readFileSync(path.join(root, 'kit-core', 'CHANGELOG.md'), 'utf8');
  if (!changelog.split('\n').includes(`## ${want}`)) {
    console.error(`kit-core/CHANGELOG.md has no "## ${want}" entry (see AGENTS.md)`);
    process.exit(1);
  }
  console.log(`all packages at ${want}, changelog entry found`);
} else {
  if (!SEMVER.test(first ?? '')) {
    console.error('usage: node scripts/set-version.mjs <x.y.z> | --check <tag>');
    process.exit(1);
  }
  for (const dir of PACKAGES) {
    const pkg = read(dir);
    pkg.version = first;
    for (const name of OURS) if (pkg.peerDependencies?.[name]) pkg.peerDependencies[name] = `^${first}`;
    writeFileSync(file(dir), JSON.stringify(pkg, null, 2) + '\n');
  }
  console.log(`set ${PACKAGES.join(', ')} to ${first}`);
}
