#!/usr/bin/env node
/**
 * Deploy gate: the safety rules a site must meet before it goes live. Small,
 * deterministic and fast (~10-20 s on a built site): no browser, only fetch +
 * HTML parsing against the built Worker served by `wrangler dev`.
 *
 *   pnpm check:deploy              # build, then check
 *   pnpm check:deploy --no-build   # check the dist/ that is there
 *
 * The CRM publish runs this script from the pinned kit (not the copy in the
 * site repo) inside the site's sandbox, right after the production build, and
 * deploys nothing when it fails. Quality (SEO, design, speed) is the agent's
 * job while building; nothing here judges it.
 *
 * Rules (FAIL = exit 1), on home, /listings, two listings, contact, legal,
 * privacy, an unknown path and an unknown listing (must be 404/410 with a page):
 * - security headers: CSP with frame-ancestors, no 'unsafe-inline' in
 *   script-src, X-Content-Type-Options nosniff, Referrer-Policy,
 *   Permissions-Policy; CSP hosts only from ALLOWED_HOSTS
 * - no inline <script> (JSON-LD is fine), no on* attributes
 * - the page and its stylesheets load only from this site and ALLOWED_HOSTS
 *   (the kit's lib/security.mjs)
 * - every POST form goes to /api/enquiry; no mailto: or off-site forms
 * - a development page's enquiry form sends developmentId (the CRM links the
 *   enquiry to the development; a name in the message does not), and a unit:
 *   its lotId select is required, and a page with unit rows (?lot= links)
 *   has one (every development enquiry is filed on a unit)
 * - no third-party form services (Formspree, Typeform, HubSpot forms, ...)
 * - no iframes (nor frame, embed, object)
 * - no `set:html` with data unless through sanitizeHtml / safeJsonLd (source scan)
 * - no 200 HTML page with an empty or cut body (a render error mid-stream)
 * - every same-origin script, stylesheet, preload and modulepreload of the
 *   sampled pages (/listings?view=map included), and what those scripts
 *   import or preload (`_astro/*.css` of a dynamic import), answers 200 with
 *   its content type (a stylesheet answered by the 404 page breaks the map)
 * - legal pages per language: each language version (hreflang links, /en
 *   paths) links legal pages in its own language, under labels in its own
 *   language (an English page linking the French /legal, or showing
 *   "Mentions légales", fails)
 * - no secret in the build: no file of dist/ contains a placeholder
 *   `ra-secret:<NAME>` or a site key (tools/secret-leaks.mjs)
 *
 * Output: one "FAIL <page>: <reason>" line per problem, then a JSON summary
 * as the last line: {"ok":bool,"problems":[{"page","rule","message"}],"pages":[...],"ms":n}.
 * Uses only Node built-ins and the kit's lib/security.mjs: the publish gate
 * runs it from crm-chat-api's copy of the kit, never the site's. Site root =
 * the current directory. Env: CHECK_PORT (default: a free port).
 */
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { createServer } from 'node:net';
import { join, relative } from 'node:path';
import { pathToFileURL } from 'node:url';
import { ALLOWED_HOSTS } from '../lib/security.mjs';
import { buildLeaks } from './secret-leaks.mjs';

export const FORM_SERVICES = /formspree|typeform|jotform|tally\.so|hsforms|hubspot\.com\/.*forms|getform|basin\.|formsubmit|netlify-forms|web3forms|google\.com\/forms|forms\.gle|forms\.office\.com|wufoo|cognitoforms/i;
const JS_TYPES = new Set(['', 'module', 'text/javascript', 'application/javascript']);
const LISTING_PATH = /^\/[^/]+\/[^/]+-[0-9a-f]{8}-[0-9a-f]{4}-/i;

/** The kit's ALLOWED_HOSTS (lib/security.mjs), as one list of origins. */
export const KIT_ALLOWED_HOSTS = [...new Set(Object.values(ALLOWED_HOSTS).flat())];

/** Allowed external origins: the kit's. Every site serves the kit's security headers. */
export function allowedHosts() {
  return new Set(KIT_ALLOWED_HOSTS);
}

/** A free local port (other sessions may already serve on 8788). */
export const freePort = () =>
  new Promise((resolve, reject) => {
    const srv = createServer().once('error', reject);
    srv.listen(0, '127.0.0.1', () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
  });

/**
 * A wrangler config that serves exactly dist/ (the files publish.sh deploys),
 * whatever the site's own wrangler.jsonc says about `main` or `assets`. Only
 * the compatibility settings come from the site, as publish.sh takes them.
 */
export function gateWranglerConfig(root) {
  let site = {};
  for (const f of ['wrangler.jsonc', 'wrangler.json']) {
    const file = join(root, f);
    if (!existsSync(file)) continue;
    try {
      site = JSON.parse(readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:"'])\/\/.*$/gm, '$1').replace(/,(\s*[}\]])/g, '$1'));
    } catch {}
    break;
  }
  const flags = Array.isArray(site.compatibility_flags) ? site.compatibility_flags.filter((f) => typeof f === 'string') : ['nodejs_compat'];
  return {
    name: 'ra-check-deploy',
    main: join(root, 'dist/_worker.js/index.js'),
    compatibility_date: typeof site.compatibility_date === 'string' ? site.compatibility_date : '2025-09-01',
    compatibility_flags: flags,
    assets: { binding: 'ASSETS', directory: join(root, 'dist') },
  };
}

/**
 * Serves dist/ with `wrangler dev`; resolves when it answers. `gate`: with
 * gateWranglerConfig (check:deploy), else the site's own config.
 */
export async function serveDist(root, port, { gate = false } = {}) {
  port ??= Number(process.env.CHECK_PORT ?? (await freePort()));
  const inspector = await freePort(); // parallel wrangler dev runs clash on the default inspector port
  const base = `http://127.0.0.1:${port}`;
  const config = [];
  if (gate) {
    const dir = mkdtempSync(join(tmpdir(), 'ra-gate-'));
    writeFileSync(join(dir, 'wrangler.json'), JSON.stringify(gateWranglerConfig(root)));
    config.push('--config', join(dir, 'wrangler.json'));
  }
  const server = spawn(
    'pnpm',
    ['exec', 'wrangler', 'dev', ...config, '--port', String(port), '--inspector-port', String(inspector), '--ip', '127.0.0.1', '--log-level', 'error', '--show-interactive-dev-session=false'],
    { cwd: root, stdio: ['ignore', 'ignore', 'inherit'], detached: true },
  );
  const stop = () => {
    try {
      process.kill(-server.pid);
    } catch {}
  };
  process.on('exit', stop);
  let exited = false;
  server.on('exit', () => (exited = true));
  const up = async () => {
    try {
      return (await fetch(`${base}/robots.txt`)).status < 500;
    } catch {
      return false;
    }
  };
  for (let i = 0; i < 120 && !exited && !(await up()); i++) await new Promise((r) => setTimeout(r, 500));
  if (exited || !(await up())) {
    stop();
    throw new Error('wrangler dev did not start');
  }
  return { base, stop };
}

// ---- HTML -------------------------------------------------------------------------
const ATTR_RE = /([^\s"'>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
const decode = (v) => v.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&#x27;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const parseAttrs = (s) => {
  const attrs = new Map();
  for (const m of s.matchAll(ATTR_RE)) {
    const name = m[1].toLowerCase();
    if (!attrs.has(name)) attrs.set(name, decode(m[2] ?? m[3] ?? m[4] ?? ''));
  }
  return attrs;
};

/** Tags of an HTML page: { name, attrs: Map, body? } (body for script and style). */
export function parseTags(html) {
  const tags = [];
  const re = /<(script|style)\b((?:[^>"']|"[^"]*"|'[^']*')*)>([\s\S]*?)<\/\1\s*>|<([a-zA-Z][\w:-]*)((?:[^>"']|"[^"]*"|'[^']*')*)>/gi;
  for (const m of html.replace(/<!--[\s\S]*?-->/g, '').matchAll(re)) {
    tags.push(m[1] ? { name: m[1].toLowerCase(), attrs: parseAttrs(m[2]), body: m[3] } : { name: m[4].toLowerCase(), attrs: parseAttrs(m[5]) });
  }
  return tags;
}

const cssUrls = (css) => [
  ...[...css.matchAll(/url\(\s*(['"]?)([^'")]+)\1\s*\)/gi)].map((m) => m[2]),
  ...[...css.matchAll(/@import\s+(['"])([^'"]+)\1/gi)].map((m) => m[2]),
];
const srcset = (v) => v.split(',').map((s) => s.trim().split(/\s+/)[0]).filter(Boolean);
const LOADING_REL = /\b(stylesheet|preload|modulepreload|icon|apple-touch-icon|manifest|prefetch)\b/i;

/** URLs the browser fetches for this markup (not links, not hints). */
export function loadedUrls(tags) {
  const out = [];
  for (const { name, attrs, body } of tags) {
    const a = (k) => attrs.get(k);
    if (name === 'script' && a('src')) out.push(a('src'));
    if (name === 'link' && a('href') && LOADING_REL.test(a('rel') ?? '')) out.push(a('href'));
    if (['img', 'source', 'video', 'audio', 'track', 'input', 'embed'].includes(name) && a('src')) out.push(a('src'));
    if (['img', 'source'].includes(name)) for (const k of ['srcset', 'imagesrcset']) if (a(k)) out.push(...srcset(a(k)));
    if (name === 'link' && a('imagesrcset')) out.push(...srcset(a('imagesrcset')));
    if (name === 'video' && a('poster')) out.push(a('poster'));
    if ((name === 'image' || name === 'use') && (a('href') || a('xlink:href'))) out.push(a('href') || a('xlink:href'));
    if (name === 'object' && a('data')) out.push(a('data'));
    if (a('style')) out.push(...cssUrls(a('style')));
    if (name === 'style' && body) out.push(...cssUrls(body));
  }
  return out;
}

/** Hosts in fetch directives of a CSP (frame-ancestors is about who frames us). */
const cspHosts = (csp) =>
  csp
    .split(';')
    .map((d) => d.trim().split(/\s+/))
    .filter(([name]) => name && name !== 'frame-ancestors' && name !== 'report-uri' && name !== 'report-to')
    .flatMap(([name, ...srcs]) => srcs.filter((s) => /^(https?:)?\/\/|^[a-z0-9*-]+(\.[a-z0-9-]+)+/i.test(s)).map((s) => [name, s]));

/** Rules on one response: headers + markup. `fail(rule, message)`. */
export function checkPage({ path, headers, html, base, self, allowed }, fail) {
  const csp = headers.get('content-security-policy') ?? '';
  if (!/frame-ancestors/.test(csp)) fail('security-headers', 'CSP header with frame-ancestors missing (keep sitesKit() in astro.config.mjs integrations)');
  if (/script-src[^;]*'unsafe-inline'/.test(csp)) fail('security-headers', "CSP script-src allows 'unsafe-inline' (keep the kit's security headers as shipped)");
  for (const [d, h] of cspHosts(csp)) {
    let origin = h;
    try {
      origin = new URL(h.startsWith('//') ? `https:${h}` : /^https?:/.test(h) ? h : `https://${h}`).origin;
    } catch {}
    if (!allowed.has(origin)) fail('security-headers', `CSP ${d} allows ${h}, which is not in ALLOWED_HOSTS`);
  }
  if ((headers.get('x-content-type-options') ?? '').toLowerCase() !== 'nosniff') fail('security-headers', 'security header X-Content-Type-Options: nosniff missing');
  for (const h of ['referrer-policy', 'permissions-policy']) if (!headers.get(h)) fail('security-headers', `security header ${h} missing`);
  if (!/text\/html/.test(headers.get('content-type') ?? '')) return;

  const tags = parseTags(html);
  const inline = tags.filter((t) => t.name === 'script' && !t.attrs.has('src') && JS_TYPES.has((t.attrs.get('type') ?? '').toLowerCase()) && t.body?.trim());
  if (inline.length) fail('inline-script', `${inline.length} inline <script> without src: use a plain <script> (bundled, never is:inline with a body) and keep vite.build.assetsInlineLimit in astro.config.mjs`);
  const handlers = tags.flatMap((t) => [...t.attrs.keys()].filter((k) => /^on[a-z]/.test(k)).map((k) => `${t.name}[${k}]`));
  if (handlers.length) fail('inline-handler', `inline event handler ${[...new Set(handlers)].slice(0, 3).join(', ')}: use addEventListener in a <script>`);
  for (const t of tags.filter((t) => ['iframe', 'frame', 'embed', 'object'].includes(t.name))) {
    const src = t.attrs.get('src') || t.attrs.get('data') || '(no src)';
    fail('iframe', /openstreetmap|google\.[a-z.]+\/maps|maps\.google/.test(src) ? `map <${t.name}> (${src.slice(0, 60)}): use ListingsMap, a static tile map or a link to the map` : `<${t.name}> ${src.slice(0, 60)}: no iframes or embeds on the site`);
  }
  for (const f of tags.filter((t) => t.name === 'form')) {
    const action = f.attrs.get('action') ?? '';
    const method = (f.attrs.get('method') || 'get').toLowerCase();
    let target = null;
    try {
      target = new URL(action || path, base);
    } catch {}
    if (/^mailto:/i.test(action)) fail('forms', `form posts to ${action}: use EnquiryForm`);
    else if (target && target.origin !== base && !self.has(target.origin)) fail('forms', `form sends to ${action} off the site: use EnquiryForm (/api/enquiry)`);
    else if (method === 'post' && target?.pathname !== '/api/enquiry') fail('forms', `POST form to "${action}": every form uses EnquiryForm (/api/enquiry)`);
  }
  if (DEVELOPMENT_PAGE.test(path)) {
    const problem = developmentEnquiryProblem(tags);
    if (problem) fail('development-enquiry', problem);
  }
  const services = tags
    .filter((t) => ['script', 'iframe', 'form', 'link', 'embed', 'object'].includes(t.name))
    .map((t) => t.attrs.get('src') || t.attrs.get('action') || t.attrs.get('href') || t.attrs.get('data') || '');
  for (const u of new Set(services)) if (u && FORM_SERVICES.test(u)) fail('form-service', `third-party form service ${u.slice(0, 80)}: use EnquiryForm`);
  return tags;
}

const DEVELOPMENT_PAGE = /^\/developments\/[^/]+$/;

/**
 * A development page with an enquiry form must send `developmentId`, and a
 * unit while the development has units to ask about: a `lotId` select is
 * `required`, and a page whose unit rows link `?lot=<id>` has one. A page
 * without unit rows (every unit sold, none published) sends the development alone.
 * Returns the problem, or null.
 */
export function developmentEnquiryProblem(tags) {
  const forms = tags.filter((t) => t.name === 'form' && /\/api\/enquiry$/.test(t.attrs.get('action') ?? ''));
  if (!forms.length) return null;
  const named = (n) => tags.filter((t) => ['input', 'select'].includes(t.name) && t.attrs.get('name') === n);
  if (!named('developmentId').some((t) => t.attrs.get('value'))) {
    return 'development enquiry form without developmentId: use <EnquiryForm developmentId={dev.id} …> (a name in the message does not link the enquiry to the development)';
  }
  const lots = named('lotId');
  if (lots.some((t) => t.name === 'select' && !t.attrs.has('required'))) {
    return 'development enquiry unit select (lotId) is optional: every development enquiry is filed on a unit; use <EnquiryForm developmentId={dev.id} units={unitOptions(dev.units)} …> (it renders the select required)';
  }
  const unitLinks = tags.some((t) => t.name === 'a' && /[?&]lot=[^&#]+/.test(t.attrs.get('href') ?? ''));
  if (!lots.length && unitLinks) {
    return 'development enquiry form without a unit (lotId) while the page lists units to enquire about: pass units={unitOptions(dev.units)} (and selectedUnit from ?lot=) to <EnquiryForm developmentId={dev.id} …>';
  }
  return null;
}

/** Origins outside the site and ALLOWED_HOSTS in a list of URLs. */
export function offHosts(urls, { base, self, allowed }) {
  const out = new Set();
  for (const raw of urls) {
    if (!/^(https?:)?\/\//i.test(raw.trim())) continue;
    let u;
    try {
      u = new URL(raw.trim(), base);
    } catch {
      continue;
    }
    if (u.origin !== base && !self.has(u.origin) && !allowed.has(u.origin)) out.add(u.origin + u.pathname.slice(0, 40));
  }
  return [...out];
}

// ---- same-origin assets ---------------------------------------------------------------
const ASSET_KIND = (url, hint) => {
  if (hint === 'style' || /\.css$/i.test(url)) return 'css';
  if (hint === 'script' || /\.m?js$/i.test(url)) return 'js';
  if (hint === 'font' || /\.(woff2?|ttf|otf)$/i.test(url)) return 'font';
  return 'other';
};
const KIND_TYPE = { css: /text\/css/i, js: /(java|ecma)script/i, font: /font|octet-stream/i };

/**
 * Same-origin files a page loads: <script src>, stylesheets, preloads and
 * modulepreloads. [{ url, kind }] (absolute URLs on `base`).
 */
export function pageAssets(tags, pageUrl, base, self = new Set()) {
  const out = [];
  for (const { name, attrs } of tags) {
    let raw = null;
    let hint;
    const rel = (attrs.get('rel') ?? '').toLowerCase();
    if (name === 'script' && attrs.get('src')) [raw, hint] = [attrs.get('src'), 'script'];
    else if (name === 'link' && attrs.get('href') && /\b(stylesheet|preload|modulepreload)\b/.test(rel)) {
      raw = attrs.get('href');
      hint = /\bstylesheet\b/.test(rel) ? 'style' : /\bmodulepreload\b/.test(rel) ? 'script' : attrs.get('as');
    }
    if (!raw) continue;
    let u;
    try {
      u = new URL(raw, pageUrl);
    } catch {
      continue;
    }
    if (u.origin !== base && !self.has(u.origin)) continue;
    out.push({ url: `${base}${u.pathname}${u.search}`, kind: ASSET_KIND(u.pathname, hint) });
  }
  return out;
}

/**
 * Files a built script or stylesheet loads in turn: relative imports
 * (`import("./leaflet.js")`, `from"./chunk.js"`), Vite's preload list
 * (`"_astro/leaflet.css"`, from the site root) and same-origin CSS url() / @import.
 */
export function assetRefs(text, fileUrl, kind, base) {
  const refs = new Set();
  if (kind === 'js') {
    for (const m of text.matchAll(/(?:\bimport\s*\(\s*|\bfrom\s*|\bimport\s*)["'`](\.{1,2}\/[^"'`\s]+)["'`]/g)) refs.add(new URL(m[1], fileUrl).href);
    for (const m of text.matchAll(/["'`]\/?(_astro\/[A-Za-z0-9._@~/-]+\.[A-Za-z0-9]+)["'`]/g)) refs.add(`${base}/${m[1]}`);
  } else if (kind === 'css') {
    for (const raw of cssUrls(text)) {
      if (/^(data:|#)/i.test(raw.trim())) continue;
      try {
        const u = new URL(raw.trim(), fileUrl);
        if (u.origin === base) refs.add(u.href);
      } catch {}
    }
  }
  return [...refs].map((url) => ({ url, kind: ASSET_KIND(new URL(url).pathname) }));
}

/**
 * Every same-origin asset a page loads, and what those load, answers 200 with
 * its content type (a CSS file answering the 404 page as text/html is
 * "Refused to apply style", and a dynamic import that preloads it never runs).
 * `seen` caches results across pages. Returns problem messages.
 */
export async function checkAssets(assets, { base, seen, fetchImpl = fetch, from = null, limit = 300 }) {
  const problems = [];
  const queue = assets.map((a) => ({ ...a, from }));
  while (queue.length) {
    const a = queue.shift();
    if (seen.has(a.url)) continue;
    if (seen.size >= limit) break;
    seen.add(a.url);
    const res = await fetchImpl(a.url, { redirect: 'follow' }).catch((e) => e);
    const path = a.url.slice(base.length);
    const by = a.from ? ` (loaded by ${a.from.slice(base.length)})` : '';
    if (res instanceof Error) {
      problems.push(`${path}${by}: no answer (${res.message})`);
      continue;
    }
    const type = res.headers.get('content-type') ?? '';
    const want = KIND_TYPE[a.kind];
    if (res.status !== 200 || (want && !want.test(type)) || (!want && /text\/html/i.test(type) && !/\.html?$/i.test(path))) {
      const hint = a.kind === 'css' && /\/_astro\//.test(path)
        ? ': the build did not ship it (Astro inlined the stylesheet but a script still loads it): drop build.inlineStylesheets from astro.config.mjs, or keep sitesKit() in its integrations (it ships them)'
        : /\/_astro\//.test(path) ? ': the build did not ship it (rebuild; never edit dist/)' : ': put the file in public/ or fix the path';
      problems.push(`${path}${by} answers HTTP ${res.status}${type ? ` ${type.split(';')[0]}` : ''}${hint}`);
      await res.body?.cancel?.().catch(() => {});
      continue;
    }
    if (a.kind === 'js' || a.kind === 'css') {
      const text = await res.text().catch(() => '');
      for (const r of assetRefs(text, a.url, a.kind, base)) if (!seen.has(r.url)) queue.push({ ...r, from: a.url });
    } else await res.body?.cancel?.().catch(() => {});
  }
  return problems;
}

// ---- legal pages per language -----------------------------------------------------------
/**
 * Legal link labels per language (lowercase). A label is "foreign" on a page
 * when another language has it and the page's language does not. Words shared
 * across languages (Impressum, Privacy) are left out.
 */
export const LEGAL_LABELS = {
  de: ['datenschutz', 'datenschutzerklärung', 'rechtliche hinweise', 'nutzungsbedingungen'],
  fr: ['mentions légales', 'politique de confidentialité', 'confidentialité', 'protection des données', 'conditions générales', 'politique de cookies'],
  it: ['note legali', 'informativa sulla privacy', 'protezione dei dati', 'condizioni generali'],
  es: ['aviso legal', 'política de privacidad', 'privacidad', 'protección de datos', 'condiciones generales'],
  en: ['legal notice', 'legal', 'privacy policy', 'data protection', 'terms and conditions', 'terms of use', 'cookie policy'],
};
const LEGAL_PATH = /\/(legal|privacy|privacy-policy|legal-notice|imprint|impressum|datenschutz(erklaerung)?|mentions-legales|confidentialite|politique-de-confidentialite|protection-des-donnees|note-legali|informativa-privacy|aviso-legal|privacidad|politica-de-privacidad)\/?$/i;
const LANG_PREFIX = /^\/(de|fr|it|es|en)(\/|$)/;
const ENTITY = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', eacute: 'é', egrave: 'è', agrave: 'à', ecirc: 'ê', ccedil: 'ç', uuml: 'ü', ouml: 'ö', auml: 'ä', iacute: 'í', oacute: 'ó', aacute: 'á', uacute: 'ú', ntilde: 'ñ' };
const textOf = (html) =>
  html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => (e[0] === '#' ? String.fromCodePoint(e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : Number(e.slice(1))) : ENTITY[e.toLowerCase()] ?? m))
    .replace(/\s+/g, ' ')
    .trim();
export const htmlLang = (html) => (/<html\b[^>]*?\blang\s*=\s*["']?([a-zA-Z]{2})/i.exec(html)?.[1] ?? '').toLowerCase();

/** The <a> elements of a page: [{ href, text }] (text lowercased, tags stripped). */
export function anchors(html) {
  return [...html.replace(/<!--[\s\S]*?-->/g, '').matchAll(/<a\b((?:[^>"']|"[^"]*"|'[^']*')*)>([\s\S]*?)<\/a\s*>/gi)].map((m) => ({
    href: parseAttrs(m[1]).get('href') ?? '',
    text: textOf(m[2]).toLowerCase(),
  }));
}

/** A legal label of another language on a page in `lang`, or null. */
export function foreignLegalLabel(text, lang) {
  if (!lang || LEGAL_LABELS[lang]?.includes(text)) return null;
  for (const [l, labels] of Object.entries(LEGAL_LABELS)) if (l !== lang && labels.includes(text)) return l;
  return null;
}

/**
 * Each language version links legal pages in its own language, under labels
 * in its own language: an English page linking the French /legal, or showing
 * "Mentions légales", fails. Pages: the sampled ones, plus each language's
 * home (hreflang links, /en-style sitemap paths, language links on home).
 * `pages`: Map path -> { html } (fetched 200 pages; more are added here).
 */
export async function legalLanguageProblems({ base, pages, locs = [], fetchImpl = fetch }) {
  const problems = [];
  const paths = locs.map((l) => {
    try {
      return new URL(l).pathname;
    } catch {
      return '';
    }
  });
  const get = async (p) => {
    if (pages.has(p)) return pages.get(p);
    const res = await fetchImpl(`${base}${p}`).catch(() => null);
    const html = res && res.status === 200 && /text\/html/.test(res.headers.get('content-type') ?? '') ? await res.text().catch(() => '') : null;
    const entry = html ? { html, status: 200 } : { html: null, status: res?.status ?? 0 };
    pages.set(p, entry);
    return entry;
  };
  // Language homes: hreflang alternates of the sampled pages, /xx paths in the sitemap, /xx links on home.
  const extra = new Set();
  for (const { html } of [...pages.values()]) {
    if (!html) continue;
    for (const t of parseTags(html)) {
      if (t.name !== 'link' || !/\balternate\b/i.test(t.attrs.get('rel') ?? '') || !t.attrs.get('hreflang') || t.attrs.get('hreflang') === 'x-default') continue;
      try {
        extra.add(new URL(t.attrs.get('href'), base).pathname);
      } catch {}
    }
  }
  const byLang = new Map();
  for (const p of paths) {
    const m = LANG_PREFIX.exec(p);
    if (m && (!byLang.has(m[1]) || p.length < byLang.get(m[1]).length)) byLang.set(m[1], p);
  }
  for (const p of byLang.values()) extra.add(p);
  for (const a of anchors(pages.get('/')?.html ?? '')) if (/^\/(de|fr|it|es|en)\/?$/.test(a.href)) extra.add(a.href);
  for (const p of [...extra].slice(0, 8)) await get(p);

  const seenTarget = new Map(); // target path -> problem key, one finding per (page lang, target)
  for (const [path, { html }] of [...pages]) {
    if (!html) continue;
    const lang = htmlLang(html) || LANG_PREFIX.exec(path)?.[1] || '';
    if (!lang) continue;
    const labels = new Set();
    const targets = new Set();
    for (const a of anchors(html)) {
      const foreign = foreignLegalLabel(a.text, lang);
      if (foreign) labels.add(`"${a.text}" (${foreign})`);
      let u;
      try {
        u = new URL(a.href, `${base}${path}`);
      } catch {
        continue;
      }
      if (u.origin !== base) continue;
      const labelled = Object.values(LEGAL_LABELS).some((l) => l.includes(a.text)) || /^(impressum|privacy|imprint)$/.test(a.text);
      if (LEGAL_PATH.test(u.pathname) || labelled) targets.add(u.pathname);
    }
    if (labels.size) problems.push({ page: path, message: `the "${lang}" page shows legal links in another language: ${[...labels].slice(0, 3).join(', ')}. Use t('legalNotice' | 'privacyPolicy', {}, lang(locale)) from @realadvisor/sites-kit-core/i18n in the footer of every language` });
    for (const target of targets) {
      const key = `${lang}\0${target}`;
      if (seenTarget.has(key)) continue;
      seenTarget.set(key, true);
      const t = await get(target);
      if (!t.html) continue; // a missing legal page fails the http rule (HTTP 404)
      const tl = htmlLang(t.html) || LANG_PREFIX.exec(target)?.[1] || '';
      if (tl && tl !== lang) {
        problems.push({ page: path, message: `the "${lang}" page links to ${target}, a "${tl}" page: link legalPath(locale) / privacyPath(locale) from @realadvisor/sites-kit-core/i18n, served by src/pages/[lang]/legal.astro and privacy.astro (/${lang}/legal, /${lang}/privacy)` });
      }
    }
  }
  return problems;
}

/**
 * set:html: only a single sanitizeHtml(...) or safeJsonLd(...) call (no nested
 * calls, operators or method chains after it) and ListingsSearch's card slot
 * may render HTML; literals are fine.
 */
export function unsafeHtml(root) {
  const out = [];
  const dir = join(root, 'src');
  const walk = (d) =>
    existsSync(d)
      ? readdirSync(d).flatMap((f) => {
          const p = join(d, f);
          return statSync(p).isDirectory() ? walk(p) : /\.(astro|tsx?|jsx?|mdx?)$/.test(f) ? [p] : [];
        })
      : [];
  for (const file of walk(dir)) {
    const rel = relative(root, file);
    for (const m of readFileSync(file, 'utf8').matchAll(/set:html=\{([^}]*)\}/g)) {
      const expr = m[1].trim();
      if (/^(sanitizeHtml|safeJsonLd)\([^()]*\)$/.test(expr) || /^(['"])[^'"]*\1$/.test(expr) || /^`[^`$]*`$/.test(expr)) continue;
      // ListingsSearch renders the page's card slot (Astro.slots.render: HTML Astro already escaped).
      if (rel.endsWith('components/ListingsSearch.astro') && expr === 'cards[i]') continue;
      out.push({ page: rel, message: `set:html={${expr.slice(0, 40)}} renders unescaped data: use set:html={sanitizeHtml(…)} from @realadvisor/sites-kit-core (or safeJsonLd for JSON-LD)` });
    }
  }
  return out;
}

/** Pages to check: home, listings, 2 listings, contact, legal, privacy (from the sitemap), and a 404. */
export function samplePages(locs) {
  const paths = locs.map((l) => {
    try {
      return new URL(l).pathname;
    } catch {
      return '';
    }
  });
  const pick = new Set(['/']);
  for (const p of ['/listings', '/contact', '/legal', '/privacy']) if (paths.includes(p)) pick.add(p);
  if (pick.has('/listings')) pick.add('/listings?view=map'); // map search: tiles, script, no inline JS
  // Developments (index + first page) when the site has them.
  for (const p of [paths.find((x) => x === '/developments'), paths.find((x) => /^\/developments\/[^/]+$/.test(x))]) if (p) pick.add(p);
  paths.filter((p) => LISTING_PATH.test(p)).slice(0, 2).forEach((p) => pick.add(p));
  return [...pick];
}

/**
 * Pages that must answer 404/410 with a full page: an unknown path, and an
 * unknown listing next to the sitemap's listings (an unknown slug, and a
 * slug with a listing id that is not on the site: a listing that left).
 */
export function missingPages(locs) {
  const paths = locs.map((l) => {
    try {
      return new URL(l).pathname;
    } catch {
      return '';
    }
  });
  const listing = paths.find((p) => LISTING_PATH.test(p));
  const dir = listing ? listing.slice(0, listing.lastIndexOf('/')) : '/listings';
  const devs = paths.includes('/developments') ? ['/developments/ra-check-missing'] : [];
  return ['/__ra-check-deploy-404', `${dir}/ra-check-missing`, `${dir}/ra-check-gone-00000000-0000-4000-8000-000000000000`, ...devs];
}

async function main() {
  const t0 = Date.now();
  const root = process.cwd();
  const args = process.argv.slice(2);
  const problems = [];
  const fail = (page, rule, message) => problems.push({ page, rule, message: String(message) });
  const pages = [];
  const finish = (code) => {
    // One line per finding: the same message on several pages names the first and the count.
    const grouped = new Map();
    for (const p of problems) {
      const key = `${p.rule}\0${p.message}`;
      const g = grouped.get(key);
      if (g) g.n++;
      else grouped.set(key, { ...p, n: 1 });
    }
    problems.splice(0, problems.length, ...[...grouped.values()].map(({ n, ...p }) => ({ ...p, page: n > 1 ? `${p.page} (+${n - 1} more)` : p.page })));
    for (const p of problems) console.log(`FAIL ${p.page}: ${p.message}`);
    console.log(problems.length ? `\ncheck:deploy FAILED (${problems.length})` : '\ncheck:deploy OK');
    console.log(JSON.stringify({ ok: !problems.length, problems, pages, ms: Date.now() - t0 }));
    process.exit(code ?? (problems.length ? 1 : 0));
  };

  const allowed = allowedHosts();
  for (const u of unsafeHtml(root)) fail(u.page, 'unsafe-html', u.message);

  if (!args.includes('--no-build')) {
    console.log('Building (pnpm build)…');
    if (spawnSync('pnpm', ['build'], { cwd: root, stdio: 'inherit' }).status !== 0) {
      fail('build', 'build', '`pnpm build` failed');
      return finish();
    }
  }
  if (!existsSync(join(root, 'dist/_worker.js/index.js'))) {
    fail('build', 'build', 'no dist/_worker.js/index.js: build the site first');
    return finish();
  }
  // A leaking build is never served, not even locally: rebuild it first.
  const leaks = buildLeaks(join(root, 'dist'));
  for (const l of leaks.slice(0, 10)) fail(`dist/${l.file}`, 'secret-leak', l.message);
  if (leaks.length) return finish();

  let server;
  try {
    server = await serveDist(root, undefined, { gate: true });
  } catch (e) {
    fail('server', 'http', e.message);
    return finish();
  }
  const { base } = server;
  try {
    const sm = await fetch(`${base}/sitemap.xml`).catch(() => null);
    const locs = sm?.ok ? [...(await sm.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim()) : [];
    // The site's own public origin (SITE_URL) counts as this site.
    const self = new Set(locs.slice(0, 1).map((l) => new URL(l).origin));
    const ctx = { base, self, allowed };
    const cssSeen = new Set();
    const assetsSeen = new Set();
    const pageHtml = new Map(); // path -> { html, tags } of the 200 pages, for the legal-language rule
    const missing = missingPages(locs);
    for (const path of [...samplePages(locs), ...missing]) {
      const res = await fetch(`${base}${path}`, { redirect: 'manual' }).catch((e) => e);
      if (res instanceof Error) {
        fail(path, 'http', `no answer: ${res.message}`);
        continue;
      }
      pages.push(path);
      if (res.status >= 500) {
        fail(path, 'http', `HTTP ${res.status}${missing.includes(path) ? ' for a page that does not exist (want 404/410: keep the not-found block of src/pages/listings/[slug].astro and src/pages/404.astro with prerender = false)' : ''}`);
        continue;
      }
      if (missing.includes(path) && res.status !== 404 && res.status !== 410) {
        fail(path, 'not-found', `HTTP ${res.status} for a page that does not exist (want 404, or 410 for a listing that left the site)`);
      }
      if (missing.includes(path) && (res.status === 404 || res.status === 410)) {
        const body = await res.clone().text().catch(() => '');
        if (!/<\/html>/i.test(body)) fail(path, 'not-found', `HTTP ${res.status} with an empty or cut body: show the site's 404 page`);
      }
      if (res.status >= 300 && res.status < 400) continue;
      const html = await res.text().catch(() => null);
      if (/text\/html/.test(res.headers.get('content-type') ?? '') && res.status === 200) {
        // Astro streams: a render error after the headers leaves a 200 with an empty or cut body.
        if (html == null || !html.replace(/<!doctype html>/i, '').trim()) {
          fail(path, 'empty-page', 'HTTP 200 with an empty body: the page failed to render (keep sitesKit() in astro.config.mjs, guard optional fields)');
          continue;
        }
        if (/<html[\s>]/i.test(html) && !/<\/html>/i.test(html)) fail(path, 'empty-page', 'HTTP 200 with a cut body (no </html>): the page failed to render mid-page');
      }
      if (html == null) continue;
      const tags = checkPage({ path, headers: res.headers, html, ...ctx }, (rule, m) => fail(path, rule, m)) ?? [];
      const urls = loadedUrls(tags);
      // Same-origin stylesheets: their url() and @import load too.
      for (const t of tags.filter((t) => t.name === 'link' && /stylesheet/i.test(t.attrs.get('rel') ?? '') && t.attrs.get('href'))) {
        const u = new URL(t.attrs.get('href'), `${base}${path}`);
        if (u.origin !== base || cssSeen.has(u.pathname)) continue;
        cssSeen.add(u.pathname);
        const css = await fetch(u).then((r) => (r.ok ? r.text() : '')).catch(() => '');
        urls.push(...cssUrls(css));
      }
      for (const h of offHosts(urls, ctx).slice(0, 5)) fail(path, 'hosts', `loads from external host ${h}: self-host it in public/, or use RaImage for photos (allowed: ALLOWED_HOSTS in @realadvisor/sites-kit-core/security)`);
      for (const m of (await checkAssets(pageAssets(tags, `${base}${path}`, base, self), { base, seen: assetsSeen })).slice(0, 5)) fail(path, 'assets', m);
      if (res.status === 200) pageHtml.set(path, { html, tags });
    }
    for (const p of await legalLanguageProblems({ base, pages: pageHtml, locs })) fail(p.page, 'legal-language', p.message);
  } finally {
    server.stop();
  }
  finish();
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
