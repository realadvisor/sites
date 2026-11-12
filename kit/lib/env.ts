/**
 * Worker environment, read per request by the kit middleware.
 *
 * - `SITES_API_URL` + `SITES_API_KEY`: the rest-api origin (var) and the
 *   site's api_site key (Worker secret), set at publish. Without both the
 *   site falls back to fixtures (`pnpm dev`, build time).
 * - `SITE_MODE`: `production` or `preview`, set at publish. Preview sites never send enquiries.
 * - `ANALYTICS_ID`: GA4 measurement id. The consent banner shows only when set.
 *
 * Prerendered pages are built without a request, so they see only
 * process.env at build time. Never read the API key from a prerendered page.
 */

export type SiteEnv = {
  SITE_MODE?: string;
  ANALYTICS_ID?: string;
  /**
   * The sites API (rest-api origin) and the site's key: Worker var + secret
   * once published; in the sandbox from .dev.vars, the key a placeholder its
   * firewall fills in.
   */
  SITES_API_URL?: string;
  SITES_API_KEY?: string;
};

let runtime: SiteEnv = {};

/** Called once per request by the middleware. `env` is the same object for every request of a Worker. */
export function setRuntimeEnv(env: SiteEnv | undefined) {
  if (env) runtime = env;
}

const buildEnv = (name: keyof SiteEnv): string | undefined => {
  const proc = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process;
  return proc?.env?.[name] || undefined;
};

const read = (name: keyof SiteEnv): string | undefined =>
  (typeof runtime[name] === 'string' && runtime[name]) || buildEnv(name);

/**
 * `preview` unless SITE_MODE (set by every publish) says `production`.
 * Preview sites never deliver enquiries.
 */
export const siteMode = (): 'production' | 'preview' =>
  read('SITE_MODE') === 'production' ? 'production' : 'preview';
export const analyticsId = () => read('ANALYTICS_ID');
export const previewApi = () => ({
  url: read('SITES_API_URL'),
  token: read('SITES_API_KEY'),
});
