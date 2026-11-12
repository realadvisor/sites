/**
 * sitemap.xml and robots.txt resource routes.
 *
 *   // app/routes/sitemap[.]xml.ts
 *   export const loader = async () => sitemap([...STATIC_PATHS, ...listings.map(listingUrl)]);
 *   // app/routes/robots[.]txt.ts
 *   export const loader = () => robots();
 *
 * Every path on the public origin (SITE_URL). Legal pages of every
 * language: `legalPaths()`.
 */
import { LOCALES, legalPath, privacyPath } from '@realadvisor/sites-kit-core/i18n';
import { siteUrl } from './kit';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** /legal and /privacy of every language (/en/legal, ... on a multi-language site). */
export const legalPaths = () => LOCALES.flatMap((l) => [legalPath(l), privacyPath(l)]);

export function sitemap(paths: string[]): Response {
  const base = siteUrl();
  const unique = [...new Set(paths)];
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${unique.map((p) => `  <url><loc>${esc(new URL(p, base).href)}</loc></url>`).join('\n')}
</urlset>`;
  return new Response(body, { headers: { 'content-type': 'application/xml; charset=utf-8' } });
}

export function robots(): Response {
  return new Response(`User-agent: *\nAllow: /\nSitemap: ${new URL('/sitemap.xml', siteUrl()).href}\n`, {
    headers: { 'content-type': 'text/plain' },
  });
}

/** Thrown from a loader: the site's 404 page with a real 404 (410: a listing that left the site). */
export function notFound(gone = false): Response {
  return new Response(null, { status: gone ? 410 : 404, statusText: gone ? 'Gone' : 'Not Found' });
}
