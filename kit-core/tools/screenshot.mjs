#!/usr/bin/env node
/**
 * Look at your own work. Crawls the site from "/", screenshots every route at
 * 1440px (desktop) and 390px (mobile), full page, and reports problems.
 *
 *   pnpm screenshot                       # starts `pnpm dev` if nothing runs on :4321
 *   pnpm screenshot -- --url http://localhost:4321 --max 40
 *   pnpm screenshot -- /listings /contact # only these paths
 *   pnpm screenshot -- --jobs 1           # one page at a time (default 4)
 *
 * Output: screenshots/<route>@1440.png, screenshots/<route>@390.png and
 * screenshots/report.json. Exit code 1 if any page has console errors, failed
 * requests, broken images, HTTP >= 400 or horizontal overflow on mobile.
 * Then OPEN AND LOOK AT EVERY PNG. The report does not judge design.
 */
import { chromium } from 'playwright';
import { spawn, spawnSync } from 'node:child_process';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const t0 = Date.now();
const args = process.argv.slice(2).filter((a) => a !== '--');
const opt = (name, def) => {
  const i = args.indexOf(`--${name}`);
  if (i === -1) return def;
  const v = args[i + 1];
  args.splice(i, 2);
  return v;
};
const BASE = opt('url', `http://localhost:${process.env.PORT ?? 4321}`).replace(/\/$/, '');
const MAX = Number(opt('max', '30'));
// Pages open at once. Most of a page's time is waiting (load, lazy-image scroll, settle
// timers), so 4 at a time is about 3x faster than one after the other, even on 4 vCPUs.
const JOBS = Math.max(1, Number(opt('jobs', process.env.SCREENSHOT_JOBS ?? '4')));
const OUT = opt('out', 'screenshots');
const explicit = args.filter((a) => a.startsWith('/'));
const WIDTHS = [
  { name: '1440', width: 1440, height: 900 },
  { name: '390', width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
];
const PER_PATTERN = 2; // e.g. only 2 /listings/<slug> pages

async function up() {
  try {
    const r = await fetch(BASE, { signal: AbortSignal.timeout(2000) });
    return r.status < 500;
  } catch {
    return false;
  }
}

async function launch() {
  const tries = [
    () => chromium.launch(),
    () => chromium.launch({ channel: 'chrome' }), // system Google Chrome
    () => {
      console.log('Installing Playwright Chromium (one time)…');
      spawnSync('pnpm', ['exec', 'playwright', 'install', 'chromium-headless-shell'], { stdio: 'inherit' });
      return chromium.launch();
    },
  ];
  let last;
  for (const t of tries) {
    try {
      return await t();
    } catch (e) {
      last = e;
    }
  }
  throw last;
}
/**
 * Text drawn over the [data-hero] photo: hide the glyphs, screenshot what is behind
 * each text box, and compare the text colour with the 10% worst background pixels.
 * Small text needs 4.5:1, text >= 24px (or >= 18.66px bold) 3:1.
 */
async function heroContrast(page) {
  const items = await page.evaluate(() => {
    const hero = document.querySelector('[data-hero]');
    if (!hero) return [];
    const photo = hero.matches('img, picture') ? hero : hero.querySelector('img') || hero;
    const pr = photo.getBoundingClientRect();
    // The whole hero block (section/header), not the photo wrapper: buttons and links count too.
    const box = hero.closest('section, header') || hero.closest('[class*="hero"]')?.parentElement || hero.parentElement || hero;
    const out = [];
    for (const el of box.querySelectorAll('*')) {
      const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
      if (!own || el.closest('[data-enquiry], form')) continue;
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      if (!r.width || !r.height || cs.visibility === 'hidden' || Number(cs.opacity) < 0.1) continue;
      // Only text that sits on the photo.
      if (r.right < pr.left || r.left > pr.right || r.bottom < pr.top || r.top > pr.bottom) continue;
      const m = cs.color.match(/[\d.]+/g)?.map(Number);
      if (!m) continue;
      const size = parseFloat(cs.fontSize);
      const bold = Number(cs.fontWeight) >= 700;
      el.dataset.raProbe = String(out.length);
      // Sample inside the border (a button's own border is not its background).
      const inner = el.clientWidth > 0 && el.clientHeight > 0;
      const x = r.left + scrollX + (inner ? el.clientLeft : 0);
      const y = r.top + scrollY + (inner ? el.clientTop : 0);
      out.push({ text: el.textContent.trim().slice(0, 40), rgb: m.slice(0, 3), need: size >= 24 || (bold && size >= 18.66) ? 3 : 4.5, x, y, w: inner ? el.clientWidth : r.width, h: inner ? el.clientHeight : r.height });
    }
    document.documentElement.dataset.raProbing = '';
    const st = document.createElement('style');
    st.id = 'ra-probe-style';
    st.textContent = '[data-ra-probe]{color:transparent!important;text-shadow:none!important;-webkit-text-fill-color:transparent!important}';
    document.head.append(st);
    return out.slice(0, 12);
  });
  if (!items.length) return [];
  const results = [];
  for (const it of items) {
    const shot = await page.screenshot({ fullPage: true, clip: { x: it.x, y: it.y, width: Math.max(1, it.w), height: Math.max(1, it.h) } }).catch(() => null);
    if (!shot) continue;
    const ratio = await page.evaluate(async ({ b64, rgb }) => {
      const im = new Image();
      im.src = `data:image/png;base64,${b64}`;
      await im.decode();
      const c = document.createElement('canvas');
      c.width = im.naturalWidth;
      c.height = im.naturalHeight;
      const ctx = c.getContext('2d');
      ctx.drawImage(im, 0, 0);
      const px = ctx.getImageData(0, 0, c.width, c.height).data;
      const lin = (v) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
      const lum = (r, g, b) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
      const lt = lum(...rgb);
      const cr = [];
      const step = Math.max(1, Math.floor(px.length / 4 / 4000));
      for (let i = 0; i < px.length; i += 4 * step) {
        const lb = lum(px[i], px[i + 1], px[i + 2]);
        cr.push((Math.max(lt, lb) + 0.05) / (Math.min(lt, lb) + 0.05));
      }
      cr.sort((a, b) => a - b);
      return cr[Math.floor(cr.length * 0.1)] ?? 21;
    }, { b64: shot.toString('base64'), rgb: it.rgb });
    if (ratio < it.need) results.push({ text: it.text, ratio, need: it.need });
  }
  await page.evaluate(() => {
    document.getElementById('ra-probe-style')?.remove();
    document.querySelectorAll('[data-ra-probe]').forEach((e) => e.removeAttribute('data-ra-probe'));
  });
  return results;
}

const browser = await launch();

let server;
if (!(await up())) {
  console.log(`Nothing on ${BASE}, starting pnpm dev…`);
  server = spawn('pnpm', ['dev'], { stdio: 'ignore', detached: true });
  for (let i = 0; i < 60 && !(await up()); i++) await new Promise((r) => setTimeout(r, 1000));
  if (!(await up())) {
    console.error('Dev server did not start. Run `pnpm dev` and read its errors.');
    await browser.close();
    process.exit(2);
  }
}
const stop = () => {
  try {
    if (server) process.kill(-server.pid);
  } catch {}
};
process.on('exit', stop);

const pattern = (path) => path.split('/').map((s, i) => (i >= 2 && s ? ':x' : s)).join('/');
const fileName = (path) => (path === '/' ? 'home' : path.replace(/^\/|\/$/g, '').replace(/[^\w-]+/g, '_'));

await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });
// Contact sheets: one overview image of every route at both widths (contact-sheet.png),
// plus one image per route (sheet-<route>.png: 1440 left, 390 right, top of the page).
// Read contact-sheet.png first; open a sheet-<route>.png only to inspect a suspected issue.
// Each sheet is an HTML file next to the PNGs it shows (no base64 through the browser),
// and a route's sheet is drawn as soon as its two shots exist, beside the other jobs.
const SHEET_CSS = `body{margin:0;background:#888;font:600 14px system-ui;color:#fff}
  .cell{display:flex;gap:8px;align-items:flex-start;background:#333;padding:8px}
  .cell b{display:block;margin-bottom:4px}.bad{color:#ff8a80}
  .crop{overflow:hidden;background:#fff}.crop img{display:block;width:100%}`;
const png = (f) => f.slice(OUT.length + 1); // shots are OUT/<name>.png: relative to the sheet's HTML

async function drawSheet(name, width, html, out) {
  const file = resolve(OUT, `.${name}.html`);
  await writeFile(file, `<!doctype html><meta charset="utf-8"><style>${SHEET_CSS}</style>${html}`);
  const page = await browser.newPage({ viewport: { width, height: 1000 } });
  try {
    await page.goto(pathToFileURL(file).href, { waitUntil: 'load' });
    await page.evaluate(() => Promise.all([...document.images].map((i) => i.decode().catch(() => {}))));
    await page.screenshot({ path: out, fullPage: true });
  } finally {
    await page.close();
    await rm(file, { force: true });
  }
}

// Per route: 1440 at 50% (top 3000px) and 390 (top 3000px css) side by side.
async function routeSheet(e) {
  const [d, m] = e.shots;
  if (!d || !m) return;
  await drawSheet(`sheet-${fileName(e.path)}`, 720 + 390 + 24, `<div class="cell"><div><b>${e.path} @1440</b><div class="crop" style="width:720px;max-height:1500px"><img src="${png(d)}"></div></div>
    <div><b>@390</b><div class="crop" style="width:390px;max-height:1500px"><img src="${png(m)}"></div></div></div>`, `${OUT}/sheet-${fileName(e.path)}.png`);
}

// Overview: routes in a grid, each 1440 shot (top ~2.5 screens) + 390 shot (top ~3 screens).
async function contactSheet(entries) {
  const cells = entries.filter((e) => e.shots[0] && e.shots[1]);
  if (!cells.length) return;
  const cols = cells.length > 4 ? 3 : 2;
  const w = cols === 3 ? 520 : 780;
  await drawSheet('contact-sheet', cols * (w + 8) + 8, `<style>.grid{display:grid;grid-template-columns:repeat(${cols},${w}px);gap:8px;padding:8px}</style><div class="grid">${cells
    .map((c) => `<div class="cell" style="flex-direction:column"><b class="${c.problems.length ? 'bad' : ''}">${c.path}${c.problems.length ? ` (${c.problems.length} problems)` : ''}</b><div style="display:flex;gap:6px">
      <div class="crop" style="width:${Math.round(w * 0.72)}px;height:${Math.round(w * 0.72 * 1.4)}px"><img src="${png(c.shots[0])}"></div>
      <div class="crop" style="width:${Math.round(w * 0.26)}px;height:${Math.round(w * 0.72 * 1.4)}px"><img src="${png(c.shots[1])}"></div></div></div>`)
    .join('')}</div>`, `${OUT}/contact-sheet.png`);
}

// Routes are found while crawling (links on each 1440 page). Each (route, width) is one
// job, and JOBS of them run at once, each in its own browser context.
const routes = new Map(); // path -> report entry, in the order found
const jobs = [];
const perPattern = new Map();
const addRoute = (path) => {
  routes.set(path, { path, status: 0, problems: [], shots: [], left: WIDTHS.length });
  WIDTHS.forEach((vp, i) => jobs.push({ path, vp, i }));
};
for (const p of explicit.length ? explicit : ['/']) if (!routes.has(p) && routes.size < MAX) addRoute(p);

async function shoot({ path, vp, i }) {
  const entry = routes.get(path);
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, isMobile: vp.isMobile, hasTouch: vp.hasTouch, deviceScaleFactor: vp.deviceScaleFactor ?? 1 });
  try {
    const page = await ctx.newPage();
    page.on('console', (m) => m.type() === 'error' && entry.problems.push(`[${vp.name}] console: ${m.text()}`));
    page.on('pageerror', (e) => entry.problems.push(`[${vp.name}] js error: ${e.message}`));
    page.on('requestfailed', (r) => entry.problems.push(`[${vp.name}] request failed: ${r.url()} ${r.failure()?.errorText}`));
    page.on('response', (r) => r.status() >= 400 && r.url() !== BASE + path && entry.problems.push(`[${vp.name}] HTTP ${r.status()}: ${r.url()}`));
    // Not 'networkidle': it never fires on pages with background video.
    const res = await page.goto(BASE + path, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch((e) => {
      entry.problems.push(`[${vp.name}] navigation: ${e.message}`);
      return null;
    });
    await page.waitForLoadState('load', { timeout: 10000 }).catch(() => {});
    const status = res?.status() ?? 0;
    entry.status = Math.max(entry.status, status);
    if (status >= 400) entry.problems.push(`[${vp.name}] page HTTP ${status}`);
    // Trigger lazy images, then back to top.
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 600) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 60));
      }
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(300);
    // Real file pixels per image: Chrome density-corrects img.naturalWidth for w-descriptor
    // srcsets (an 800w file in a 390px slot reads as 390), so load currentSrc in a fresh Image.
    await page.evaluate(async () => {
      await Promise.all([...document.images].map((img) => new Promise((done) => {
        const src = img.currentSrc || img.src;
        if (!src) return done();
        const probe = new Image();
        probe.onload = () => { img.dataset.realW = String(probe.naturalWidth); img.dataset.realH = String(probe.naturalHeight); done(); };
        probe.onerror = () => done();
        probe.src = src;
        setTimeout(done, 5000);
      })));
    });
    const checks = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth - window.innerWidth,
      broken: [...document.images].filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.currentSrc || i.src),
      noAlt: [...document.images].filter((i) => !i.hasAttribute('alt')).length,
      h1: document.querySelectorAll('h1').length,
      // Selects and text inputs whose shown value is cut off (select scrollWidth is unreliable:
      // measure the selected label with the control's font against its inner width).
      truncated: (() => {
        const ctx = document.createElement('canvas').getContext('2d');
        return [...document.querySelectorAll('select, input[role=combobox], input[type=text], input:not([type])')].flatMap((el) => {
          const r = el.getBoundingClientRect();
          const cs = getComputedStyle(el);
          if (!r.width || cs.visibility === 'hidden' || el.closest('[hidden]')) return [];
          const text = el.tagName === 'SELECT' ? el.selectedOptions[0]?.text ?? '' : el.value || el.placeholder || '';
          if (!text) return [];
          ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
          const inner = el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
          return ctx.measureText(text).width > inner + 1 ? [`${el.tagName.toLowerCase()}${el.name ? `[name=${el.name}]` : ''} "${text.slice(0, 30)}"`] : [];
        });
      })(),
      // Controls side by side in one filter row (more than 6 truncates on desktop).
      widestRow: Math.max(0, ...[...document.querySelectorAll('form')].map((form) => {
        const mids = [...form.querySelectorAll('input:not([type=hidden]):not([type=checkbox]):not([type=radio]), select, button')]
          .map((e) => e.getBoundingClientRect()).filter((r) => r.width > 0).map((r) => Math.round((r.top + r.height / 2) / 10));
        const count = {};
        for (const m of mids) count[m] = (count[m] ?? 0) + 1;
        return Math.max(0, ...Object.values(count));
      })),
      // Form controls side by side in one row must share a height (±2px).
      controlRows: [...document.querySelectorAll('form')].flatMap((form) => {
        const els = [...form.querySelectorAll('input, select, button, .btn')].filter((e) => {
          if (e.matches('input[type=hidden], input[type=checkbox], input[type=radio]')) return false;
          const r = e.getBoundingClientRect();
          return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== 'hidden';
        }).map((e) => ({ e, r: e.getBoundingClientRect() }));
        const rows = [];
        for (const c of els) {
          const mid = c.r.top + c.r.height / 2;
          const row = rows.find((rw) => Math.abs(rw.mid - mid) <= 8);
          row ? row.items.push(c) : rows.push({ mid, items: [c] });
        }
        return rows.filter((rw) => rw.items.length > 1).flatMap((rw) => {
          const hs = rw.items.map((c) => Math.round(c.r.height));
          if (Math.max(...hs) - Math.min(...hs) <= 2) return [];
          const d = (n) => n.tagName.toLowerCase() + (n.name ? `[name=${n.name}]` : '');
          return [`${rw.items.map((c) => `${d(c.e)} ${Math.round(c.r.height)}px`).join(', ')}`];
        });
      }),
      // Photos squashed by their box, or served too small for a 2x screen.
      images: [...document.images].flatMap((i) => {
        const r = i.getBoundingClientRect();
        const cs = getComputedStyle(i);
        if (r.width < 80 || r.height < 60 || !i.naturalWidth || /\.svg(\?|$)/i.test(i.currentSrc || i.src)) return [];
        // Decorative images (map tiles, blurred placeholders, textures) are exempt.
        if (i.getAttribute('alt') === '' || i.closest('[aria-hidden="true"]')) return [];
        const name = (i.alt || (i.currentSrc || i.src).split('/').pop() || '').slice(0, 40);
        const out = [];
        // The hero (fetchpriority=high or data-hero) may crop more (1.6x) once its mobile source is cropped (RaImage `mobile`).
        const hero = i.getAttribute('fetchpriority') === 'high' || i.closest('[data-hero]');
        const realW = Number(i.dataset.realW) || i.naturalWidth;
        const realH = Number(i.dataset.realH) || i.naturalHeight;
        const natRatio = realW / realH;
        const cover = cs.objectFit !== 'contain' && cs.objectFit !== 'scale-down';
        const fdev = (r.width / r.height) / natRatio;
        if (cs.objectFit === 'fill' && (fdev > 1.03 || fdev < 0.97)) out.push(`stretched: "${name}" shown ${(r.width / r.height).toFixed(2)}:1, photo ${natRatio.toFixed(2)}:1 with object-fit: fill (use cover)`);
        else if (cover) {
          const dev = fdev;
          const limit = hero ? 1.6 : 1.25; // hero: crop the mobile source with RaImage `mobile` (AGENTS 7), never a 16:9 file in a portrait box
          if (dev > limit || dev < 1 / limit) out.push(`ratio: "${name}" shown ${Math.round(r.width)}x${Math.round(r.height)} (${(r.width / r.height).toFixed(2)}:1), photo ${natRatio.toFixed(2)}:1${hero ? ' (hero, > 1.6x off: add RaImage mobile={{ width: 800, height: 1000 }})' : ' (crop > 25%)'}`);
        }
        const widths = (i.srcset || '').split(',').map((c) => Number(c.trim().split(/\s+/)[1]?.replace(/w$/, ''))).filter(Boolean);
        const best = Math.max(realW, ...widths);
        // Source width that fills the box at 1x: with cover, a tall box needs height x photo ratio.
        const fillW = cover ? Math.max(r.width, r.height * natRatio) : r.width;
        // 1.5x that, capped at 1920 (full-bleed photos rarely exist larger).
        const need = Math.min(Math.round(fillW * 1.5), 1920);
        if (best < need) out.push(`resolution: "${name}" box ${Math.round(r.width)}x${Math.round(r.height)}, best source ${best}px wide (need >= ${need}: add larger srcset widths${fillW > r.width ? '; tall box, size by height x ratio' : ''})`);
        return out;
      }),
      // Invisible layers that swallow clicks (e.g. a closed menu sheet with opacity 0).
      blockers: [[0.5, 0.5], [0.5, 0.7], [0.25, 0.6], [0.75, 0.6]].map(([fx, fy]) => {
        const el = document.elementFromPoint(innerWidth * fx, innerHeight * fy);
        for (let n = el; n && n !== document.documentElement; n = n.parentElement) {
          const cs = getComputedStyle(n);
          if (n.hasAttribute('hidden') || n.getAttribute('aria-hidden') === 'true' && cs.position === 'fixed' || Number(cs.opacity) < 0.05) {
            return `${n.tagName.toLowerCase()}${n.id ? '#' + n.id : ''}${typeof n.className === 'string' && n.className ? '.' + n.className.trim().split(/\s+/).join('.') : ''}`;
          }
        }
        return null;
      }).filter(Boolean),
      title: document.title,
      links: [...document.querySelectorAll('a[href]')].map((a) => a.href),
      // Header logo: drawn size and ratio vs the file's real pixels.
      logo: (() => {
        const i = document.querySelector('img[data-logo]') || document.querySelector('header img, [role="banner"] img');
        if (!i) return null;
        const r = i.getBoundingClientRect();
        const realW = Number(i.dataset.realW) || i.naturalWidth;
        const realH = Number(i.dataset.realH) || i.naturalHeight;
        if (!r.width || !r.height || !realW || !realH) return null;
        const nat = realW / realH;
        const fit = getComputedStyle(i).objectFit;
        const contain = fit === 'contain' || fit === 'scale-down';
        const drawnW = contain ? Math.min(r.width, r.height * nat) : r.width;
        const drawnH = contain ? Math.min(r.height, r.width / nat) : r.height;
        return { name: (i.alt || i.currentSrc.split('/').pop() || '').slice(0, 40), fit, dev: (r.width / r.height) / nat, contain, drawnW, drawnH };
      })(),
      // Taste (TASTE.md): proportions, colour restraint, reading comfort. Measured, never judged.
      taste: (() => {
        const vw = innerWidth, vh = innerHeight;
        const rgb = (c) => (c.match(/[\d.]+/g) || []).map(Number);
        const hsl = ([r, g, b]) => {
          r /= 255; g /= 255; b /= 255;
          const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
          const sat = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
          let h = 0;
          if (d) h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
          return { h: (h * 60 + 360) % 360, s: sat, l };
        };
        const vivid = (c) => { const v = rgb(c); if (v.length < 3 || (v.length > 3 && v[3] < 0.9)) return null; const x = hsl(v); return x.s >= 0.6 && x.l >= 0.3 && x.l <= 0.72 ? x : null; };
        const header = document.querySelector('header, [role="banner"]');
        const headerH = header ? header.getBoundingClientRect().height : 0;
        // Large vivid fields: a full-bleed band or block in a saturated colour.
        const fields = [];
        const hues = new Map();
        for (const n of document.querySelectorAll('body *')) {
          const cs = getComputedStyle(n);
          if (cs.display === 'none' || cs.visibility === 'hidden') continue;
          const r = n.getBoundingClientRect();
          if (!r.width || !r.height) continue;
          const bg = vivid(cs.backgroundColor);
          if (bg) {
            const area = r.width * Math.min(r.height, vh);
            const bucket = Math.round(bg.h / 30) * 30;
            hues.set(bucket, (hues.get(bucket) || 0) + area);
            if (area >= vw * vh * 0.2) fields.push(`${n.tagName.toLowerCase()}${n.className && typeof n.className === 'string' ? '.' + n.className.trim().split(/\s+/)[0] : ''} ${cs.backgroundColor} ${Math.round(r.width)}x${Math.round(r.height)}`);
          }
          const fg = vivid(cs.color);
          if (fg && n.childNodes.length && [...n.childNodes].some((c) => c.nodeType === 3 && c.textContent.trim())) {
            const bucket = Math.round(fg.h / 30) * 30;
            hues.set(bucket, (hues.get(bucket) || 0) + r.width * r.height);
          }
        }
        const accentHues = [...hues].filter(([, a]) => a >= 400).map(([h]) => h % 360);
        // Reading comfort: body paragraphs.
        let longLines = 0, smallBody = 0, paras = 0;
        for (const p of document.querySelectorAll('main p, article p')) {
          const cs = getComputedStyle(p), fs = parseFloat(cs.fontSize), lh = parseFloat(cs.lineHeight) || fs * 1.4;
          const r = p.getBoundingClientRect(), text = p.textContent.trim();
          if (!r.width || text.length < 120 || fs > 22) continue;
          paras++;
          const lines = Math.max(1, Math.round(r.height / lh));
          if (lines >= 3 && text.length / lines > 90) longLines++;
          if (fs < 15) smallBody++;
        }
        // Soft photos: the file actually loaded (its real pixels, not the srcset's claim; an
        // image CDN never enlarges) against the box it fills x devicePixelRatio (capped at 1.5:
        // a 1.5x file already looks sharp on a 2x phone). Decorative images are exempt unless
        // they are the hero or a big photo (an aria-hidden hero link still counts).
        const dpr = Math.min(devicePixelRatio || 1, 1.5);
        const soft = [];
        for (const i of document.images) {
          const r = i.getBoundingClientRect();
          const src = i.currentSrc || i.src;
          const realW = Number(i.dataset.realW) || i.naturalWidth;
          const realH = Number(i.dataset.realH) || i.naturalHeight;
          if (r.width < 160 || r.height < 120 || !realW || !realH || /\.svg(\?|$)/i.test(src) || i.closest('header, [role="banner"]')) continue;
          const cs = getComputedStyle(i);
          if (cs.filter.includes('blur')) continue; // a blurred placeholder or backdrop
          const big = r.width >= vw * 0.4;
          const hero = i.getAttribute('fetchpriority') === 'high' || i.closest('[data-hero]');
          if (i.getAttribute('alt') === '' && !hero && !big) continue;
          const nat = realW / realH;
          const cover = cs.objectFit !== 'contain' && cs.objectFit !== 'scale-down';
          const fillW = cover ? Math.max(r.width, r.height * nat) : r.width;
          const up = (fillW * dpr) / realW;
          // An image CDN hides the file name in base64: name the original file.
          let file = src.split('/').pop()?.split('?')[0] ?? '';
          try { const o = atob(file.split('.')[0].replace(/-/g, '+').replace(/_/g, '/')); if (/^https?:\/\//.test(o)) file = o.split('/').pop(); } catch {}
          if (up > 1.15) soft.push(`"${(i.alt || file || '').slice(0, 40)}" file ${realW}x${realH} fills ${Math.round(fillW)}px x ${dpr} dpr (upscaled ${Math.round(up * 100)}%)${hero ? ', the hero' : ''}`);
        }
        // Ledes: the first paragraph after a section heading (h1/h2, an eyebrow may sit
        // between). One style for every lede: family, size, weight, italic, full or muted
        // colour (contrast with the ground under it). Colour is relative, so white on ink
        // and near-black on paper are the same style.
        const ground = (n) => {
          for (let e = n; e; e = e.parentElement) {
            const c = rgb(getComputedStyle(e).backgroundColor);
            if (c.length >= 3 && (c.length < 4 || c[3] > 0.5)) return c.slice(0, 3);
          }
          return [255, 255, 255];
        };
        const lin = (v) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
        const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
        const contrast = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
        const blend = (c, under) => (c.length > 3 && c[3] < 1 ? c.slice(0, 3).map((v, k) => v * c[3] + under[k] * (1 - c[3])) : c.slice(0, 3));
        const family = (f) => f.split(',')[0].trim().replace(/^["']|["']$/g, '');
        const ledes = new Map();
        for (const h of document.querySelectorAll('main h1, main h2')) {
          let p = h.nextElementSibling;
          if (p && p.tagName !== 'P' && (p.textContent || '').trim().length < 40) p = p.nextElementSibling; // an eyebrow or rule after the heading
          if (!p || p.tagName !== 'P') continue;
          const cs = getComputedStyle(p), r = p.getBoundingClientRect(), text = p.textContent.trim();
          if (!r.width || text.length < 40 || parseFloat(cs.fontSize) < 15 || p.closest('form, [data-enquiry]')) continue;
          // A heading styled as an eyebrow (a small h2 over a statement or a big number) has no lede.
          if (parseFloat(getComputedStyle(h).fontSize) < parseFloat(cs.fontSize) * 1.25) continue;
          const g = ground(p);
          const tone = contrast(blend(rgb(cs.color), g), g) >= 9 ? 'full' : 'muted';
          const sig = `${family(cs.fontFamily)} ${Math.round(parseFloat(cs.fontSize))}px ${cs.fontWeight}${cs.fontStyle === 'italic' ? ' italic' : ''} ${tone}`;
          if (!ledes.has(sig)) ledes.set(sig, []);
          ledes.get(sig).push(`"${text.slice(0, 24)}…"`);
        }
        // Families in use, by characters drawn (a family under 3% of the text is a detail),
        // and webfonts the CSS asks for that never loaded (a silent fallback to Georgia/Arial).
        const chars = new Map();
        let total = 0;
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        for (let t = walker.nextNode(); t; t = walker.nextNode()) {
          const el = t.parentElement, n = t.textContent.trim().length;
          if (!n || !el || el.closest('script, style, noscript, [hidden], .sr-only')) continue;
          const r = el.getBoundingClientRect();
          if (!r.width || !r.height) continue;
          const f = family(getComputedStyle(el).fontFamily);
          chars.set(f, (chars.get(f) || 0) + n);
          total += n;
        }
        const families = [...chars].filter(([, n]) => n / total >= 0.03).sort((a, b) => b[1] - a[1]).map(([f, n]) => `${f} ${Math.round((n / total) * 100)}%`);
        const faces = [...document.fonts];
        const declared = (f) => faces.filter((ff) => ff.family.replace(/["']/g, '') === f);
        // Only families the page itself declares (@font-face): a missing local font is not a bug here.
        const notLoaded = [...chars.keys()].filter((f) => chars.get(f) / total >= 0.03 && declared(f).length && !declared(f).some((ff) => ff.status === 'loaded'));
        return { vw, vh, headerH, fields: [...new Set(fields)].slice(0, 3), accentHues: [...new Set(accentHues)], longLines, smallBody, paras, soft: soft.slice(0, 4), ledes: [...ledes].map(([s, l]) => `${s} (${l.slice(0, 3).join(', ')})`), families, notLoaded };
      })(),
    }));
    // Hero text legibility: text over the hero photo, contrast against the pixels behind it.
    for (const t of await heroContrast(page)) entry.problems.push(`[${vp.name}] hero text "${t.text}" contrast ${t.ratio.toFixed(1)}:1 on the photo (need ${t.need}:1): add a scrim (gradient >= 0.55 black at the text's top edge) or a panel`);
    const lg = checks.logo;
    if (lg) {
      if (!lg.contain && (lg.dev > 1.05 || lg.dev < 0.95)) entry.problems.push(`[${vp.name}] logo "${lg.name}" ${lg.fit === 'fill' ? 'stretched' : 'cropped'} (box ratio ${(lg.dev * 100 - 100).toFixed(0)}% off the file): set only height (width: auto), no fixed box, no object-fit: cover`);
      // A wide wordmark is sized by width, a tall or square mark (3³, a monogram) by height.
      const wide = lg.drawnW / lg.drawnH >= 1.3;
      if (vp.name === '1440' && wide && (lg.drawnW < 100 || lg.drawnH < 32)) entry.problems.push(`[1440] logo "${lg.name}" drawn ${Math.round(lg.drawnW)}x${Math.round(lg.drawnH)}px: at least 100px wide and 32px tall (140–180px wide for a detailed logo)`);
      if (vp.name === '1440' && !wide && (lg.drawnH < 40 || lg.drawnH > 72)) entry.problems.push(`[1440] logo "${lg.name}" (a tall or square mark) drawn ${Math.round(lg.drawnH)}px tall: 40–72px tall`);
      if (vp.name === '1440' && wide && lg.drawnH > 72) entry.problems.push(`[1440] taste: logo "${lg.name}" drawn ${Math.round(lg.drawnH)}px tall: at most 72px, the header stays slim`);
      if (vp.name === '390' && lg.drawnH < 28) entry.problems.push(`[390] logo "${lg.name}" drawn ${Math.round(lg.drawnH)}px tall: at least 28px`);
    }
    const ts = checks.taste;
    if (ts) {
      const maxHeader = Math.round(ts.vh * 0.12);
      if (ts.headerH > maxHeader) entry.problems.push(`[${vp.name}] taste: header ${Math.round(ts.headerH)}px tall, more than 12% of the screen (${maxHeader}px): slim it (logo 40–72px, one row)`);
      for (const f of ts.fields) entry.problems.push(`[${vp.name}] taste: large field in a saturated colour (${f}): keep vivid brand colours for small accents; use a deep or muted shade, the ink colour or a neutral surface for bands`);
      if (vp.name === '1440' && ts.accentHues.length > 2) entry.problems.push(`[1440] taste: ${ts.accentHues.length} saturated accent hues (${ts.accentHues.join(', ')}°): one accent, two at most`);
      if (vp.name === '1440' && ts.longLines) entry.problems.push(`[1440] taste: ${ts.longLines} paragraph(s) over 90 characters a line: limit the measure (max-width about 65ch)`);
      if (vp.name === '1440' && ts.smallBody) entry.problems.push(`[1440] taste: ${ts.smallBody} body paragraph(s) under 15px: body text 16–20px on desktop`);
      for (const s of ts.soft) entry.problems.push(`[${vp.name}] taste: soft photo, ${s}: use a larger source or a smaller box (the file must cover the box x devicePixelRatio, up to 1.5x)`);
      if (vp.name === '1440' && ts.ledes.length > 1) entry.problems.push(`[1440] taste: section ledes in ${ts.ledes.length} styles: ${ts.ledes.join(' | ')}: one lede style (one class) for every section`);
      if (vp.name === '1440' && ts.families.length > 2) entry.problems.push(`[1440] taste: ${ts.families.length} font families in use (${ts.families.join(', ')}): two at most`);
      for (const f of ts.notLoaded) entry.problems.push(`[${vp.name}] taste: font "${f}" is declared but never loaded: the text falls back to another font (check the @fontsource import and the family name)`);
    }
    for (const b of new Set(checks.blockers)) entry.problems.push(`[${vp.name}] invisible element blocks clicks: ${b} (closed overlays need visibility:hidden + pointer-events:none)`);
    // Click-through: a link below the fold must be the element under its own centre.
    const click = await page.evaluate(async () => {
      const link = [...document.querySelectorAll('main a[href], a[href]')].find((a) => {
        const r = a.getBoundingClientRect();
        return r.width > 0 && r.height > 0 && r.top + scrollY > innerHeight && getComputedStyle(a).visibility !== 'hidden';
      });
      if (!link) return null;
      link.scrollIntoView({ block: 'center', behavior: 'instant' }); // instant even with scroll-behavior: smooth
      await new Promise((r) => setTimeout(r, 150));
      const r = link.getBoundingClientRect();
      const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      window.scrollTo(0, 0);
      if (hit && (hit === link || link.contains(hit) || hit.contains(link))) return null;
      const d = (n) => n ? `${n.tagName.toLowerCase()}${n.id ? '#' + n.id : ''}${typeof n.className === 'string' && n.className ? '.' + n.className.trim().split(/\s+/).join('.') : ''}` : 'nothing';
      return `${d(link)} "${(link.innerText || '').trim().slice(0, 30)}" is covered by ${d(hit)}`;
    });
    if (click) entry.problems.push(`[${vp.name}] below-the-fold link not clickable: ${click}`);
    if (checks.images.length) entry.problems.push(`[${vp.name}] ${checks.images.length} image problem(s): ${checks.images.slice(0, 3).join(' | ')}`);
    for (const row of checks.controlRows) entry.problems.push(`[${vp.name}] form controls in one row differ in height: ${row} (use @realadvisor/sites-kit-astro/components/form/*)`);
    if (checks.truncated.length) entry.problems.push(`[${vp.name}] control text cut off: ${checks.truncated.slice(0, 4).join(', ')} (widen the column, wrap the row, or shorten the label)`);
    if (vp.name === '1440' && checks.widestRow > 6) entry.problems.push(`[1440] ${checks.widestRow} form controls in one row (max 6: wrap, or merge min/max price)`);
    if (checks.overflow > 1) entry.problems.push(`[${vp.name}] horizontal overflow ${checks.overflow}px`);
    for (const b of checks.broken) entry.problems.push(`[${vp.name}] broken image: ${b}`);
    if (checks.noAlt) entry.problems.push(`[${vp.name}] ${checks.noAlt} <img> without alt`);
    if (vp.name === '1440' && checks.h1 !== 1) entry.problems.push(`page has ${checks.h1} <h1> (want 1)`);
    if (vp.name === '1440' && !checks.title) entry.problems.push('empty <title>');
    const file = `${OUT}/${fileName(path)}@${vp.name}.png`;
    // Very long pages (a list of every listing) are cut at 12 screens: a taller
    // PNG breaks the contact sheet and nobody reads that far.
    const fullH = await page.evaluate(() => document.documentElement.scrollHeight);
    const maxH = vp.height * 12;
    await page.screenshot(fullH > maxH ? { path: file, fullPage: true, clip: { x: 0, y: 0, width: vp.width, height: maxH } } : { path: file, fullPage: true });
    entry.shots[i] = file;
    if (vp.name === '1440' && !explicit.length) {
      for (const href of checks.links) {
        const u = new URL(href);
        if (u.origin !== new URL(BASE).origin || u.search || /\.\w+$/.test(u.pathname) || u.pathname.startsWith('/api/')) continue;
        const p = u.pathname.replace(/\/$/, '') || '/';
        if (routes.has(p) || routes.size >= MAX) continue;
        const pat = pattern(p);
        if ((perPattern.get(pat) ?? 0) >= PER_PATTERN && pat !== p) continue;
        perPattern.set(pat, (perPattern.get(pat) ?? 0) + 1);
        addRoute(p);
      }
    }
  } finally {
    await ctx.close();
  }
  if (--entry.left) return;
  entry.problems = [...new Set(entry.problems)];
  console.log(`${entry.problems.length ? '✗' : '✓'} ${path} (${entry.status})${entry.problems.map((p) => `\n    ${p}`).join('')}`);
  await routeSheet(entry);
}

let running = 0;
const waiting = [];
const wake = () => {
  while (waiting.length) waiting.shift()();
};
async function worker() {
  for (;;) {
    const job = jobs.shift();
    if (!job) {
      if (!running) return wake();
      await new Promise((r) => waiting.push(r)); // a running 1440 job may still find routes
      continue;
    }
    running++;
    try {
      await shoot(job);
    } finally {
      running--;
      wake();
    }
  }
}

const report = [];
try {
  await Promise.all(Array.from({ length: JOBS }, worker));
  for (const { left, ...entry } of routes.values()) report.push(entry);
  await contactSheet(report);
} finally {
  await browser.close();
  stop();
}

await writeFile(`${OUT}/report.json`, JSON.stringify(report, null, 2));
const bad = report.filter((r) => r.problems.length);
console.log(`\n${report.length} routes, ${report.length * WIDTHS.length} screenshots in ${OUT}/ (${Math.round((Date.now() - t0) / 1000)} s), ${bad.length} with problems.`);
console.log(`Read ${OUT}/contact-sheet.png (all routes, both widths). Open ${OUT}/sheet-<route>.png only to inspect a suspected issue.`);
process.exit(bad.length ? 1 : 0);
