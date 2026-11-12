/**
 * sitemap.xml: every page in both languages, every available listing, every
 * agent, area page (towns with 3+ listings) and journal post.
 */
import type { APIRoute } from 'astro';
import { agentSlug, sites, towns } from '../lib/data';
import { postsOf } from '../lib/blog';
import { LANGS, href, listingHref, type Route } from '../lib/i18n';

export const prerender = false;

const STATIC: Route[] = ['home', 'buy', 'rent', 'sell', 'sold', 'areas', 'team', 'about', 'blog', 'contact', 'legal', 'privacy'];

export const GET: APIRoute = async ({ site, url }) => {
  const base = site ?? url;
  const [all, agents] = await Promise.all([sites.allListings(), sites.agents()]);
  const available = all.filter((l) => l.status === 'available');
  const areas = towns(all);
  const paths: string[] = [];
  for (const lang of LANGS) {
    paths.push(...STATIC.map((r) => href(r, lang)));
    paths.push(...available.map((l) => listingHref(l, lang)));
    paths.push(...agents.map((a) => href('team', lang, agentSlug(a))));
    paths.push(...areas.map((t) => href('areas', lang, t.slug)));
    paths.push(...(await postsOf(lang)).map((p) => href('blog', lang, p.data.path)));
  }
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${paths.map((p) => `  <url><loc>${new URL(p, base).href}</loc></url>`).join('\n')}
</urlset>`;
  return new Response(body, { headers: { 'content-type': 'application/xml; charset=utf-8' } });
};
