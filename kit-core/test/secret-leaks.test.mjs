import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, test } from 'node:test';
import { buildLeaks, leakIn, servedLeak } from '../tools/secret-leaks.mjs';

const CHECK_DEPLOY = fileURLToPath(new URL('../tools/check-deploy.mjs', import.meta.url));
// The shape packages/api-keys mints: ra_<live|test>_ + 32 bytes base64url.
const KEY = `ra_test_${'A1b2C3d4-_'.repeat(4)}xyz`;

/** A built site (dist/) with `files` in it. */
const site = (files) => {
  const root = mkdtempSync(join(tmpdir(), 'leak-'));
  for (const [path, text] of Object.entries({ '_worker.js/index.js': 'export default {}', ...files })) {
    mkdirSync(join(root, 'dist', path, '..'), { recursive: true });
    writeFileSync(join(root, 'dist', path), text);
  }
  return root;
};

describe('secret leaks', () => {
  test('a placeholder or a site key leaks, never repeating the key', () => {
    assert.match(leakIn('const k = "ra-secret:MAPS_KEY";'), /ra-secret:MAPS_KEY/);
    const m = leakIn(`Bearer ${KEY}`);
    assert.match(m, /site key \(ra_test_…\)/);
    assert.ok(!m.includes(KEY));
    assert.equal(leakIn('<p>no secret here, ra_test_short</p>'), null);
    assert.equal(leakIn(`x${KEY}`), null, 'only a whole key');
  });

  test('every file of the build is scanned', () => {
    const root = site({ 'index.html': '<p>ok</p>', '_astro/app.js': 'fetch(u,{headers:{a:"ra-secret:X"}})', 'data.json': `{"k":"${KEY}"}` });
    assert.deepEqual(buildLeaks(join(root, 'dist')).map((l) => l.file).sort(), ['_astro/app.js', 'data.json']);
  });

  test('check:deploy fails on a build containing ra-secret:', () => {
    const root = site({ 'index.html': '<script type="application/json">{"token":"ra-secret:SITES_API_KEY"}</script>' });
    const r = spawnSync(process.execPath, [CHECK_DEPLOY, '--no-build'], { cwd: root, encoding: 'utf8', timeout: 30_000 });
    assert.equal(r.status, 1, r.stdout + r.stderr);
    const summary = JSON.parse(r.stdout.trim().split('\n').pop());
    assert.equal(summary.ok, false);
    assert.deepEqual(summary.problems.map((p) => [p.page, p.rule]), [['dist/index.html', 'secret-leak']]);
  });

  test('check:quality fails on a page that prints one (servedLeak, run on every response)', () => {
    const base = 'http://127.0.0.1:8788';
    assert.match(servedLeak({ url: `${base}/contact`, contentType: 'text/html; charset=utf-8', text: '<p>ra-secret:MAPS_KEY</p>', base }), /^\/contact .*ra-secret:MAPS_KEY/);
    assert.match(servedLeak({ url: `${base}/_astro/a.js`, contentType: 'text/javascript', text: `"${KEY}"`, base }), /^\/_astro\/a\.js .*site key/);
    assert.match(servedLeak({ url: `${base}/api/x`, contentType: 'application/json', text: '{"k":"ra-secret:A"}', base }), /^\/api\/x /);
    assert.equal(servedLeak({ url: `${base}/`, contentType: 'text/html', text: '<p>fine</p>', base }), null);
    assert.equal(servedLeak({ url: 'https://tile.openstreetmap.org/a.js', contentType: 'text/javascript', text: 'ra-secret:A', base }), null, 'not the site');
    assert.equal(servedLeak({ url: `${base}/logo.png`, contentType: 'image/png', text: 'ra-secret:A', base }), null, 'not a page, script or JSON');
  });
});
