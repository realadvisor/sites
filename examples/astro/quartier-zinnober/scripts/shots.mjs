#!/usr/bin/env node
// Full-page screenshots of every page type at 1440 and 390, with console
// errors, failed requests and horizontal overflow per page.
//   node scripts/shots.mjs [base=http://localhost:4415] [only-substring]
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';

const base = process.argv[2] ?? 'http://localhost:4415';
const only = process.argv[3];
const out = new URL('../.screenshots/', import.meta.url).pathname;
mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
const ctx0 = await browser.newContext();
const p0 = await ctx0.newPage();
await p0.goto(`${base}/wohnungen`);
const unitHrefs = await p0.$$eval('a.row-link', (as) => as.map((a) => a.getAttribute('href')));
const rows = await p0.$$eval('tr[data-row]', (trs) => trs.map((t) => ({ s: t.dataset.status, h: t.querySelector('a')?.getAttribute('href') })));
await ctx0.close();
const free = rows.find((r) => r.s === 'available')?.h;
const reserved = rows.find((r) => r.s === 'reserved')?.h;
const let_ = rows.find((r) => r.s === 'sold')?.h;

const PAGES = [
  ['home', '/'],
  ['wohnungen', '/wohnungen'],
  ['wohnungen-b-frei', '/wohnungen?haus=B&frei=1'],
  ['unit-free', free],
  ['unit-reserved', reserved],
  ['unit-let', let_],
  ['kontakt', '/kontakt'],
  ['lage', '/lage'],
  ['galerie', '/galerie'],
  ['dokumente', '/dokumente'],
  ['news', '/news'],
  ['legal', '/legal'],
  ['privacy', '/privacy'],
  ['404', '/gibt-es-nicht'],
].filter(([n, p]) => p && (!only || n.includes(only)));

const report = [];
for (const [name, path] of PAGES) {
  for (const w of [1440, 390]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: w === 390 ? 844 : 900 }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    const errors = [];
    page.on('console', (m) => m.type() === 'error' && errors.push(`console: ${m.text()}`));
    page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
    page.on('requestfailed', (r) => errors.push(`failed: ${r.url().slice(0, 100)} ${r.failure()?.errorText}`));
    page.on('response', (r) => r.status() >= 400 && !r.url().endsWith('/gibt-es-nicht') && errors.push(`http ${r.status()}: ${r.url().slice(0, 100)}`));
    const res = await page.goto(`${base}${path}`, { waitUntil: 'networkidle' });
    // Load lazy images before the full-page shot.
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); }
      window.scrollTo(0, 0);
    });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(250);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    await page.screenshot({ path: `${out}${name}-${w}.png`, fullPage: true });
    report.push({ name, w, status: res?.status(), overflow, errors: [...new Set(errors)] });
    await ctx.close();
  }
}
await browser.close();
for (const r of report) console.log(`${r.name} @${r.w}: ${r.status}${r.overflow > 0 ? ` OVERFLOW ${r.overflow}px` : ''}${r.errors.length ? `\n  ${r.errors.join('\n  ')}` : ''}`);
console.log(`units linked: ${unitHrefs.length}`);
