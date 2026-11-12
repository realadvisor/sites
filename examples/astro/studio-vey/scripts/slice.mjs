// Slice a tall screenshot into viewport-ish chunks for review: node scripts/slice.mjs in.png outdir [chunkH]
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import { basename } from 'node:path';
const sharp = createRequire(createRequire(import.meta.url).resolve('astro/package.json'))('sharp');
const [inp, out, ch] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const m = await sharp(inp).metadata();
const h = Number(ch ?? (m.width > 500 ? 1800 : 2400));
for (let y = 0, i = 0; y < m.height; y += h, i++) {
  const f = `${out}/${basename(inp, '.png')}-${i}.jpg`;
  await sharp(inp).extract({ left: 0, top: y, width: m.width, height: Math.min(h, m.height - y) }).resize({ width: m.width > 500 ? 1000 : 390 }).jpeg({ quality: 70 }).toFile(f);
  console.log(f);
}
