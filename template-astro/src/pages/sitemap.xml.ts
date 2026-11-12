/**
 * sitemap.xml with static pages and every available listing.
 * Add each new static page to STATIC_PATHS.
 */
import type { APIRoute } from 'astro';
import { allListings, ra } from '@realadvisor/sites-kit-astro/ra';
import { DEVELOPMENTS_PATH, developmentUrl } from '@realadvisor/sites-kit-core/developments';
import { listingUrl } from '@realadvisor/sites-kit-core/format';
import { LOCALES, legalPath, privacyPath } from '@realadvisor/sites-kit-core/i18n';

export const prerender = false;

// Multi-language sites: add each language's pages too (localePath from src/lib/i18n.ts).
const STATIC_PATHS = ['/', '/listings', ...LOCALES.flatMap((l) => [legalPath(l), privacyPath(l)])];

export const GET: APIRoute = async ({ site, url }) => {
  const base = site ?? url;
  const paths = [...STATIC_PATHS];
  paths.push(...(await allListings({ status: 'available' })).map(listingUrl));
  const developments = await ra.developments();
  if (developments.length) paths.push(DEVELOPMENTS_PATH, ...developments.map(developmentUrl));
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${paths.map((p) => `  <url><loc>${new URL(p, base).href}</loc></url>`).join('\n')}
</urlset>`;
  return new Response(body, {
    headers: { 'content-type': 'application/xml; charset=utf-8' },
  });
};
