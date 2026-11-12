// Lists elements that stick out of the viewport at 390 px (needs pnpm preview).
import { chromium } from 'playwright';
const BASE = process.env.BASE ?? 'http://localhost:4420';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 390, height: 844 } });
for (const path of process.argv.slice(2)) {
  await p.goto(BASE + path, { waitUntil: 'networkidle' });
  const out = await p.evaluate(() => [...document.querySelectorAll('body *')].filter((e) => e.getBoundingClientRect().right > 391 && getComputedStyle(e).position !== 'fixed').slice(0, 8).map((e) => `${e.tagName}.${[...e.classList].join('.')} ${Math.round(e.getBoundingClientRect().right)}`));
  console.log(path, out);
}
await b.close();
