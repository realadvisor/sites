/**
 * sitemap.xml: every static page, every available listing, agency, agent and city page.
 * Add each new static page to STATIC_PATHS. (/favoris is per-browser and noindex: left out.)
 */
import type { APIRoute } from 'astro';
import { sites } from '../lib/data';
import { agentHref, citiesOf, cityHref, listingHref, R, teamHref } from '../lib/site';

export const prerender = false;

const STATIC_PATHS = [R.home, R.buy, R.rent, R.sell, R.sold, R.agencies, R.team, R.cities, R.about, R.contact, R.legal, R.privacy];

export const GET: APIRoute = async ({ site, url }) => {
  const base = site ?? url;
  const [all, teams, agents] = await Promise.all([sites.allListings(), sites.teams(), sites.agents()]);
  const paths = [
    ...STATIC_PATHS,
    ...all.filter((l) => l.status === 'available').map(listingHref),
    ...teams.map(teamHref),
    ...agents.map(agentHref),
    ...citiesOf(all).map((c) => cityHref(c.city)),
  ];
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${paths.map((p) => `  <url><loc>${new URL(p, base).href}</loc></url>`).join('\n')}
</urlset>`;
  return new Response(body, { headers: { 'content-type': 'application/xml; charset=utf-8' } });
};
