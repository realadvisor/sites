// Full-page screenshots at 1440 and 390 of the given paths, plus console
// errors and failed requests. node scripts/shoot.mjs <outDir> <base> <path...>
import { chromium } from 'playwright';
const [out, base, ...paths] = process.argv.slice(2);
const browser = await chromium.launch();
const problems = [];
for (const w of [1440, 390]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: w > 500 ? 900 : 844 }, deviceScaleFactor: 1 });
  for (const p of paths) {
    const page = await ctx.newPage();
    page.on('console', (m) => m.type() === 'error' && problems.push(`${w} ${p} console: ${m.text()}`));
    page.on('pageerror', (e) => problems.push(`${w} ${p} pageerror: ${e.message}`));
    page.on('requestfailed', (r) => problems.push(`${w} ${p} failed: ${r.url()} ${r.failure()?.errorText}`));
    page.on('response', (r) => r.status() >= 400 && problems.push(`${w} ${p} ${r.status()}: ${r.url()}`));
    await page.goto(base + p, { waitUntil: 'networkidle' });
    // Load every lazy image before the full-page shot.
    // Scroll the whole page so lazy images load, then wait for the network.
    await page.evaluate(async () => {
      for (let y = 0; y < document.documentElement.scrollHeight; y += innerHeight / 2) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 60));
      }
      window.scrollTo(0, 0);
    });
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => Promise.all([...document.images].map((i) => (i.complete && i.naturalWidth ? null : new Promise((r) => { i.onload = i.onerror = r; setTimeout(r, 8000); })))));
    // An image still empty after the scroll would be a grey block in the shot (and for a reader).
    const empty = await page.evaluate(() => [...document.images].filter((i) => i.getBoundingClientRect().width > 0 && !(i.complete && i.naturalWidth)).map((i) => i.currentSrc || i.src));
    for (const u of empty) problems.push(`${w} ${p} image not loaded: ${u.slice(0, 120)}`);
    const cv = await page.evaluate(() => [...document.querySelectorAll('*')].filter((e) => getComputedStyle(e).contentVisibility === 'auto').length);
    if (cv) problems.push(`${w} ${p} ${cv} elements with content-visibility:auto`);
    await page.waitForTimeout(300);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    if (overflow > 0) problems.push(`${w} ${p} horizontal overflow ${overflow}px`);
    const name = (p === '/' ? 'home' : p.replace(/^\//, '').replace(/[/?=&]+/g, '_')) + `-${w}.png`;
    await page.screenshot({ path: `${out}/${name}`, fullPage: true });
    await page.close();
  }
  await ctx.close();
}
await browser.close();
console.log(problems.length ? problems.join('\n') : 'no problems');
