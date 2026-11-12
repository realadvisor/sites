import { defineMiddleware } from 'astro:middleware';
import { setRuntimeEnv, siteMode, type SiteEnv } from '@realadvisor/sites-kit-core/env';
import site from 'virtual:sites-kit/site';
import { securityHeaders } from '@realadvisor/sites-kit-core/security';
import { notFoundPage, renderFailed } from '@realadvisor/sites-kit-core/render-error';
import { localeOfPath } from '@realadvisor/sites-kit-core/i18n';
import { withPageLocale } from '@realadvisor/sites-kit-core/page-locale';

/**
 * Hands the Worker env (SITE_MODE, SITES_API_URL, ...) to lib/env.ts,
 * renders each on-request page fully before answering, and adds the security
 * headers (lib/security.mjs). The kit integration adds it to every site. Not applied in `pnpm dev` (the CRM
 * preview frames it, and the dev error overlay must stay).
 *
 * Why render fully: Astro streams SSR pages, so the 200 status and headers
 * leave before the body is rendered. An error in the markup (one listing with
 * no photos, `l.photos[0].url`) then ends the stream: the visitor gets a 200
 * with an empty or cut body, and caches keep it. Buffering turns that into a
 * logged error and a 500 page.
 *
 * A missing page is not an error: a 404/410 (a route's answer, or a 404 the
 * data API threw) keeps its status and gets the site's /404 page, never a 500.
 */
/**
 * A component that wraps the layout and has a `<script>` (a ListingDetail
 * that renders `<Layout>…</Layout>` and then its script) makes Astro write
 * the script after `</html>`. Browsers cope, but the page then ends with a
 * script instead of `</html>`: move such trailing tags back before `</body>`.
 */
function closeDocument(html: string): string {
  const m = /<\/body>\s*<\/html>([\s\S]*)$/i.exec(html);
  if (!m || !m[1]!.trim()) return html;
  return `${html.slice(0, m.index)}${m[1]!.trim()}</body></html>`;
}

const norm = (p: string) => (p.length > 1 ? p.replace(/\/+$/, '') : p).toLowerCase();
const EXACT = new Map(Object.entries(site.redirects).filter(([k]) => !k.endsWith('*')).map(([k, v]) => [norm(k), v]));
const PREFIX = Object.entries(site.redirects)
  .filter(([k]) => k.endsWith('*'))
  .map(([k, v]) => [norm(k.slice(0, -1)), v] as const)
  .sort((a, b) => b[0].length - a[0].length);

/** 301 target for an old URL (site.json `redirects`), or null. Same-site paths only. */
function redirectFor(url: URL): string | null {
  const path = norm(url.pathname);
  const to = EXACT.get(path) ?? PREFIX.find(([k]) => path === k || path.startsWith(`${k}/`))?.[1];
  if (!to || !to.startsWith('/') || to.startsWith('//')) return null;
  if (norm(to.split('?')[0]!) === path) return null; // never a loop
  return to.includes('?') || !url.search ? to : `${to}${url.search}`;
}

// Every request renders with its page locale (lib/page-locale.ts): the data helpers read texts in it.
export const onRequest = defineMiddleware((context, next) => withPageLocale(localeOfPath(context.url.pathname), () => handle(context, next)));

const handle: Parameters<typeof defineMiddleware>[0] = async (context, next) => {
  const locals = context.locals as { runtime?: { env?: SiteEnv } };
  setRuntimeEnv(locals.runtime?.env);
  const moved = redirectFor(context.url);
  if (moved) return new Response(null, { status: 301, headers: { location: moved } });
  if (!import.meta.env.PROD || context.isPrerendered) return next();

  const path = context.url.pathname;
  let res: Response;
  try {
    res = await next();
    if ((res.headers.get('content-type') ?? '').includes('text/html') && res.body) {
      const raw = await res.text(); // throws when rendering fails mid-stream
      if (res.status === 200 && !raw.replace(/<!doctype html>/i, '').trim()) {
        throw new Error('page rendered an empty body');
      }
      if (res.status === 200 && /<html[\s>]/i.test(raw) && !/<\/html>/i.test(raw)) {
        throw new Error('page rendered a cut body (no </html>)');
      }
      const html = closeDocument(raw);
      res = new Response(html, { status: res.status, statusText: res.statusText, headers: res.headers });
    } else if ((res.status === 404 || res.status === 410) && !res.body) {
      res = notFoundPage(path, res.status);
    } else if (res.status >= 500 && !res.body) {
      res = renderFailed(path, new Error(`HTTP ${res.status} with no body`));
    }
  } catch (err) {
    const status = (err as { status?: unknown } | null)?.status;
    res = status === 404 || status === 410 ? notFoundPage(path, status) : renderFailed(path, err);
  }
  try {
    for (const [k, v] of Object.entries(securityHeaders(siteMode() === 'preview'))) {
      if (!res.headers.has(k)) res.headers.set(k, v);
    }
  } catch {
    // immutable headers (Response.redirect): nothing to secure in a redirect
  }
  return res;
};
