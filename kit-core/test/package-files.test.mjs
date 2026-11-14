// Every kit file a site or a kit tool reads must ship in the npm package:
// sites install the published kit, so a file left out of `files` is missing
// there even though it exists in this repo.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const root = fileURLToPath(new URL('..', import.meta.url));
const packed = new Set(
  JSON.parse(execFileSync('npm', ['pack', '--dry-run', '--json', '--ignore-scripts'], { cwd: root, encoding: 'utf8' }))[0].files.map(
    (f) => f.path,
  ),
);

test('ships the rules a site CLAUDE.md imports', () => {
  for (const f of ['AGENTS.md', 'DESIGN.md', 'TASTE.md', 'CHANGELOG.md']) assert.ok(packed.has(f), f);
});

test('ships every file the kit tools read from the kit itself', () => {
  for (const dir of ['tools', 'bin', 'lib']) {
    for (const name of readdirSync(new URL(`../${dir}/`, import.meta.url), { recursive: true })) {
      if (!/\.(m?js|ts)$/.test(name)) continue;
      const src = readFileSync(new URL(`../${dir}/${name}`, import.meta.url), 'utf8');
      for (const [, rel] of src.matchAll(/here\('\.\.\/([^']+)'\)/g)) assert.ok(packed.has(rel), `${dir}/${name} reads ${rel}`);
      for (const [, rel] of src.matchAll(/new URL\('\.\.\/([^']+\/)', import\.meta\.url\)/g))
        assert.ok([...packed].some((p) => p.startsWith(rel)), `${dir}/${name} reads ${rel}`);
    }
  }
});

test("ships every file the starters' CLAUDE.md imports, in each kit package", () => {
  const repo = new URL('../../', import.meta.url);
  const packs = new Map();
  const filesOf = (pkg) => {
    if (!packs.has(pkg)) {
      const out = execFileSync('npm', ['pack', '--dry-run', '--json', '--ignore-scripts'], {
        cwd: fileURLToPath(new URL(`${pkg}/`, repo)),
        encoding: 'utf8',
      });
      packs.set(pkg, new Set(JSON.parse(out)[0].files.map((f) => f.path)));
    }
    return packs.get(pkg);
  };
  for (const starter of ['template', 'template-astro']) {
    const md = readFileSync(new URL(`${starter}/CLAUDE.md`, repo), 'utf8');
    for (const [, pkg, file] of md.matchAll(/@node_modules\/@realadvisor\/sites-([a-z-]+)\/(\S+)/g)) {
      assert.ok(filesOf(pkg).has(file), `${starter}/CLAUDE.md imports ${pkg}/${file}, which the package does not ship`);
    }
  }
});
