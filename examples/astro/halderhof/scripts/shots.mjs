#!/usr/bin/env node
/**
 * Full-page screenshots at 1440 and 390 of the given paths, plus console
 * errors and failed requests per page.
 *   node scripts/shots.mjs [--base http://localhost:4422] [--out .screenshots] /path /de/path ...
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); if (i < 0) return d; const v = args[i + 1]; args.splice(i, 2); return v; };
const base = opt('--base', 'http://localhost:4422');
const out = opt('--out', '.screenshots');
const widths = opt('--widths', '1440,390').split(',').map(Number);
mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
let problems = 0;
for (const w of widths) {
  const ctx = await browser.newContext({ viewport: { width: w, height: w > 500 ? 900 : 844 }, deviceScaleFactor: 1 });
  for (const p of args) {
    const page = await ctx.newPage();
    const errs = [];
    page.on('console', (m) => m.type() === 'error' && errs.push(`console: ${m.text()}`));
    page.on('pageerror', (e) => errs.push(`pageerror: ${e.message}`));
    page.on('requestfailed', (r) => errs.push(`failed: ${r.url()} ${r.failure()?.errorText}`));
    page.on('response', (r) => r.status() >= 400 && errs.push(`http ${r.status()}: ${r.url()}`));
    const res = await page.goto(base + p, { waitUntil: 'networkidle', timeout: 60000 }).catch((e) => (errs.push(String(e)), null));
    // Load lazy images.
    const scroll = () => page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); }
      window.scrollTo(0, 0);
    });
    await scroll().catch(async () => { await page.waitForLoadState('networkidle'); await scroll(); });
    await page.waitForTimeout(400);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    if (overflow > 0) errs.push(`horizontal overflow ${overflow}px`);
    const name = (p.replace(/^\/|\/$/g, '').replace(/[/?=&]/g, '_') || 'home') + `-${w}.png`;
    await page.screenshot({ path: `${out}/${name}`, fullPage: true });
    const status = res?.status();
    if (errs.length || (status && status >= 400 && !p.includes('missing'))) problems++;
    console.log(`${status ?? '---'} ${w} ${p}${errs.length ? `\n   ${errs.slice(0, 6).join('\n   ')}` : ''}`);
    await page.close();
  }
  await ctx.close();
}
await browser.close();
console.log(problems ? `${problems} page(s) with problems` : 'no problems');
