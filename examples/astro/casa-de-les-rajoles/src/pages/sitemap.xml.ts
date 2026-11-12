/** sitemap.xml: every page in both languages and every unit that is not sold. */
import type { APIRoute } from 'astro';
import { loadSite } from '../lib/data';
import { LANGS, href, type Route } from '../lib/i18n';
import { sortUnits, unitSlug } from '../lib/units';

export const prerender = false;

const STATIC: Route[] = ['home', 'units', 'plans', 'area', 'gallery', 'docs', 'contact', 'legal', 'privacy'];

export const GET: APIRoute = async ({ site, url }) => {
  const base = site ?? url;
  const { dev } = await loadSite();
  const units = sortUnits(dev.units).filter((u) => u.status !== 'sold');
  const paths = LANGS.flatMap((l) => [...STATIC.map((r) => href(r, l)), ...units.map((u) => href('units', l, unitSlug(u)))]);
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${paths.map((p) => `  <url><loc>${new URL(p, base).href}</loc></url>`).join('\n')}
</urlset>`;
  return new Response(body, { headers: { 'content-type': 'application/xml; charset=utf-8' } });
};
