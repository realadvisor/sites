// The measured taste checks of `sites-kit screenshot` (TASTE.md section 3), each on a
// static page in test/taste/ that breaks one rule, plus a clean control page. Needs
// Playwright (an optional peer): skipped where it is not installed.
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { extname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const hasPlaywright = await import('playwright').then(() => true, () => false);
const dir = fileURLToPath(new URL('./taste/', import.meta.url));
const tool = fileURLToPath(new URL('../tools/screenshot.mjs', import.meta.url));
const types = { '.html': 'text/html; charset=utf-8', '.png': 'image/png' };

test('taste checks fire on their test pages and stay quiet on the control', { skip: !hasPlaywright && 'playwright not installed' }, async () => {
  const server = createServer((req, res) => {
    try {
      const body = readFileSync(join(dir, new URL(req.url, 'http://x').pathname.replace(/^\/+/, '')));
      res.writeHead(200, { 'content-type': types[extname(req.url)] ?? 'application/octet-stream' }).end(body);
    } catch {
      res.writeHead(404).end('not found');
    }
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const out = await mkdtemp(join(tmpdir(), 'taste-'));
  try {
    const url = `http://127.0.0.1:${server.address().port}`;
    // Async: the static server above runs in this process and must keep answering.
    const run = await new Promise((done) => execFile(process.execPath, [tool, '--url', url, '--out', out, '--jobs', '2', '/soft-photo.html', '/ledes.html', '/fonts.html', '/clean.html'], { timeout: 90000 }, (_e, stdout) => done({ stdout })));
    const report = JSON.parse(await readFile(join(out, 'report.json'), 'utf8'));
    const taste = (path) => report.find((r) => r.path === path).problems.filter((p) => p.includes('taste:'));
    assert.match(taste('/soft-photo.html').join('\n'), /\[1440\] taste: soft photo, "photo.png" file 400x300.*the hero/, run.stdout);
    assert.match(taste('/soft-photo.html').join('\n'), /\[390\] taste: soft photo/);
    assert.match(taste('/ledes.html').join('\n'), /section ledes in 2 styles: Georgia 20px 400 full .* \| Arial 17px 400 muted/);
    assert.match(taste('/fonts.html').join('\n'), /4 font families in use/);
    assert.match(taste('/fonts.html').join('\n'), /font "Never Loaded" is declared but never loaded/);
    assert.deepEqual(report.find((r) => r.path === '/clean.html').problems, []);
  } finally {
    server.close();
    await rm(out, { recursive: true, force: true });
  }
});
