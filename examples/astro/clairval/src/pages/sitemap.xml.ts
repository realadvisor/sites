/**
 * sitemap.xml: every static page and every listing (available), agent,
 * office, destination and journal article, in both languages.
 */
import type { APIRoute } from 'astro';
import { sites } from '../lib/data';
import { agentSlug, href, LANGS, ROUTES, teamSlug, type RouteKey } from '../lib/routes';
import { POSTS } from '../content/journal';

export const prerender = false;

const STATIC: RouteKey[] = ['home', 'buy', 'rent', 'sell', 'sold', 'team', 'offices', 'destinations', 'journal', 'about', 'contact', 'legal', 'privacy'];

export const GET: APIRoute = async ({ site, url }) => {
  const base = site ?? url;
  const [all, agents, teams] = await Promise.all([sites.allListings({ status: 'available' }), sites.agents(), sites.teams()]);
  const paths: string[] = [];
  for (const l of LANGS) {
    paths.push(...STATIC.map((k) => ROUTES[k][l]));
    paths.push(...all.map((x) => href('listing', l, x.slug)));
    paths.push(...agents.map((a) => href('team', l, agentSlug(a, agents))));
    for (const x of teams) {
      paths.push(href('offices', l, teamSlug(x, teams)));
      paths.push(href('destinations', l, teamSlug(x, teams)));
    }
    paths.push(...POSTS.map((p) => href('journal', l, p.slug)));
  }
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${paths.map((p) => `  <url><loc>${new URL(p, base).href}</loc></url>`).join('\n')}
</urlset>`;
  return new Response(body, { headers: { 'content-type': 'application/xml; charset=utf-8' } });
};
