#!/usr/bin/env node
/**
 * Side by side with the Astro version: full-page screenshots of the same
 * paths on both sites at 1440 and 390, the share of differing pixels, the
 * page heights, console errors, and a side-by-side PNG (Astro | React | diff).
 *
 *   node scripts/compare.mjs [--astro http://127.0.0.1:4413] [--react http://127.0.0.1:4513] [--out screenshots/compare] /path ...
 */
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const args = process.argv.slice(2);
const opt = (k, d) => {
  const i = args.indexOf(k);
  if (i < 0) return d;
  const v = args[i + 1];
  args.splice(i, 2);
  return v;
};
const astro = opt('--astro', 'http://127.0.0.1:4413');
const react = opt('--react', 'http://127.0.0.1:4513');
const out = opt('--out', 'screenshots/compare');
const widths = opt('--widths', '1440,390').split(',').map(Number);
mkdirSync(out, { recursive: true });
const browser = await chromium.launch();

async function shot(ctx, url) {
  const page = await ctx.newPage();
  const errs = [];
  page.on('console', (m) => m.type() === 'error' && errs.push(m.text().slice(0, 160)));
  page.on('pageerror', (e) => errs.push(`pageerror: ${e.message}`));
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 500) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 50));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
  // No animation or caret differences.
  await page.addStyleTag({ content: '*{transition:none!important;animation:none!important;caret-color:transparent!important}' });
  const png = await page.screenshot({ fullPage: true });
  await page.close();
  return { png, errs };
}

const cmp = await browser.newPage();
const rows = [];
for (const w of widths) {
  const ctx = await browser.newContext({ viewport: { width: w, height: w > 500 ? 900 : 844 }, deviceScaleFactor: 1, ...(w < 500 ? { isMobile: true, hasTouch: true } : {}) });
  for (const p of args) {
    const [a, r] = [await shot(ctx, astro + p), await shot(ctx, react + p)];
    const name = `${(p.replace(/^\/|\/$/g, '').replace(/[/?=&]/g, '_') || 'home').slice(0, 60)}-${w}`;
    const res = await cmp.evaluate(async ({ a, r }) => {
      const load = async (b64) => {
        const im = new Image();
        im.src = `data:image/png;base64,${b64}`;
        await im.decode();
        return im;
      };
      const [ia, ir] = [await load(a), await load(r)];
      const W = ia.naturalWidth;
      const H = Math.max(ia.naturalHeight, ir.naturalHeight);
      const c = document.createElement('canvas');
      c.width = W * 3;
      c.height = H;
      const g = c.getContext('2d');
      g.fillStyle = '#f0f';
      g.fillRect(0, 0, c.width, H);
      g.drawImage(ia, 0, 0);
      g.drawImage(ir, W, 0);
      const da = g.getImageData(0, 0, W, H).data;
      const dr = g.getImageData(W, 0, W, H).data;
      const diff = g.createImageData(W, H);
      let n = 0;
      for (let i = 0; i < da.length; i += 4) {
        const d = Math.abs(da[i] - dr[i]) + Math.abs(da[i + 1] - dr[i + 1]) + Math.abs(da[i + 2] - dr[i + 2]);
        const on = d > 48;
        if (on) n++;
        diff.data[i] = on ? 255 : da[i] * 0.3 + 170;
        diff.data[i + 1] = on ? 0 : da[i + 1] * 0.3 + 170;
        diff.data[i + 2] = on ? 0 : da[i + 2] * 0.3 + 170;
        diff.data[i + 3] = 255;
      }
      g.putImageData(diff, W * 2, 0);
      // First differing row: where to look.
      let first = -1;
      for (let y = 0; y < H && first < 0; y++) for (let x = 0; x < W; x++) {
        const i = (y * W + x) * 4;
        if (Math.abs(da[i] - dr[i]) + Math.abs(da[i + 1] - dr[i + 1]) + Math.abs(da[i + 2] - dr[i + 2]) > 48) { first = y; break; }
      }
      return { ratio: n / (W * H), ha: ia.naturalHeight, hr: ir.naturalHeight, first, png: c.toDataURL('image/png').split(',')[1] };
    }, { a: a.png.toString('base64'), r: r.png.toString('base64') });
    writeFileSync(`${out}/${name}.png`, Buffer.from(res.png, 'base64'));
    const row = { path: p, width: w, diff: +(res.ratio * 100).toFixed(2), heightAstro: res.ha, heightReact: res.hr, firstDiffY: res.first, errorsAstro: a.errs, errorsReact: r.errs };
    rows.push(row);
    console.log(`${String(row.diff).padStart(6)}%  ${w}  ${p}  h ${res.ha}/${res.hr}  first diff y=${res.first}${r.errs.length ? `  REACT ERRORS: ${r.errs.join(' | ')}` : ''}`);
  }
  await ctx.close();
}
writeFileSync(`${out}/report.json`, JSON.stringify(rows, null, 2));
await browser.close();
