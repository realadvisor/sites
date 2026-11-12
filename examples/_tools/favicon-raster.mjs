// Rasterise a site's public/favicon.svg into the files browsers and phones ask for:
// favicon.ico (16 + 32 + 48), apple-touch-icon.png (180), icon-192.png,
// icon-512.png and site.webmanifest.
//
//   node favicon-raster.mjs <site folder> "<site name>" "<theme colour>"
//
// Uses Playwright's Chromium, which every example already has for screenshots.
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';

const [dir, name, theme] = process.argv.slice(2);
// Playwright comes from the site's own node_modules.
const pw = await import(createRequire(resolve(dir, 'package.json')).resolve('playwright'));
const chromium = pw.chromium ?? pw.default.chromium;
const pub = join(dir, 'public');
const svg = readFileSync(join(pub, 'favicon.svg'), 'utf8');

const browser = await chromium.launch();
const page = await browser.newPage();
const png = async (size) => {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<style>html,body{margin:0}svg{display:block;width:${size}px;height:${size}px}</style>${svg}`);
  return page.screenshot({ omitBackground: true });
};

const out = {};
for (const s of [16, 32, 48, 180, 192, 512]) out[s] = await png(s);
await browser.close();

writeFileSync(join(pub, 'apple-touch-icon.png'), out[180]);
writeFileSync(join(pub, 'icon-192.png'), out[192]);
writeFileSync(join(pub, 'icon-512.png'), out[512]);

// ICO with embedded PNGs (supported by every current browser).
const imgs = [16, 32, 48].map((s) => [s, out[s]]);
const head = Buffer.alloc(6 + 16 * imgs.length);
head.writeUInt16LE(0, 0); head.writeUInt16LE(1, 2); head.writeUInt16LE(imgs.length, 4);
let offset = head.length;
imgs.forEach(([s, buf], i) => {
  const e = 6 + i * 16;
  head.writeUInt8(s, e); head.writeUInt8(s, e + 1); head.writeUInt8(0, e + 2); head.writeUInt8(0, e + 3);
  head.writeUInt16LE(1, e + 4); head.writeUInt16LE(32, e + 6);
  head.writeUInt32LE(buf.length, e + 8); head.writeUInt32LE(offset, e + 12);
  offset += buf.length;
});
writeFileSync(join(pub, 'favicon.ico'), Buffer.concat([head, ...imgs.map(([, b]) => b)]));

writeFileSync(join(pub, 'site.webmanifest'), `${JSON.stringify({
  name, short_name: name, theme_color: theme, background_color: theme, display: 'browser',
  icons: [
    { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
  ],
}, null, 2)}\n`);
console.log(dir, 'favicon.ico apple-touch-icon.png icon-192.png icon-512.png site.webmanifest');
