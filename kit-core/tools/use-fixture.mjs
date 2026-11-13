#!/usr/bin/env node
/**
 * Put a fixture in the site's data folder for fixture mode (used when
 * SITES_API_KEY is unset): src/data/ on an Astro site, app/data/fixture.json
 * on a React Router site (react-router.config.ts at the root; its
 * data.server.ts imports that one file).
 *   pnpm fixture                     # the kit's demo-agency.json (the fictional Demo Agency)
 *   pnpm fixture demo-agency         # same
 *   pnpm fixture path/to/file.json
 *   sites-kit fixture --if-empty     # runs before dev/check/build; no-op if src/data has a fixture
 *
 * The kit's only sample data is Demo Agency: invented names, example.com
 * emails, +41 00 000 00 0x phones. The retired names of older sample
 * fixtures (jan-skubincan, rockwell, phoenix-real-estate: real agencies)
 * still resolve, to Demo Agency, saved under the requested name so
 * SITES_FIXTURE=<name> keeps working.
 */
import { copyFile, mkdir, readdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const FIXTURES = fileURLToPath(new URL('../fixtures/', import.meta.url));

const DEMO = 'demo-agency';
const RETIRED = new Set(['jan-skubincan', 'rockwell', 'phoenix-real-estate']);

const ifEmpty = process.argv.includes('--if-empty');
const arg = process.argv.slice(2).find((a) => !a.startsWith('--')) ?? process.env.SITES_FIXTURE;
const react = ['ts', 'mts', 'js', 'mjs'].some((x) => existsSync(`react-router.config.${x}`));
const DIR = react ? 'app/data' : 'src/data';
await mkdir(DIR, { recursive: true });
const current = (await readdir(DIR)).filter((f) => f.endsWith('.json'));
if (ifEmpty && current.length) process.exit(0);

const named = (name) => [`${FIXTURES}${name}.json`].find(existsSync);
let src;
let dest;
if (arg && RETIRED.has(arg) && !named(arg)) {
  src = named(DEMO);
  dest = `${arg}.json`;
  if (src) console.warn(`Fixture ${arg} is retired: using the fictional Demo Agency (${DEMO}.json) as ${DIR}/${dest}`);
} else if (arg) {
  src = arg.endsWith('.json') ? [arg].find(existsSync) : named(arg);
} else {
  src = named(DEMO);
  if (!src) {
    const all = (await readdir(FIXTURES)).filter((f) => f.endsWith('.json') && !f.startsWith('development-')).sort();
    if (all.length) src = `${FIXTURES}${all[0]}`;
  }
}
if (!src) {
  if (ifEmpty) process.exit(0); // live mode (SITES_API_KEY) needs no fixture
  console.error(`Fixture not found (${arg ?? `${FIXTURES}${DEMO}.json`})`);
  process.exit(1);
}
for (const f of current) await rm(`${DIR}/${f}`);
dest = react ? 'fixture.json' : (dest ?? basename(src));
await copyFile(src, `${DIR}/${dest}`);
console.log(`Fixture mode uses ${DIR}/${dest}`);
