#!/usr/bin/env node
/**
 * Deploy gate of a React Router site: the Astro kit's check:deploy rules
 * (kit/tools/check-deploy.mjs, imported, not copied) run against the
 * built Worker, plus the nonce rules of the React kit.
 *
 *   pnpm check:deploy              # build, then check
 *   pnpm check:deploy --no-build   # check the build/ that is there
 *
 * Serves build/ with `wrangler dev` (build/server/wrangler.json, what
 * publish deploys) and requests: one page of every route in the sitemap,
 * `?view=map` of every search page, legal and privacy of every language,
 * an unknown path, an unknown listing and a listing that left (404/410).
 *
 * FAIL (exit 1) on, per page:
 * - the Astro kit's rules: security headers, CSP hosts only from
 *   ALLOWED_HOSTS, no 'unsafe-inline' in script-src, no inline handlers,
 *   iframes, off-site or non-enquiry POST forms, form services, external
 *   hosts, broken same-origin assets, legal links per language, empty or
 *   cut 200 bodies, missing pages that do not answer 404/410 with a page;
 * - nonce: script-src has exactly one 'nonce-…' (>= 128 bits, base64) and
 *   otherwise equals the kit's CSP; a second request gets another nonce;
 *   every <script> (inline, src, JSON-LD) carries the response's nonce;
 * - static files: build/client/_headers gives assets the kit's headers
 *   (no nonce) and an asset answers with them;
 * - the enquiry endpoint: an invalid POST is a 400 `invalid`, a valid one
 *   `{ preview: true }` (the gate runs as a preview: nothing is sent);
 * - source: `dangerouslySetInnerHTML` in app/ only as `{{ __html: sanitizeHtml(...) }}`
 *   or `safeJsonLd(...)`; HTML sanitized earlier (in the loader) goes
 *   through the kit's `sanitized()` + `<SafeHtml>` (typed: tsc checks it);
 * - secrets in build/ (the kit's secret-leaks).
 *
 * Output: "FAIL <page>: <reason>" lines, then a JSON summary as the last line.
 */
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  allowedHosts,
  checkAssets,
  checkPage,
  freePort,
  legalLanguageProblems,
  loadedUrls,
  offHosts,
  pageAssets,
  parseTags,
} from '@realadvisor/sites-kit-core/tools/check-deploy.mjs';
import { buildLeaks } from '@realadvisor/sites-kit-core/tools/secret-leaks.mjs';
import { csp as kitCsp } from '@realadvisor/sites-kit-core/security';

const JS_TYPES = new Set(['', 'module', 'text/javascript', 'application/javascript']);
const LISTING_PATH = /^\/[^/]+\/[^/]+-[0-9a-f]{8}-[0-9a-f]{4}-/i;
const NONCE_SRC = /'nonce-([^']*)'/g;

/** The nonce of a CSP header and the problems with it (one nonce, base64, >= 16 bytes, rest = kit CSP). */
export function nonceOf(csp, preview) {
  const problems = [];
  const script = csp.split(';').map((d) => d.trim()).find((d) => d.startsWith('script-src ')) ?? '';
  const nonces = [...script.matchAll(NONCE_SRC)].map((m) => m[1]);
  if (nonces.length !== 1) problems.push(`script-src has ${nonces.length} nonces (want exactly one per response)`);
  const nonce = nonces[0] ?? '';
  if (nonce && (!/^[A-Za-z0-9+/]+={0,2}$/.test(nonce) || Buffer.from(nonce, 'base64').length < 16)) problems.push(`nonce "${nonce}" is not 128+ random bits in base64`);
  if ([...csp.matchAll(NONCE_SRC)].length !== nonces.length) problems.push('a nonce outside script-src');
  if (/'strict-dynamic'|'unsafe-hashes'|'sha(256|384|512)-/.test(csp)) problems.push("CSP has a hash or 'strict-dynamic': only the kit's sources and one nonce are allowed");
  const without = csp.replace(/ 'nonce-[^']*'/g, '');
  for (const mode of [preview, !preview]) if (without === kitCsp(mode)) return { nonce, problems };
  problems.push(`CSP (without its nonce) differs from the kit's: ${without}`);
  return { nonce, problems };
}

/** <script> tags of a page without the response's nonce: [{ what }]. */
export function scriptsWithoutNonce(tags, nonce) {
  const out = [];
  for (const t of tags.filter((x) => x.name === 'script')) {
    if (t.attrs.get('nonce') === nonce && nonce) continue;
    const type = (t.attrs.get('type') ?? '').toLowerCase();
    const what = t.attrs.get('src') ? `<script src="${t.attrs.get('src').slice(0, 60)}">` : JS_TYPES.has(type) ? `inline <script> (${(t.body ?? '').trim().slice(0, 40)}…)` : `<script type="${type}">`;
    out.push({ what, inline: !t.attrs.get('src') && JS_TYPES.has(type) && !!t.body?.trim() });
  }
  return out;
}

/** The page with its nonce'd inline scripts taken out: what the Astro rules see (they allow none). */
const withoutNoncedInline = (html, nonce) =>
  nonce ? html.replace(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi, (m, attrs) => (new RegExp(`\\bnonce=["']?${nonce.replace(/[+/=]/g, '\\$&')}["']?`).test(attrs) ? '' : m)) : html;

/** dangerouslySetInnerHTML in the site's source only through sanitizeHtml(...) or safeJsonLd(...); <SafeHtml> for HTML sanitized in the loader. */
export function unsafeHtml(root) {
  const out = [];
  const walk = (d) =>
    existsSync(d)
      ? readdirSync(d).flatMap((f) => {
          const p = join(d, f);
          return statSync(p).isDirectory() ? walk(p) : /\.(tsx?|jsx?)$/.test(f) ? [p] : [];
        })
      : [];
  for (const file of walk(join(root, 'app'))) {
    for (const m of readFileSync(file, 'utf8').matchAll(/dangerouslySetInnerHTML=\{\{\s*__html:\s*([^}]*)\}\}/g)) {
      const expr = m[1].trim();
      if (/^(sanitizeHtml|safeJsonLd)\([^()]*(\([^()]*\))?[^()]*\)$/.test(expr)) continue;
      out.push({ page: relative(root, file), message: `dangerouslySetInnerHTML={{ __html: ${expr.slice(0, 40)} }} renders unescaped HTML: use sanitizeHtml(…) from @realadvisor/sites-kit-core, or sanitized() in the loader + <SafeHtml> from @realadvisor/sites-kit-react (or <JsonLd>)` });
    }
    // Any other form (a variable, a spread object) cannot be read here: <SafeHtml> is the typed way.
    for (const m of readFileSync(file, 'utf8').matchAll(/dangerouslySetInnerHTML=\{(?!\{)\s*([^}]{0,60})/g)) {
      out.push({ page: relative(root, file), message: `dangerouslySetInnerHTML={${m[1].trim().slice(0, 40)}} cannot be checked: use sanitized() in the loader + <SafeHtml html={…}> from @realadvisor/sites-kit-react` });
    }
  }
  return out;
}

/** One sample path per route pattern of the sitemap (first segment + depth), legal pages all. */
export function samplePages(locs) {
  const paths = locs.map((l) => { try { return new URL(l).pathname; } catch { return ''; } }).filter(Boolean);
  const seen = new Set();
  const pick = [];
  for (const p of paths) {
    const segs = p.split('/').filter(Boolean);
    const key = segs.length <= 1 ? p : `${segs[0]}/*${segs.length}`;
    if (/\/(legal|privacy)$/.test(p) || !seen.has(key)) pick.push(p);
    seen.add(key);
  }
  // A second listing (a sold one may render differently).
  const listings = paths.filter((p) => LISTING_PATH.test(p));
  if (listings[1] && !pick.includes(listings[1])) pick.push(listings[1]);
  return pick;
}

export function missingPages(locs) {
  const paths = locs.map((l) => { try { return new URL(l).pathname; } catch { return ''; } });
  const listing = paths.find((p) => LISTING_PATH.test(p));
  const dir = listing ? listing.slice(0, listing.lastIndexOf('/')) : '/listings';
  return ['/__ra-check-deploy-404', `${dir}/ra-check-missing`, `${dir}/ra-check-gone-00000000-0000-4000-8000-000000000000`];
}

async function serve(root) {
  const port = Number(process.env.CHECK_PORT ?? (await freePort()));
  const inspector = await freePort();
  const base = `http://127.0.0.1:${port}`;
  const server = spawn(
    'pnpm',
    ['exec', 'wrangler', 'dev', '--config', 'build/server/wrangler.json', '--port', String(port), '--inspector-port', String(inspector), '--ip', '127.0.0.1', '--log-level', 'error', '--show-interactive-dev-session=false', '--persist-to', join(root, '.wrangler/check-deploy')],
    { cwd: root, stdio: ['ignore', 'ignore', 'inherit'], detached: true },
  );
  const stop = () => { try { process.kill(-server.pid); } catch {} };
  process.on('exit', stop);
  let exited = false;
  server.on('exit', () => (exited = true));
  const up = async () => { try { return (await fetch(`${base}/robots.txt`)).status < 500; } catch { return false; } };
  for (let i = 0; i < 120 && !exited && !(await up()); i++) await new Promise((r) => setTimeout(r, 500));
  if (exited || !(await up())) { stop(); throw new Error('wrangler dev did not start'); }
  return { base, stop };
}

async function main() {
  const t0 = Date.now();
  const root = process.cwd();
  const args = process.argv.slice(2);
  const problems = [];
  const pages = [];
  const fail = (page, rule, message) => problems.push({ page, rule, message: String(message) });
  const finish = () => {
    const grouped = new Map();
    for (const p of problems) {
      const key = `${p.rule}\0${p.message}`;
      const g = grouped.get(key);
      if (g) g.n++;
      else grouped.set(key, { ...p, n: 1 });
    }
    const list = [...grouped.values()].map(({ n, ...p }) => ({ ...p, page: n > 1 ? `${p.page} (+${n - 1} more)` : p.page }));
    for (const p of list) console.log(`FAIL ${p.page}: ${p.message}`);
    console.log(list.length ? `\ncheck:deploy FAILED (${list.length})` : `\ncheck:deploy OK (${pages.length} requests)`);
    console.log(JSON.stringify({ ok: !list.length, problems: list, pages, ms: Date.now() - t0 }));
    process.exit(list.length ? 1 : 0);
  };

  for (const u of unsafeHtml(root)) fail(u.page, 'unsafe-html', u.message);
  if (!args.includes('--no-build')) {
    console.log('Building (pnpm build)…');
    if (spawnSync('pnpm', ['build'], { cwd: root, stdio: 'inherit' }).status !== 0) {
      fail('build', 'build', '`pnpm build` failed');
      return finish();
    }
  }
  if (!existsSync(join(root, 'build/server/wrangler.json'))) {
    fail('build', 'build', 'no build/server/wrangler.json: build the site first');
    return finish();
  }
  const leaks = buildLeaks(join(root, 'build'));
  for (const l of leaks.slice(0, 10)) fail(`build/${l.file}`, 'secret-leak', l.message);
  if (leaks.length) return finish();
  const headersFile = join(root, 'build/client/_headers');
  if (!existsSync(headersFile) || !/content-security-policy:/.test(readFileSync(headersFile, 'utf8'))) {
    fail('build/client/_headers', 'security-headers', 'no _headers with the CSP for static files: keep sitesKit() in vite.config.ts');
  }

  let server;
  try {
    server = await serve(root);
  } catch (e) {
    fail('server', 'http', e.message);
    return finish();
  }
  const { base } = server;
  try {
    const sm = await fetch(`${base}/sitemap.xml`).catch(() => null);
    const locs = sm?.ok ? [...(await sm.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim()) : [];
    if (!locs.length) fail('/sitemap.xml', 'http', 'no sitemap.xml with <loc> entries');
    const self = new Set(locs.slice(0, 1).map((l) => new URL(l).origin));
    const ctx = { base, self, allowed: allowedHosts() };
    const assetsSeen = new Set();
    const pageHtml = new Map();
    const missing = missingPages(locs);
    const queue = [...samplePages(locs), ...missing];
    const nonces = new Set();
    for (let qi = 0; qi < queue.length; qi++) {
      const path = queue[qi];
      const res = await fetch(`${base}${path}`, { redirect: 'manual' }).catch((e) => e);
      if (res instanceof Error) { fail(path, 'http', `no answer: ${res.message}`); continue; }
      pages.push(path);
      const isMissing = missing.includes(path);
      if (res.status >= 500) { fail(path, 'http', `HTTP ${res.status}`); continue; }
      if (isMissing && res.status !== 404 && res.status !== 410) fail(path, 'not-found', `HTTP ${res.status} for a page that does not exist (want 404, or 410 for a listing that left)`);
      if (!isMissing && res.status !== 200) fail(path, 'http', `HTTP ${res.status} for a page of the sitemap`);
      if (res.status >= 300 && res.status < 400) continue;
      const html = await res.text().catch(() => '');
      const isHtml = /text\/html/.test(res.headers.get('content-type') ?? '');
      if (isHtml && !/<\/html>/i.test(html)) fail(path, 'empty-page', `HTTP ${res.status} with an empty or cut body`);
      if (!isHtml) continue;
      const csp = res.headers.get('content-security-policy') ?? '';
      const { nonce, problems: np } = nonceOf(csp, true);
      for (const m of np) fail(path, 'nonce', m);
      if (nonce && nonces.has(nonce)) fail(path, 'nonce', 'the same nonce on two responses: it must be new for every request');
      nonces.add(nonce);
      const tags = parseTags(html);
      for (const s of scriptsWithoutNonce(tags, nonce).slice(0, 3)) fail(path, s.inline ? 'inline-script' : 'nonce', `${s.what} without the response's nonce`);
      // The Astro kit's page rules, on the page without its (allowed) nonce'd inline scripts.
      checkPage({ path, headers: res.headers, html: withoutNoncedInline(html, nonce), ...ctx }, (rule, m) => fail(path, rule, m));
      for (const h of offHosts(loadedUrls(tags), ctx).slice(0, 5)) fail(path, 'hosts', `loads from external host ${h}`);
      for (const m of (await checkAssets(pageAssets(tags, `${base}${path}`, base, self), { base, seen: assetsSeen })).slice(0, 5)) fail(path, 'assets', m);
      if (res.status === 200) pageHtml.set(path, { html, tags });
      // Search pages: their map view too.
      if (/data-rs-root/.test(html) && !path.includes('view=map')) queue.splice(qi + 1, 0, `${path}${path.includes('?') ? '&' : '?'}view=map`);
      // First page: a second request must get another nonce.
      if (qi === 0) {
        const again = await fetch(`${base}${path}`).catch(() => null);
        const n2 = again ? nonceOf(again.headers.get('content-security-policy') ?? '', true).nonce : '';
        await again?.body?.cancel();
        if (!n2 || n2 === nonce) fail(path, 'nonce', 'two requests got the same nonce');
      }
    }
    for (const p of await legalLanguageProblems({ base, pages: pageHtml, locs })) fail(p.page, 'legal-language', p.message);

    // Static files carry the kit's headers (no nonce: they have no inline script).
    const asset = [...assetsSeen].find((u) => /\.js$/.test(u));
    if (asset) {
      const r = await fetch(asset);
      await r.body?.cancel();
      const c = r.headers.get('content-security-policy') ?? '';
      if (!/frame-ancestors/.test(c) || /'nonce-/.test(c)) fail(asset.slice(base.length), 'security-headers', 'a static file without the kit CSP (build/client/_headers)');
      if ((r.headers.get('x-content-type-options') ?? '') !== 'nosniff') fail(asset.slice(base.length), 'security-headers', 'a static file without X-Content-Type-Options: nosniff');
    }

    // The enquiry endpoint: same contract as the Astro kit's /api/enquiry.
    const post = (body) => fetch(`${base}/api/enquiry`, { method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json' }, body: JSON.stringify(body) });
    const bad = await post({ name: '', email: 'x', message: '' }).catch(() => null);
    const badBody = bad ? await bad.json().catch(() => ({})) : {};
    if (bad?.status !== 400 || badBody.error !== 'invalid' || !badBody.fields?.email) fail('/api/enquiry', 'enquiry', `an invalid enquiry answered HTTP ${bad?.status} ${JSON.stringify(badBody).slice(0, 80)} (want 400 {error:'invalid', fields})`);
    const ok = await post({ name: 'Check Deploy', email: 'check@example.com', message: 'check:deploy', contactReason: 'other' }).catch(() => null);
    const okBody = ok ? await ok.json().catch(() => ({})) : {};
    if (ok?.status !== 200 || okBody.preview !== true) fail('/api/enquiry', 'enquiry', `a valid enquiry on the preview answered HTTP ${ok?.status} ${JSON.stringify(okBody).slice(0, 80)} (want 200 {preview:true})`);
    pages.push('POST /api/enquiry (x2)');
  } finally {
    server.stop();
  }
  finish();
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
