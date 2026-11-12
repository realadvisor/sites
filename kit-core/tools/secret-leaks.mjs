/**
 * Secret leak detection, shared by check:deploy (the build output) and
 * check:quality (the pages, scripts and JSON the site serves).
 *
 * Two shapes:
 * - `ra-secret:<NAME>`: the placeholder the sandbox gives the site instead of
 *   a secret (crm-chat-api lib/sites/site-env.ts). In a build or a page it
 *   means site code baked a variable into what visitors receive: once
 *   published, the Worker's real secret would be printed there.
 * - an api_site key, `ra_live_` or `ra_test_` then 43 base64url characters
 *   (packages/api-keys generateApiKey): the site's data key, which must never
 *   leave the Worker.
 *
 * Findings never repeat a key: only its prefix is named.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const PLACEHOLDER_RE = /ra-secret:([A-Za-z0-9_]{0,64})/;
const SITE_KEY_RE = /(?<![A-Za-z0-9_-])ra_(live|test)_[A-Za-z0-9_-]{43}(?![A-Za-z0-9_-])/;

/** What leaks in `text`, as a message, or null. */
export function leakIn(text) {
  if (typeof text !== 'string' || !text) return null;
  const p = PLACEHOLDER_RE.exec(text);
  if (p) return `contains the secret placeholder ra-secret:${p[1]}: a site variable is printed into what visitors get; read it only in server code (process.env / Astro.locals), never in a page, script or JSON`;
  const k = SITE_KEY_RE.exec(text);
  if (k) return `contains a site key (ra_${k[1]}_…): the data key must stay in the Worker, never in a page, script or JSON`;
  return null;
}

const MAX_FILE = 20 * 1024 * 1024;

/** Every file under `dir` (the build output) that leaks: [{ file, message }]. */
export function buildLeaks(dir) {
  const out = [];
  const walk = (d) => {
    let names = [];
    try {
      names = readdirSync(d);
    } catch {
      return;
    }
    for (const f of names) {
      const p = join(d, f);
      const st = statSync(p);
      if (st.isDirectory()) walk(p);
      else if (st.isFile() && st.size <= MAX_FILE) {
        // latin1: any byte reads as one character, so binaries cannot throw.
        const message = leakIn(readFileSync(p).toString('latin1'));
        if (message) out.push({ file: relative(dir, p), message });
      }
    }
  };
  walk(dir);
  return out;
}

const SERVED_TYPE = /text\/html|javascript|ecmascript|json/i;

/**
 * A response the site served to a visitor's browser (check:quality): a page,
 * script or JSON of the site's own origin `base` that leaks, as a message
 * naming its path, or null. Other origins and types are not the site's.
 */
export function servedLeak({ url, contentType, text, base }) {
  let u;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  if (u.origin !== new URL(base).origin || !SERVED_TYPE.test(contentType ?? '')) return null;
  const message = leakIn(text);
  return message && `${u.pathname} ${message}`;
}
