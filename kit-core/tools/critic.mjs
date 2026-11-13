#!/usr/bin/env node
/**
 * Collect what the taste critic needs to judge one page (TASTE.md section 4,
 * critic/CRITIC.md), so a separate model can review it from files alone.
 *
 *   pnpm kit critic                                   # the home page, starts `pnpm dev` if needed
 *   pnpm kit critic -- /listings --url http://localhost:4321
 *   pnpm kit critic -- / --anchor http://localhost:4799            # the chosen example, running
 *   pnpm kit critic -- / --anchor-shots a@1440.png,a@390.png       # or its screenshots
 *   pnpm kit critic -- / --anchor ... --previous critic-round1.md   # round 2: the critic checks its fixes
 *
 * Output (default critic-input/):
 *   INDEX.md               what each file is, in reading order (the critic starts here)
 *   summary.json           measured facts: taste lines, fonts by role, colours, logo, images, sections
 *   page@1440.png, page@390.png               full page
 *   page-first@1440.png, page-first@390.png   first screen only
 *   anchor@1440.png, anchor@390.png, anchor-first@*.png   the anchor (when given)
 *   logo.<ext>, type-vs-logo.png   the logo file, and the logo beside every font family in use
 *   BRIEF.md, DESIGN-NOTES.md      copied from the site root when present
 *   CRITIC.md                      the critic's instructions (from the kit)
 */
import { chromium } from 'playwright';
import { spawn, spawnSync } from 'node:child_process';
import { copyFile, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { basename, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2).filter((a) => a !== '--');
const opt = (name, def) => {
  const i = args.indexOf(`--${name}`);
  if (i === -1) return def;
  const v = args[i + 1];
  args.splice(i, 2);
  return v;
};
const BASE = opt('url', `http://localhost:${process.env.PORT ?? 4321}`).replace(/\/$/, '');
const OUT = resolve(opt('out', 'critic-input'));
const ANCHOR = opt('anchor', '')?.replace(/\/$/, '');
const ANCHOR_PATH = opt('anchor-path', '/');
const ANCHOR_SHOTS = opt('anchor-shots', '');
const PREVIOUS = opt('previous', '');
const INJECT = opt('inject', '');
const injectCss = INJECT ? await readFile(INJECT, 'utf8') : '';
const PATH = args.find((a) => a.startsWith('/')) ?? '/';
const WIDTHS = [
  { name: '1440', width: 1440, height: 900 },
  { name: '390', width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
];
const here = (p) => fileURLToPath(new URL(p, import.meta.url));

async function up(url) {
  try {
    return (await fetch(url, { signal: AbortSignal.timeout(2000) })).status < 500;
  } catch {
    return false;
  }
}

let server;
if (!(await up(BASE))) {
  console.log(`Nothing on ${BASE}, starting pnpm dev…`);
  server = spawn('pnpm', ['dev'], { stdio: 'ignore', detached: true });
  for (let i = 0; i < 60 && !(await up(BASE)); i++) await new Promise((r) => setTimeout(r, 1000));
  if (!(await up(BASE))) {
    console.error('Dev server did not start. Run `pnpm dev` and read its errors.');
    process.exit(2);
  }
}
const stop = () => {
  try {
    if (server) process.kill(-server.pid);
  } catch {}
};
process.on('exit', stop);

await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });

// 1. The measured checks: the screenshot tool on this one path (its taste: lines and problems).
const shotDir = join(OUT, '.screenshot');
spawnSync(process.execPath, [here('./screenshot.mjs'), '--url', BASE, '--out', shotDir, ...(INJECT ? ['--inject', INJECT] : []), PATH], { stdio: 'ignore' });
let problems = [];
try {
  problems = JSON.parse(await readFile(join(shotDir, 'report.json'), 'utf8'))[0]?.problems ?? [];
} catch {
  problems = ['(the screenshot tool did not write a report: run `pnpm screenshot` and read its errors)'];
}
await rm(shotDir, { recursive: true, force: true });

const browser = await chromium.launch().catch(() => chromium.launch({ channel: 'chrome' }));

/** Load a page fully: lazy images scrolled in, fonts ready. */
async function open(ctx, url, css = '') {
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForLoadState('load', { timeout: 10000 }).catch(() => {});
  if (css) await page.addStyleTag({ content: css }).catch(() => {});
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 600) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
    }
    window.scrollTo(0, 0);
    await document.fonts.ready;
    // Real file pixels (srcset descriptors lie when the image CDN never enlarges).
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
  await page.waitForTimeout(300);
  return page;
}

async function shots(url, prefix, css = '') {
  const out = {};
  for (const vp of WIDTHS) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, isMobile: vp.isMobile, hasTouch: vp.hasTouch, deviceScaleFactor: vp.deviceScaleFactor ?? 1 });
    try {
      const page = await open(ctx, url, css);
      const full = `${prefix}@${vp.name}.png`;
      const first = `${prefix}-first@${vp.name}.png`;
      const h = await page.evaluate(() => document.documentElement.scrollHeight);
      await page.screenshot({ path: join(OUT, full), fullPage: true, clip: { x: 0, y: 0, width: vp.width, height: Math.min(h, vp.height * 12) } });
      await page.screenshot({ path: join(OUT, first) });
      out[vp.name] = { page, ctx, full, first };
    } catch (e) {
      await ctx.close();
      throw e;
    }
  }
  return out;
}

/** Everything measurable about taste on one loaded page. Runs in the browser. */
function measure() {
  const vw = innerWidth, vh = innerHeight;
  const rgb = (c) => (c.match(/[\d.]+/g) || []).map(Number);
  const hex = (c) => { const v = rgb(c); return v.length >= 3 ? '#' + v.slice(0, 3).map((n) => Math.round(n).toString(16).padStart(2, '0')).join('') : c; };
  // The ground an element sits on: its own background or the first opaque one above it.
  const groundOf = (el) => {
    for (let e = el; e; e = e.parentElement) {
      const v = rgb(getComputedStyle(e).backgroundColor);
      if (v.length >= 3 && (v.length < 4 || v[3] > 0.5)) return hex(getComputedStyle(e).backgroundColor);
    }
    return '#ffffff';
  };
  // An image CDN URL hides the file name in base64: show the original's name.
  const fileName = (src) => {
    const seg = (src || '').split('/').pop()?.split('?')[0] ?? '';
    try {
      const orig = atob(seg.split('.')[0].replace(/-/g, '+').replace(/_/g, '/'));
      if (/^https?:\/\//.test(orig)) return orig.split('/').pop().slice(0, 80);
    } catch {}
    return seg.slice(0, 80);
  };
  const family = (f) => f.split(',')[0].trim().replace(/^["']|["']$/g, '');
  const visible = (el) => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && !el.closest('[hidden], .sr-only'); };
  const ownText = (el) => [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join('').trim();
  const style = (el) => {
    const cs = getComputedStyle(el);
    return {
      family: family(cs.fontFamily), size: Math.round(parseFloat(cs.fontSize) * 10) / 10, weight: cs.fontWeight, style: cs.fontStyle,
      tracking: cs.letterSpacing === 'normal' ? 0 : Math.round((parseFloat(cs.letterSpacing) / parseFloat(cs.fontSize)) * 1000) / 1000,
      transform: cs.textTransform, lineHeight: cs.lineHeight, color: hex(cs.color), stretch: cs.fontStretch,
    };
  };
  // Text roles: what each kind of text is set in. The critic compares them with the logo.
  const textEls = [...document.querySelectorAll('body *')].filter((el) => ownText(el) && visible(el) && !el.closest('script, style, noscript'));
  const caps = (el) => { const cs = getComputedStyle(el); return cs.textTransform === 'uppercase' || (ownText(el) === ownText(el).toUpperCase() && /[A-Z]{3}/.test(ownText(el))); };
  const roleOf = (el) => {
    const cs = getComputedStyle(el), fs = parseFloat(cs.fontSize), t = ownText(el);
    if (el.closest('[role="banner"]') || (el.closest('header') && !el.closest('main, article, section'))) return 'header / nav';
    if (el.closest('footer')) return 'footer';
    if (el.closest('button, .btn, [class*="button"]') || (el.closest('a') && rgb(getComputedStyle(el.closest('a')).backgroundColor)[3] !== 0 && getComputedStyle(el.closest('a')).backgroundColor !== 'rgba(0, 0, 0, 0)')) return 'button';
    if (/^h1$/i.test(el.tagName)) return 'h1';
    if (/^h[23]$/i.test(el.tagName) && fs >= 20) return 'section heading (h2/h3)';
    if (/\d/.test(t) && fs >= 40) return 'big number';
    if (/(CHF|EUR|€|Fr\.)\s?[\d'’.,]+|[\d'’.,]{5,}\s?(CHF|€)/.test(t)) return 'price';
    if (fs <= 14 && caps(el)) return 'eyebrow / caps label';
    if (fs <= 15) return 'small text / meta';
    if (el.closest('form')) return 'form';
    return 'body / lede';
  };
  const roles = new Map();
  for (const el of textEls) {
    const role = roleOf(el);
    const s = style(el);
    const key = `${role}|${s.family}|${s.size}|${s.weight}|${s.style}|${s.transform}`;
    const cur = roles.get(key) ?? { role, ...s, count: 0, sample: ownText(el).slice(0, 50) };
    cur.count++;
    roles.set(key, cur);
  }
  const byRole = {};
  for (const r of [...roles.values()].sort((a, b) => b.count - a.count)) (byRole[r.role] ??= []).length < 3 && byRole[r.role].push(r);
  // Families by characters drawn.
  const chars = new Map();
  let total = 0;
  for (const el of textEls) { const n = ownText(el).length; const f = family(getComputedStyle(el).fontFamily); chars.set(f, (chars.get(f) || 0) + n); total += n; }
  const families = [...chars].sort((a, b) => b[1] - a[1]).map(([f, n]) => ({ family: f, share: Math.round((n / total) * 100) / 100, loaded: [...document.fonts].some((ff) => ff.family.replace(/["']/g, '') === f && ff.status === 'loaded') }));
  // Colours: grounds by area (top-level boxes only once), text colours by characters.
  const grounds = new Map();
  for (const el of document.querySelectorAll('body, body *')) {
    if (!visible(el)) continue;
    const c = rgb(getComputedStyle(el).backgroundColor);
    if (c.length < 3 || (c.length > 3 && c[3] < 0.5)) continue;
    const r = el.getBoundingClientRect();
    const h = hex(getComputedStyle(el).backgroundColor);
    grounds.set(h, (grounds.get(h) || 0) + r.width * r.height);
  }
  const page = document.documentElement.scrollWidth * document.documentElement.scrollHeight;
  const inks = new Map();
  for (const el of textEls) { const h = hex(getComputedStyle(el).color); inks.set(h, (inks.get(h) || 0) + ownText(el).length); }
  // Logo.
  const logoEl = document.querySelector('img[data-logo]') || document.querySelector('header img, [role="banner"] img') || document.querySelector('header svg');
  // No logo file: the text wordmark (the home link in the header) stands for it.
  const wordmark = !logoEl && document.querySelector('header a[href="/"], [role="banner"] a[href="/"]');
  let logo = null;
  if (logoEl) {
    const r = logoEl.getBoundingClientRect();
    logo = { tag: logoEl.tagName.toLowerCase(), src: logoEl.currentSrc || logoEl.src || null, original: fileName(logoEl.currentSrc || logoEl.src), alt: logoEl.getAttribute('alt'), drawn: [Math.round(r.width), Math.round(r.height)], file: logoEl.naturalWidth ? [logoEl.naturalWidth, logoEl.naturalHeight] : null, shareOfHeader: null };
    const header = logoEl.closest('header, [role="banner"]');
    if (header) logo.shareOfHeader = Math.round((r.height / header.getBoundingClientRect().height) * 100) / 100;
  }
  if (wordmark) {
    const r = wordmark.getBoundingClientRect(), s = style(wordmark.querySelector('span') || wordmark);
    logo = { tag: 'text wordmark', text: wordmark.innerText.trim().replace(/\s+/g, ' '), drawn: [Math.round(r.width), Math.round(r.height)], font: s };
  }
  const header = document.querySelector('header, [role="banner"]');
  // Images: file pixels against the box x devicePixelRatio (the photo-sharpness line).
  const images = [...document.images].filter(visible).map((i) => {
    const r = i.getBoundingClientRect();
    const cs = getComputedStyle(i);
    const realW = Number(i.dataset.realW) || i.naturalWidth, realH = Number(i.dataset.realH) || i.naturalHeight;
    const cover = cs.objectFit !== 'contain' && cs.objectFit !== 'scale-down';
    const fillW = realW && realH && cover ? Math.max(r.width, r.height * (realW / realH)) : r.width;
    return {
      file: fileName(i.currentSrc || i.src), alt: i.alt, hero: !!(i.getAttribute('fetchpriority') === 'high' || i.closest('[data-hero]')),
      box: [Math.round(r.width), Math.round(r.height)], top: Math.round(r.top + scrollY), filePx: [realW, realH],
      density: realW ? Math.round((realW / fillW) * 100) / 100 : null, // file pixels per CSS pixel: under devicePixelRatio is upscaled on that screen
    };
  }).filter((i) => i.box[0] >= 80);
  // Section rhythm: the page's top-level bands, their grounds and inner spacing.
  const main = document.querySelector('main') || document.body;
  const sections = [...main.children].filter(visible).map((s) => {
    const r = s.getBoundingClientRect(), cs = getComputedStyle(s);
    const heading = s.querySelector('h1, h2, h3');
    return {
      el: `${s.tagName.toLowerCase()}${typeof s.className === 'string' && s.className ? '.' + s.className.trim().split(/\s+/).join('.') : ''}`,
      top: Math.round(r.top + scrollY), height: Math.round(r.height), ground: groundOf(s),
      padding: [Math.round(parseFloat(cs.paddingTop)), Math.round(parseFloat(cs.paddingBottom))],
      heading: heading ? heading.textContent.trim().slice(0, 50) : null,
    };
  });
  // Type scale: every size with text, how often, in which family (the critic judges near-duplicates).
  const steps = new Map();
  for (const el of textEls) { const cs = getComputedStyle(el); const k = `${Math.round(parseFloat(cs.fontSize) * 2) / 2}px ${family(cs.fontFamily)} ${cs.fontWeight}`; steps.set(k, (steps.get(k) || 0) + 1); }
  const typeScale = [...steps].sort((x, y) => parseFloat(x[0]) - parseFloat(y[0])).map(([k, n]) => `${k} x${n}`);
  return {
    viewport: [vw, vh], typeScale, dpr: devicePixelRatio, pageHeight: document.documentElement.scrollHeight, title: document.title,
    header: header ? { height: Math.round(header.getBoundingClientRect().height), share: Math.round((header.getBoundingClientRect().height / vh) * 100) / 100, position: getComputedStyle(header).position } : null,
    logo, families, fontsByRole: byRole,
    grounds: [...grounds].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([c, a]) => ({ color: c, share: Math.round((a / page) * 100) / 100 })),
    textColors: [...inks].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([c, n]) => ({ color: c, chars: n })),
    images, sections,
  };
}

/** The logo beside each family in use, drawn on the live page (its fonts are loaded there). */
async function typeVsLogo(page, families, logoSrc, name, file) {
  const height = await page.evaluate(({ families, logoSrc, name }) => {
    const box = document.createElement('div');
    box.id = 'ra-specimen';
    box.style.cssText = 'position:absolute;left:0;top:0;width:100%;z-index:2147483647;background:#fff;color:#111;padding:40px;display:grid;grid-template-columns:auto 1fr;gap:40px;align-items:start;overflow:hidden';
    const l = document.createElement('div');
    const mark = !logoSrc && document.querySelector('header a[href="/"], [role="banner"] a[href="/"]');
    if (logoSrc) l.innerHTML = `<img src="${logoSrc}" style="height:220px;width:auto;display:block"><div style="font:12px system-ui;margin-top:8px;color:#666">logo at 220px tall</div>`;
    else if (mark) {
      // The text wordmark, cloned on the live page (its CSS applies), drawn three times larger.
      const c = mark.cloneNode(true);
      c.removeAttribute('href');
      c.style.cssText = 'zoom:3;display:inline-flex;position:static;transform:none';
      l.append(c);
      l.insertAdjacentHTML('beforeend', '<div style="font:12px system-ui;margin-top:8px;color:#666">text wordmark at 3x</div>');
    }
    const r = document.createElement('div');
    r.style.cssText = 'display:grid;gap:22px';
    for (const f of families) {
      const row = document.createElement('div');
      row.innerHTML = `<div style="font:12px system-ui;color:#666;margin-bottom:4px">${f.family} (${Math.round(f.share * 100)}% of the text${f.loaded ? '' : ', NOT LOADED'})</div>` +
        `<div style="font-family:'${f.family}';font-size:56px;line-height:1.05;font-weight:400">${name} 1'250'000</div>` +
        `<div style="font-family:'${f.family}';font-size:56px;line-height:1.05;font-weight:700;text-transform:uppercase">${name.split(/\s+/)[0]} 4.5 · 96</div>`;
      r.append(row);
    }
    box.append(l, r);
    window.scrollTo(0, 0);
    document.body.append(box);
    return Promise.all([...box.querySelectorAll('img')].map((i) => i.decode().catch(() => {}))).then(() => box.getBoundingClientRect().height);
  }, { families, logoSrc, name });
  await page.waitForTimeout(200);
  await page.screenshot({ path: file, clip: { x: 0, y: 0, width: page.viewportSize().width, height: Math.ceil(height) } });
  await page.evaluate(() => document.getElementById('ra-specimen')?.remove());
}

const summary = { page: BASE + PATH, measuredProblems: problems, taste: problems.filter((p) => p.includes('taste:')), widths: {} };
const files = [];
try {
  const site = await shots(BASE + PATH, 'page', injectCss);
  for (const [w, s] of Object.entries(site)) {
    summary.widths[w] = await s.page.evaluate(measure);
    files.push([s.first, `the page, first screen at ${w}`], [s.full, `the page, full at ${w}`]);
  }
  const d = summary.widths['1440'];
  if (d.logo?.src) {
    // An image CDN serves the logo as a raster derivative: fetch the original too (an SVG tells more).
    const seg = new URL(d.logo.src).pathname.split('/').pop()?.split('.')[0] ?? '';
    let original = null;
    try {
      const u = Buffer.from(seg.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
      if (/^https?:\/\/[^\s]+$/.test(u)) original = u;
    } catch {}
    if (original) d.logo.originalUrl = original;
    try {
      const res = await site['1440'].page.request.get(original && /\.svg$/i.test(original) ? original : d.logo.src);
      const ext = (extname(new URL(res.url()).pathname) || '.img').slice(0, 6);
      await writeFile(join(OUT, `logo${ext}`), await res.body());
      files.push([`logo${ext}`, 'the logo file as served']);
      if (ext === '.svg') {
        const svg = (await res.text()).slice(0, 200000);
        d.logo.svg = { textElements: (svg.match(/<text\b/g) || []).length, fontFamilies: [...new Set((svg.match(/font-family\s*[:=]\s*["']?([^;"'>]+)/g) || []).map((m) => m.replace(/font-family\s*[:=]\s*["']?/, '').trim()))], fills: [...new Set((svg.match(/#[0-9a-f]{6}\b|#[0-9a-f]{3}\b/gi) || []).map((c) => c.toLowerCase()))] };
      }
    } catch {}
  }
  await typeVsLogo(site['1440'].page, d.families.filter((f) => f.share >= 0.02), d.logo?.src, (d.logo?.alt || d.logo?.text || 'Agency').replace(/\s+(AG|SA|GmbH|Sàrl|SARL|SRL|SL|SAS|Srl)$/i, ''), join(OUT, 'type-vs-logo.png'));
  files.push(['type-vs-logo.png', "the logo beside every font family in use: does the type echo the logo's character, or contrast with it on purpose?"]);
  for (const s of Object.values(site)) await s.ctx.close();

  if (ANCHOR) {
    const a = await shots(ANCHOR + ANCHOR_PATH, 'anchor');
    summary.anchor = { url: ANCHOR + ANCHOR_PATH, widths: {} };
    for (const [w, s] of Object.entries(a)) {
      summary.anchor.widths[w] = await s.page.evaluate(measure);
      files.unshift([s.first, `the anchor, first screen at ${w}`], [s.full, `the anchor, full at ${w}`]);
      await s.ctx.close();
    }
  } else if (ANCHOR_SHOTS) {
    summary.anchor = { shots: [] };
    for (const f of ANCHOR_SHOTS.split(',').map((s) => s.trim()).filter(Boolean)) {
      const name = `anchor-${basename(f)}`;
      await copyFile(f, join(OUT, name));
      summary.anchor.shots.push(name);
      files.unshift([name, `the anchor (given): ${basename(f)}`]);
    }
  } else {
    summary.anchor = null;
  }
} finally {
  await browser.close();
  stop();
}

for (const f of ['BRIEF.md', 'DESIGN-NOTES.md']) {
  if (existsSync(f)) {
    await copyFile(f, join(OUT, f));
    files.unshift([f, f === 'BRIEF.md' ? 'what the agency asked for (facts and tone: never contradict it)' : 'what the builder decided and why (anything kept on purpose is named here)']);
  }
}
if (PREVIOUS) {
  await copyFile(PREVIOUS, join(OUT, 'PREVIOUS-CRITIC.md'));
  files.unshift(['PREVIOUS-CRITIC.md', 'the previous round\'s critique: this is round 2, check each of its fixes first']);
}
await copyFile(here('../critic/CRITIC.md'), join(OUT, 'CRITIC.md'));
await copyFile(here('../TASTE.md'), join(OUT, 'TASTE.md'));
await writeFile(join(OUT, 'summary.json'), JSON.stringify(summary, null, 2));
const index = `# Critic input: ${BASE + PATH}

Read CRITIC.md first (your instructions; the rubric is TASTE.md), then the files below in this order.
summary.json holds the measured facts: \`taste\` (problems the screenshot tool measured), and per width
the fonts by role, families in use, grounds and text colours, the logo (drawn size, file, SVG facts),
images (file pixels per CSS pixel: \`density\` under the width's dpr means upscaled), and the sections
(top, height, ground, padding) for the rhythm line.
${summary.anchor ? '' : '\nNo anchor was given: judge against the style named in BRIEF.md and DESIGN-NOTES.md, and say so.\n'}
${files.map(([f, what]) => `- ${f}: ${what}`).join('\n')}
- summary.json: the measured facts
- TASTE.md: the rubric

Measured taste lines: ${summary.taste.length ? '\n' + summary.taste.map((t) => `- ${t}`).join('\n') : 'none.'}
`;
await writeFile(join(OUT, 'INDEX.md'), index);
console.log(`Critic input in ${OUT}/ (${files.length + 3} files). Give the critic ${join(OUT, 'INDEX.md')} and nothing else.`);
if (summary.taste.length) console.log(`${summary.taste.length} measured taste line(s):\n  ${summary.taste.join('\n  ')}`);
