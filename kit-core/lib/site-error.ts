/**
 * One JSON log line per failure, for a monitor to match: a page that failed
 * to render (`source: 'page'`, answered with the 500 page) and an enquiry the
 * data API refused (`source: 'enquiry'`). Every line has the same `event`
 * (`site_error`), so one Workers Logs query or Logpush filter finds them all;
 * `code` says why (`site_key`: the API answered 401/403 to the site key, it
 * was revoked or replaced and only a republish mints a new one; another
 * SitesApiError code; `render` for any other error).
 *
 *   {"level":"error","event":"site_error","source":"page","code":"site_key",
 *    "status":500,"api_status":401,"site":"milestone-properties",
 *    "worker":"ra-site-milestone-properties-5845","host":"www.example.es",
 *    "path":"/","msg":"page render failed: site key rejected (401): …","error":"…"}
 *
 * `site` and `worker` come from SITE_SLUG and SITE_WORKER (lib/env.ts), null
 * when the publish did not set them; Workers Logs tag each line with the
 * script name as well. Never logs the key or the request's headers.
 */
import { siteIdentity } from './env';

export const SITE_ERROR_EVENT = 'site_error';

/** What a `site_key` error means for a site: its key was revoked or replaced. Only a republish mints a new one. */
export const SITE_KEY_REJECTED = 'site key rejected (401): republish the site to mint a new key';

export type SiteErrorLine = {
  level: 'error';
  event: typeof SITE_ERROR_EVENT;
  source: 'page' | 'enquiry';
  /** `site_key`, another SitesApiError code, or `render`. */
  code: string;
  /** The status the visitor got. */
  status: number;
  /** The status the data API answered, null when the error is not the API's. */
  api_status: number | null;
  site: string | null;
  worker: string | null;
  host: string | null;
  path: string | null;
  msg: string;
  error: string;
  stack?: string;
};

/** A SitesApiError, also one from another copy of the SDK (a second bundle): matched by shape. */
const apiError = (err: unknown): { code: string; status: number } | null => {
  const e = err as { name?: unknown; code?: unknown; status?: unknown } | null;
  return e && e.name === 'SitesApiError' && typeof e.code === 'string'
    ? { code: e.code, status: typeof e.status === 'number' ? e.status : 0 }
    : null;
};

export function siteErrorLine(
  source: SiteErrorLine['source'],
  err: unknown,
  opts: { status: number; path?: string | null; host?: string | null },
): SiteErrorLine {
  const e = err instanceof Error ? err : new Error(String(err));
  const api = apiError(err);
  const code = api?.code ?? 'render';
  const what = source === 'page' ? 'page render failed' : '[enquiry] refused';
  return {
    level: 'error',
    event: SITE_ERROR_EVENT,
    source,
    code,
    status: opts.status,
    api_status: api ? api.status || null : null,
    ...siteIdentity(),
    host: opts.host ?? null,
    path: opts.path ?? null,
    msg: code === 'site_key' ? `${what}: ${SITE_KEY_REJECTED}` : what,
    error: e.message,
    ...(e.stack && !api ? { stack: e.stack.slice(0, 2000) } : {}),
  };
}

/** Writes the line to the Worker logs (console.error, one JSON object). */
export function logSiteError(...args: Parameters<typeof siteErrorLine>): void {
  console.error(JSON.stringify(siteErrorLine(...args)));
}
