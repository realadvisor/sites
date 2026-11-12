// Every sitemap URL (plus search variants): status, no inline <script> (JSON-LD
// allowed), no on* attributes, one h1, html lang, and JS/CSS bytes it loads.
const base = process.argv[2] ?? 'http://localhost:4414';
const sm = await (await fetch(`${base}/sitemap.xml`)).text();
const paths = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
paths.push('/comprar?view=map', '/en/rent?view=map', '/comprar?city=Pals', '/alquilar?minRooms=5');
const sizes = new Map();
const size = async (u) => {
  if (!sizes.has(u)) sizes.set(u, (await (await fetch(u)).arrayBuffer()).byteLength);
  return sizes.get(u);
};
let bad = 0;
for (const p of paths) {
  const res = await fetch(base + p);
  const html = await res.text();
  const issues = [];
  if (res.status !== 200) issues.push(`HTTP ${res.status}`);
  for (const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    if (/type="application\/ld\+json"/.test(m[1])) continue;
    if (!/\bsrc=/.test(m[1]) || m[2].trim()) issues.push('inline script');
  }
  if (/\son[a-z]+=["']/i.test(html.replace(/<script[\s\S]*?<\/script>/gi, ''))) issues.push('on* attribute');
  const h1 = (html.match(/<h1\b/g) ?? []).length;
  if (h1 !== 1) issues.push(`${h1} h1`);
  const lang = html.match(/<html lang="([^"]+)"/)?.[1];
  const js = [...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map((m) => new URL(m[1], base).href);
  const css = [...html.matchAll(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"|<link[^>]+href="([^"]+)"[^>]+rel="stylesheet"/g)].map((m) => new URL(m[1] ?? m[2], base).href);
  let jsB = 0, cssB = 0;
  for (const u of js) jsB += await size(u);
  for (const u of css) cssB += await size(u);
  if (issues.length) bad++;
  console.log(`${issues.length ? 'FAIL' : 'ok  '} ${p} [${lang}] js ${(jsB / 1024).toFixed(1)}KB css ${(cssB / 1024).toFixed(1)}KB ${issues.join(', ')}`);
}
console.log(`${paths.length} pages, ${bad} with problems`);
