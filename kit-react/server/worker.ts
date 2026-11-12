/**
 * The site's Worker: workers/app.ts is one line.
 *
 *   import { createSiteWorker } from '@realadvisor/sites-kit-react/worker';
 *   export default createSiteWorker(() => import('virtual:react-router/server-build'));
 *
 * Per request it:
 * - hands the Worker env (SITE_MODE, SITES_API_URL, SITES_API_KEY,
 *   ANALYTICS_ID) to the kit (`@realadvisor/sites-kit-core/env`);
 * - answers the 301s of site.json `redirects`, refuses cross-site form
 *   posts (Astro's checkOrigin);
 * - makes a fresh CSP nonce (128 random bits) and passes it to React Router
 *   (`loadContext.nonce`: entry.server gives it to renderToReadableStream,
 *   <Scripts>, <ScrollRestoration> and every inline script) and to the
 *   content-security-policy header, the only one it is valid for;
 * - renders the whole page before answering (entry.server waits for
 *   allReady): a page that fails mid-render is a logged 500, never a 200
 *   with a cut body; a 404/410 keeps its status and the site's page;
 * - sets the kit's security headers (preview: the CRM may frame it);
 * - renders with the page locale (`withPageLocale`), which siteClient reads
 *   texts in on a multilingual site.
 */
import { createRequestHandler, type ServerBuild } from 'react-router';
import site from 'virtual:sites-kit/site';
import inlineStyles from 'virtual:sites-kit-react/css';
import { setRuntimeEnv, siteMode, type SiteEnv } from '@realadvisor/sites-kit-core/env';
import { notFoundPage, renderFailed } from '@realadvisor/sites-kit-core/render-error';
import { localeOfPath } from '@realadvisor/sites-kit-core/i18n';
import { withPageLocale } from '@realadvisor/sites-kit-core/page-locale';
import { createNonce, siteHeaders } from './security';

/** The parts of the Workers runtime types the kit uses (no @cloudflare/workers-types: it clashes with the DOM lib). */
export type ExecutionContext = { waitUntil(p: Promise<unknown>): void; passThroughOnException(): void };

export type SiteLoadContext = {
  cloudflare: { env: SiteEnv & Record<string, unknown>; ctx: ExecutionContext };
  /** This request's CSP nonce. */
  nonce: string;
};

declare module 'react-router' {
  interface AppLoadContext extends SiteLoadContext {}
}

const norm = (p: string) => (p.length > 1 ? p.replace(/\/+$/, '') : p).toLowerCase();
const EXACT = new Map(Object.entries(site.redirects).filter(([k]) => !k.endsWith('*')).map(([k, v]) => [norm(k), v]));
const PREFIX = Object.entries(site.redirects)
  .filter(([k]) => k.endsWith('*'))
  .map(([k, v]) => [norm(k.slice(0, -1)), v] as const)
  .sort((a, b) => b[0].length - a[0].length);

/** 301 target for an old URL (site.json `redirects`), or null. Same-site paths only. Same rules as the Astro kit middleware. */
export function redirectFor(url: URL): string | null {
  const path = norm(url.pathname);
  const to = EXACT.get(path) ?? PREFIX.find(([k]) => path === k || path.startsWith(`${k}/`))?.[1];
  if (!to || !to.startsWith('/') || to.startsWith('//')) return null;
  if (norm(to.split('?')[0]!) === path) return null; // never a loop
  return to.includes('?') || !url.search ? to : `${to}${url.search}`;
}

/** A page that ends with a script after </html> (it should not): move it back before </body>. */
function closeDocument(html: string): string {
  const m = /<\/body>\s*<\/html>([\s\S]*)$/i.exec(html);
  if (!m || !m[1]!.trim()) return html;
  return `${html.slice(0, m.index)}${m[1]!.trim()}</body></html>`;
}

/** sitesKit({ inlineCss: true }): each linked stylesheet of the build becomes a <style> with its text (same order). */
export function inlineCss(html: string, styles: Record<string, string> = inlineStyles): string {
  if (!Object.keys(styles).length) return html;
  return html.replace(/<link\b[^>]*\brel="stylesheet"[^>]*>/g, (tag) => {
    const href = /\bhref="([^"]+)"/.exec(tag)?.[1];
    const text = href ? styles[href] : undefined;
    return text == null ? tag : `<style>${text.replace(/<\/style/gi, '<\\/style')}</style>`;
  });
}

/** The Worker's environment as plain strings for the SDK (it reads process.env). */
function exposeEnv(env: Record<string, unknown>) {
  const proc = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process;
  if (!proc?.env) return;
  for (const k of ['SITE_MODE', 'SITES_API_URL', 'SITES_API_KEY', 'ANALYTICS_ID', 'SITE_URL']) {
    if (typeof env[k] === 'string' && env[k] && proc.env[k] !== env[k]) proc.env[k] = env[k] as string;
  }
}

const FORM_TYPES = /^(application\/x-www-form-urlencoded|multipart\/form-data|text\/plain)\b/i;

/**
 * Cross-site form posts are refused, as Astro's `security.checkOrigin` does
 * on Astro sites: a POST/PUT/PATCH/DELETE with a form content type needs an
 * Origin header equal to the site's.
 */
export function crossSiteForm(request: Request, url: URL): boolean {
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) return false;
  if (!FORM_TYPES.test(request.headers.get('content-type') ?? '')) return false;
  return request.headers.get('origin') !== url.origin;
}

export function createSiteWorker(build: () => Promise<ServerBuild>) {
  const handle = createRequestHandler(build, import.meta.env.MODE);
  return {
    async fetch(request: Request, env: SiteLoadContext['cloudflare']['env'], ctx: ExecutionContext): Promise<Response> {
      setRuntimeEnv(env);
      exposeEnv(env);
      const url = new URL(request.url);
      const moved = redirectFor(url);
      if (moved) return new Response(null, { status: 301, headers: { location: moved } });
      if (crossSiteForm(request, url)) return new Response(`Cross-site ${request.method} form submissions are forbidden`, { status: 403 });

      const nonce = createNonce();
      const path = url.pathname;
      let res: Response;
      try {
        // The page locale (pageLocale(request)): siteClient reads texts in it.
        res = await withPageLocale(localeOfPath(path), () => handle(request, { cloudflare: { env, ctx }, nonce }));
        if ((res.headers.get('content-type') ?? '').includes('text/html') && res.body) {
          const raw = await res.text(); // throws when rendering fails mid-stream
          if (res.status === 200 && !raw.replace(/<!doctype html>/i, '').trim()) throw new Error('page rendered an empty body');
          if (res.status === 200 && /<html[\s>]/i.test(raw) && !/<\/html>/i.test(raw)) throw new Error('page rendered a cut body (no </html>)');
          const headers = new Headers(res.headers);
          headers.delete('content-length');
          res = new Response(inlineCss(closeDocument(raw)), { status: res.status, statusText: res.statusText, headers });
        } else if ((res.status === 404 || res.status === 410) && !res.body) {
          res = notFoundPage(path, res.status);
        } else if (res.status >= 500 && !res.body) {
          res = renderFailed(path, new Error(`HTTP ${res.status} with no body`));
        }
      } catch (err) {
        const status = (err as { status?: unknown } | null)?.status;
        res = status === 404 || status === 410 ? notFoundPage(path, status) : renderFailed(path, err);
      }
      // Only an HTML page carries inline scripts: the nonce goes in its CSP alone.
      const html = (res.headers.get('content-type') ?? '').includes('text/html');
      try {
        const headers = siteHeaders(siteMode() === 'preview', html ? nonce : undefined);
        for (const [k, v] of Object.entries(headers)) {
          if (k === 'content-security-policy' || !res.headers.has(k)) res.headers.set(k, v);
        }
      } catch {
        // immutable headers (Response.redirect): nothing to secure in a redirect
      }
      return res;
    },
  };
}
