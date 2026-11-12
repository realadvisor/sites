#!/usr/bin/env node
/**
 * The kit's tools, run from the site root (`pnpm kit <command>` or the
 * site's package scripts). Every tool lives in the package, never in the
 * site: a site always runs the kit's current version.
 *
 *   sites-kit fixture [name | file.json] [--if-empty]   sample data into src/data/
 *   sites-kit screenshot [paths...] [options]           screenshots (your eyes)
 *   sites-kit check deploy [--no-build]                 the deploy gate (pnpm check:deploy)
 *   sites-kit test map [--url ...] [--path ...]         browser test of the listings map
 */
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const TOOLS = {
  fixture: 'use-fixture.mjs',
  screenshot: 'screenshot.mjs',
  'check deploy': 'check-deploy.mjs',
  'test map': 'search-map-test.mjs',
};

const [first, second, ...rest] = process.argv.slice(2);
const two = `${first} ${second}`;
const [tool, args] = TOOLS[two] ? [TOOLS[two], rest] : TOOLS[first] ? [TOOLS[first], [second, ...rest].filter((a) => a !== undefined)] : [null, []];
if (!tool) {
  const usage = Object.keys(TOOLS).map((k) => `  sites-kit ${k}`).join('\n');
  console.error(`${first ? `Unknown command: ${[first, second].filter(Boolean).join(' ')}\n` : ''}Commands:\n${usage}`);
  process.exit(first ? 2 : 0);
}
const script = fileURLToPath(new URL(`../tools/${tool}`, import.meta.url));
const run = spawnSync(process.execPath, [script, ...args], { stdio: 'inherit' });
process.exit(run.status ?? 1);
