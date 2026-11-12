// JS per page, Astro vs React: decoded bytes of every script the page loads (after interaction-free load).
//   node scripts/js-bytes.mjs [--astro URL] [--react URL] /path ...
import { chromium } from 'playwright';
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); if (i < 0) return d; const v = args[i + 1]; args.splice(i, 2); return v; };
const sites = { astro: opt('--astro', 'http://127.0.0.1:4419'), react: opt('--react', 'http://127.0.0.1:4519') };
const b = await chromium.launch();
for (const p of args) {
  const out = {};
  for (const [k, base] of Object.entries(sites)) {
    const page = await b.newPage();
    await page.goto(base + p, { waitUntil: 'networkidle' });
    out[k] = await page.evaluate(() => performance.getEntriesByType('resource').filter((e) => e.initiatorType === 'script' || /\.m?js(\?|$)/.test(e.name)).reduce((s, e) => [s[0] + e.decodedBodySize, s[1] + e.encodedBodySize], [0, 0]));
    await page.close();
  }
  const f = ([d, e]) => `${(d / 1024).toFixed(1)} KB (${(e / 1024).toFixed(1)} gz)`;
  console.log(`${p.padEnd(46)} astro ${f(out.astro).padEnd(22)} react ${f(out.react)}`);
}
await b.close();
