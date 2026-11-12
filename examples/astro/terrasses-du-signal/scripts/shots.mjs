#!/usr/bin/env node
/**
 * Full-page screenshots of every page type at 1440 and 390 px into
 * .screenshots/, plus console errors, failed requests and horizontal
 * overflow per page. Needs the site running: pnpm preview (port 4412).
 *   node scripts/shots.mjs [path ...]
 */
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';

const BASE = process.env.BASE ?? 'http://localhost:4412';
const PAGES = process.argv.slice(2).length
  ? process.argv.slice(2)
  : ['/', '/appartements', '/appartements/4-5-pieces-2e-etage-b16cac5c-1fec-48c6-b625-37ae6e38311b', '/appartements/6-5-pieces-5e-etage-ecbf8ec5-328b-4549-a871-58bee6185391', '/contact', '/situation', '/galerie', '/documents', '/legal', '/privacy', '/nope'];
const name = (p) => (p === '/' ? 'home' : p.slice(1).replace(/\//g, '_').replace(/-[0-9a-f]{8}-.*$/, ''));
mkdirSync('.screenshots', { recursive: true });
const browser = await chromium.launch();
let problems = 0;
for (const width of [1440, 390]) {
  const ctx = await browser.newContext({ viewport: { width, height: width > 500 ? 900 : 844 }, deviceScaleFactor: 1, isMobile: width < 500, hasTouch: width < 500 });
  for (const p of PAGES) {
    const page = await ctx.newPage();
    const errs = [];
    page.on('console', (m) => m.type() === 'error' && errs.push(`console: ${m.text()}`));
    page.on('pageerror', (e) => errs.push(`pageerror: ${e.message}`));
    page.on('requestfailed', (r) => errs.push(`failed: ${r.url().slice(0, 120)} ${r.failure()?.errorText}`));
    page.on('response', (r) => r.status() >= 400 && !r.url().endsWith(p) && errs.push(`http ${r.status()}: ${r.url().slice(0, 120)}`));
    await page.goto(BASE + p, { waitUntil: 'networkidle' });
    // Load lazy images: scroll through the page, then back to the top.
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 150)); }
      await Promise.all([...document.images].map((i) => (i.complete ? null : new Promise((r) => { i.onload = i.onerror = r; setTimeout(r, 4000); }))));
      window.scrollTo(0, 0);
    });
    await page.waitForLoadState('networkidle');
    // content-visibility:auto (gallery rows far below the fold) skips painting
    // off-screen parts; a full-page capture would show them blank. Paint all.
    await page.addStyleTag({ content: '*{content-visibility:visible!important}' });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    if (overflow > 0) errs.push(`overflow-x: ${overflow}px`);
    await page.screenshot({ path: `.screenshots/${name(p)}-${width}.png`, fullPage: true });
    if (errs.length) { problems += errs.length; console.log(`${width} ${p}\n  ${errs.join('\n  ')}`); }
    await page.close();
  }
  await ctx.close();
}
await browser.close();
console.log(problems ? `${problems} problems` : 'no problems');
