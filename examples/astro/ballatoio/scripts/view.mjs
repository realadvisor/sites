// Viewport shots at a scroll offset: node scripts/view.mjs <url> <out.png> <width> [y] [height]
import { chromium } from 'playwright';
const [url, out, w = '1440', y = '0', h = '900'] = process.argv.slice(2);
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: +w, height: +h } });
await p.goto(url, { waitUntil: 'networkidle' });
await p.evaluate((y) => window.scrollTo(0, y), +y);
await p.waitForTimeout(800);
await p.screenshot({ path: out });
await b.close();
