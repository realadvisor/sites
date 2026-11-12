/** sitemap.xml: static pages, area and agent pages, journal posts and every available listing. */
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { LOCALES, legalPath, privacyPath } from '@realadvisor/sites-kit-core/i18n';
import { agentUrl, areas, listingUrl, sites } from '../lib/data';

export const prerender = false;

const STATIC_PATHS = [
  '/', '/kaufen', '/mieten', '/verkaufen', '/verkauft', '/team', '/ueber-uns', '/journal', '/kontakt',
  ...LOCALES.flatMap((l) => [legalPath(l), privacyPath(l)]),
];

export const GET: APIRoute = async ({ site, url }) => {
  const base = site ?? url;
  const [listings, agents, places, posts] = await Promise.all([
    sites.allListings({ status: 'available' }),
    sites.agents(),
    areas(),
    getCollection('journal'),
  ]);
  const paths = [
    ...STATIC_PATHS,
    ...places.map((p) => `/orte/${p.slug}`),
    ...agents.map(agentUrl),
    ...posts.map((p) => `/journal/${p.id}`),
    ...listings.map(listingUrl),
  ];
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${paths.map((p) => `  <url><loc>${new URL(p, base).href}</loc></url>`).join('\n')}
</urlset>`;
  return new Response(body, { headers: { 'content-type': 'application/xml; charset=utf-8' } });
};
