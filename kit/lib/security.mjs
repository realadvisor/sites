/**
 * Hosts the browser may load from, and the security headers built from them.
 * Used by the kit middleware (pages rendered on request), the kit integration
 * (dist/_headers for prerendered pages and assets) and check:deploy (run at
 * publish), which fails when a page loads anything from another host or
 * misses a header. Plain JS: astro.config loads the integration natively.
 *
 * Do not add hosts. Fonts, scripts, CSS and images are self-hosted or come
 * from img.realadvisor.ch; the data API (SITES_API_URL, rest-api) is called
 * by the server only, so its origin is in no browser directive.
 * challenges.cloudflare.com: the enquiry form's Turnstile widget (script + iframe).
 */
export const ALLOWED_HOSTS = {
  img: ['https://img.realadvisor.ch', 'https://lh3.googleusercontent.com', 'https://tile.openstreetmap.org'],
  script: ['https://www.googletagmanager.com', 'https://challenges.cloudflare.com'],
  connect: ['https://www.google-analytics.com', 'https://region1.google-analytics.com'],
  /** @type {string[]} Turnstile only (maps are static images) */
  frame: ['https://challenges.cloudflare.com'],
};

/** CRM origins that may show a preview site in an iframe. */
const CRM_FRAME_ANCESTORS = ["'self'", 'https://*.realadvisor.com', 'https://*.realadvisor.ch'];

/** @param {boolean} preview */
export function csp(preview) {
  const h = ALLOWED_HOSTS;
  return [
    "default-src 'self'",
    `img-src 'self' data: blob: ${h.img.join(' ')}`,
    // No inline scripts: the kit integration never inlines script bundles; is:inline needs a src.
    `script-src 'self' ${h.script.join(' ')}`,
    "style-src 'self' 'unsafe-inline'", // Astro inlines small stylesheets
    "font-src 'self' data:",
    `connect-src 'self' ${h.connect.join(' ')}`,
    `frame-src ${h.frame.length ? h.frame.join(' ') : "'none'"}`,
    "media-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    `frame-ancestors ${preview ? CRM_FRAME_ANCESTORS.join(' ') : "'none'"}`,
  ].join('; ');
}

/**
 * @param {boolean} preview
 * @returns {Record<string, string>}
 */
export function securityHeaders(preview) {
  return {
    'content-security-policy': csp(preview),
    ...(preview ? {} : { 'x-frame-options': 'DENY', 'strict-transport-security': 'max-age=31536000; includeSubDomains' }),
    'x-content-type-options': 'nosniff',
    'referrer-policy': 'strict-origin-when-cross-origin',
    'permissions-policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()',
  };
}
