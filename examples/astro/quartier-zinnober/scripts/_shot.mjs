import { chromium } from 'playwright';
const [,, url, out, w='1240', h='980'] = process.argv;
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: +w, height: +h } });
await p.goto(url); await p.waitForTimeout(300); await p.screenshot({ path: out }); await b.close();
