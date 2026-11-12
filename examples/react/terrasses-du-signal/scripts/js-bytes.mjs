// JS bytes per page (transferred, after scrolling), Astro next to React.
//   node scripts/js-bytes.mjs [--astro http://127.0.0.1:4412] [--react http://127.0.0.1:4512] /path ...
import { chromium } from 'playwright';
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); if (i < 0) return d; const v = args[i + 1]; args.splice(i, 2); return v; };
const sites = { astro: opt('--astro', 'http://127.0.0.1:4412'), react: opt('--react', 'http://127.0.0.1:4512') };
const b = await chromium.launch();
for (const path of args) {
  const out = [];
  for (const [name, base] of Object.entries(sites)) {
    const p = await b.newPage({ viewport: { width: 390, height: 844 } });
    const c = await p.context().newCDPSession(p);
    await c.send('Network.enable');
    const ids = new Set();
    let js = 0;
    c.on('Network.responseReceived', (e) => e.type === 'Script' && ids.add(e.requestId));
    c.on('Network.loadingFinished', (e) => ids.has(e.requestId) && (js += e.encodedDataLength));
    await p.goto(base + path, { waitUntil: 'networkidle' });
    await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 500) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 40)); } });
    await p.waitForTimeout(800);
    out.push(`${name} ${(js / 1024).toFixed(1)} KB`);
    await p.close();
  }
  console.log(path.slice(0, 40).padEnd(42), out.join('  '));
}
await b.close();
