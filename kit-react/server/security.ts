/**
 * Security headers of a React Router site: the Astro kit's, plus one
 * per-request nonce in script-src (approved 2026-11-11 for React Router
 * sites only: their hydration scripts are inline). Everything else is the
 * kit's lib/security.mjs as it is: same hosts, same directives, no hash, no
 * 'unsafe-inline' for scripts.
 */
import { securityHeaders } from '@realadvisor/sites-kit-core/security';

/** 128 random bits, base64: a new one for every HTML response. */
export function createNonce(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}

/** base64 only: a nonce never carries a quote or a `;` into the header. */
const NONCE_RE = /^[A-Za-z0-9+/]{16,}={0,2}$/;

/**
 * The kit's headers for this response. With `nonce`, script-src becomes
 * `'self' 'nonce-…' <kit hosts>`: the only difference from an Astro site.
 */
export function siteHeaders(preview: boolean, nonce?: string): Record<string, string> {
  const h = securityHeaders(preview);
  if (!nonce) return h;
  if (!NONCE_RE.test(nonce)) throw new Error('invalid CSP nonce');
  const csp = h['content-security-policy']!.replace(/(^|; )script-src 'self'/, `$1script-src 'self' 'nonce-${nonce}'`);
  if (!csp.includes(`'nonce-${nonce}'`)) throw new Error('kit CSP has no script-src to add the nonce to');
  return { ...h, 'content-security-policy': csp };
}
