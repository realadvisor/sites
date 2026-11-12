import { chromium } from 'playwright';
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto(process.argv[2], { waitUntil: 'networkidle' });
console.log(await p.evaluate(new Function(`return (${process.argv[3]})`)()));
await b.close();
