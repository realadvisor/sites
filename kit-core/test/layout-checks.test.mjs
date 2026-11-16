// The layout checks of `sites-kit screenshot` (clipped text, card rows out of line, repeated
// images, motifs over photos, the primary CTA on the first screen), each on a static page in
// test/layout/: pages that break a rule and controls that must stay quiet. Images are one
// generated PNG served for every /img/ path. Needs Playwright (an optional peer): skipped
// where it is not installed.
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { deflateSync } from 'node:zlib';

const hasPlaywright = await import('playwright').then(() => true, () => false);
const dir = fileURLToPath(new URL('./layout/', import.meta.url));
const tool = fileURLToPath(new URL('../tools/screenshot.mjs', import.meta.url));

// A 64x48 grey PNG, built here so the fixtures need no binary files.
function png(w = 64, h = 48) {
  const crcTable = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
  const crc = (buf) => { let c = 0xffffffff; for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const chunk = (type, data) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type), data]);
    const c = Buffer.alloc(4); c.writeUInt32BE(crc(td));
    return Buffer.concat([len, td, c]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2;
  const raw = Buffer.alloc((w * 3 + 1) * h, 0x99);
  for (let y = 0; y < h; y++) raw[y * (w * 3 + 1)] = 0;
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
const PNG = png();

test('layout checks flag clipped text, misaligned card rows, repeated images, motifs over photos and a CTA below the fold, and stay quiet on the controls', { skip: !hasPlaywright && 'playwright not installed' }, async () => {
  const server = createServer((req, res) => {
    try {
      const path = new URL(req.url, 'http://x').pathname;
      if (path.startsWith('/img/')) return res.writeHead(200, { 'content-type': 'image/png' }).end(PNG);
      const body = readFileSync(join(dir, path.replace(/^\/+/, '')));
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }).end(body);
    } catch {
      res.writeHead(404).end('not found');
    }
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const out = await mkdtemp(join(tmpdir(), 'layout-'));
  try {
    const url = `http://127.0.0.1:${server.address().port}`;
    const pages = ['/clipped.html', '/cards-misaligned.html', '/cards-clean.html', '/clipped-on-purpose.html', '/units-plan.html', '/cta-below-fold.html', '/cta-first-screen.html', '/photos-repeated.html', '/photos-clean.html', '/motif-over-photo.html', '/motif-clean.html'];
    const run = await new Promise((done) => execFile(process.execPath, [tool, '--url', url, '--out', out, '--jobs', '4', ...pages], { timeout: 120000 }, (e, stdout) => done({ code: e?.code ?? 0, stdout })));
    const report = JSON.parse(await readFile(join(out, 'report.json'), 'utf8'));
    const layout = (path) => report.find((r) => r.path === path).problems.filter((p) => /clipped text|cards in one row|repeated image|motif over a photo|primary CTA/.test(p));

    const clipped = layout('/clipped.html').join('\n');
    assert.match(clipped, /\[1440\] clipped text "CHF 1’250’000" in span\.tag \(italic\): cut [\d.]+px on the right by span\.tag \(overflow: hidden\): italic needs padding-inline-end ≈0\.15em/, run.stdout);
    assert.match(clipped, /\[1800\] clipped text "CHF 890’000" in p\.card-price \(italic\): cut [\d.]+px on the right by li \(content-visibility: auto\), 3 times: remove content-visibility\/contain:paint/);
    for (const w of ['1440', '390', '1024', '1800']) assert.match(clipped, new RegExp(`\\[${w}\\] clipped text`), `checked at ${w}`);

    const rows = layout('/cards-misaligned.html').join('\n');
    assert.match(rows, /\[1440\] cards in one row not aligned: (heading|divider|price|last line) differs by \d+px \(ul\.grid, "Flat · Lausanne.*use grid-template-rows: subgrid/);
    assert.match(rows, /\[1024\] cards in one row not aligned/);
    // 390: one card per row, nothing to compare.
    assert.doesNotMatch(rows, /\[390\]/);

    const cta = layout('/cta-below-fold.html').join('\n');
    assert.match(cta, /\[390\] primary CTA not on the first screen: "Value my home" ends at y \d+, the screen is 844px tall/, run.stdout);
    assert.match(cta, /\[768\] primary CTA not on the first screen: "Value my home" ends at y \d+, the screen is 1024px tall/);
    assert.doesNotMatch(cta, /\[(1440|1024)\]/);

    const rep = layout('/photos-repeated.html').join('\n');
    assert.match(rep, /\[1440\] repeated image in a row: "Lot 2" in two cards side by side \(ul\.grid\.lots/);
    assert.match(rep, /\[1440\] repeated image in a grid: "Lot 4" in 3 of 6 cards \(ul\.grid\.more\)/);
    assert.doesNotMatch(rep, /repeated image in a row: "Lot [5-9]"/);

    const motif = layout('/motif-over-photo.html').join('\n');
    assert.match(motif, /\[1440\] decorative line or motif over a photo: svg\.ridge \(1440x80\) lies 100% on "Houses by the lake"/);
    assert.match(motif, /\[390\] decorative line or motif over a photo: div\[data-motif\] \(\d+x2\) lies 100% on "landscape\.png"/);

    for (const p of ['/cards-clean.html', '/clipped-on-purpose.html', '/units-plan.html', '/cta-first-screen.html', '/photos-clean.html', '/motif-clean.html']) assert.deepEqual(layout(p), [], p);
    assert.equal(run.code, 1, 'layout problems fail the command');
  } finally {
    server.close();
    await rm(out, { recursive: true, force: true });
  }
});
