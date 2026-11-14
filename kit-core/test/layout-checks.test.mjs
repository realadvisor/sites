// The layout checks of `sites-kit screenshot` (clipped text, card rows out of line), each
// on a static page in test/layout/: two that break a rule and two controls that must stay
// quiet. Needs Playwright (an optional peer): skipped where it is not installed.
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const hasPlaywright = await import('playwright').then(() => true, () => false);
const dir = fileURLToPath(new URL('./layout/', import.meta.url));
const tool = fileURLToPath(new URL('../tools/screenshot.mjs', import.meta.url));

test('layout checks flag clipped text and misaligned card rows, and stay quiet on the controls', { skip: !hasPlaywright && 'playwright not installed' }, async () => {
  const server = createServer((req, res) => {
    try {
      const body = readFileSync(join(dir, new URL(req.url, 'http://x').pathname.replace(/^\/+/, '')));
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }).end(body);
    } catch {
      res.writeHead(404).end('not found');
    }
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const out = await mkdtemp(join(tmpdir(), 'layout-'));
  try {
    const url = `http://127.0.0.1:${server.address().port}`;
    const pages = ['/clipped.html', '/cards-misaligned.html', '/cards-clean.html', '/clipped-on-purpose.html'];
    const run = await new Promise((done) => execFile(process.execPath, [tool, '--url', url, '--out', out, '--jobs', '4', ...pages], { timeout: 120000 }, (e, stdout) => done({ code: e?.code ?? 0, stdout })));
    const report = JSON.parse(await readFile(join(out, 'report.json'), 'utf8'));
    const layout = (path) => report.find((r) => r.path === path).problems.filter((p) => /clipped text|cards in one row/.test(p));

    const clipped = layout('/clipped.html').join('\n');
    assert.match(clipped, /\[1440\] clipped text "CHF 1’250’000" in span\.tag \(italic\): cut [\d.]+px on the right by span\.tag \(overflow: hidden\): italic needs padding-inline-end ≈0\.15em/, run.stdout);
    assert.match(clipped, /\[1800\] clipped text "CHF 890’000" in p\.card-price \(italic\): cut [\d.]+px on the right by li \(content-visibility: auto\), 3 times: remove content-visibility\/contain:paint/);
    for (const w of ['1440', '390', '1024', '1800']) assert.match(clipped, new RegExp(`\\[${w}\\] clipped text`), `checked at ${w}`);

    const rows = layout('/cards-misaligned.html').join('\n');
    assert.match(rows, /\[1440\] cards in one row not aligned: (heading|divider|price|last line) differs by \d+px \(ul\.grid, "Flat · Lausanne.*use grid-template-rows: subgrid/);
    assert.match(rows, /\[1024\] cards in one row not aligned/);
    // 390: one card per row, nothing to compare.
    assert.doesNotMatch(rows, /\[390\]/);

    assert.deepEqual(layout('/cards-clean.html'), []);
    assert.deepEqual(layout('/clipped-on-purpose.html'), []);
    assert.equal(run.code, 1, 'layout problems fail the command');
  } finally {
    server.close();
    await rm(out, { recursive: true, force: true });
  }
});
