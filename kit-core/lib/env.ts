/**
 * Worker environment, read per request by the kit middleware.
 *
 * - `SITES_API_URL` + `SITES_API_KEY`: the rest-api origin (var) and the
 *   site's api_site key (Worker secret), set at publish. Without both the
 *   site falls back to fixtures (`pnpm dev`, build time).
 * - `SITE_MODE`: `production` or `preview`, set at publish. Preview sites never send enquiries.
 * - `ANALYTICS_ID`: GA4 measurement id. The consent banner shows only when set.
 * - `SITE_SLUG`, `SITE_WORKER`: the site's slug and Worker name, when the
 *   publish sets them. Error log lines carry them (lib/site-error.ts).
 *
 * Prerendered pages are built without a request, so they see only
 * process.env at build time. Never read the API key from a prerendered page.
 */

import { AsyncLocalStorage } from 'node:async_hooks';
import type { CacheOptions } from '@realadvisor/sites-sdk/types';

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
  SITE_SLUG?: string;
  SITE_WORKER?: string;
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
/** Who the site is, for log lines: slug and Worker name, null when the publish did not set them. */
export const siteIdentity = () => ({
  site: read('SITE_SLUG') ?? null,
  worker: read('SITE_WORKER') ?? null,
});
/** The part of a Worker's ExecutionContext the data cache needs. */
export type WaitUntil = { waitUntil(p: Promise<unknown>): void };

const request = new AsyncLocalStorage<WaitUntil | undefined>();

/** Runs `fn` with this request's ExecutionContext: the data cache refreshes a stale copy through its waitUntil. */
export const withRequestContext = <T>(ctx: WaitUntil | undefined, fn: () => T): T => request.run(ctx, fn);

/**
 * The SDK's `cache` option: on for a published production site (SITE_MODE
 * production and a production build), off for previews and dev, so they
 * show each CRM change at once. A stale copy refreshes after the answer
 * (the request's waitUntil), or before it outside a request.
 */
export const dataCache = (prodBuild: boolean): CacheOptions | false =>
  prodBuild && siteMode() === 'production'
    ? {
        waitUntil: (p) => {
          const ctx = request.getStore();
          if (!ctx) return false;
          ctx.waitUntil(p);
          return true;
        },
      }
    : false;

export const previewApi = () => ({
  url: read('SITES_API_URL'),
  token: read('SITES_API_KEY'),
});
