/** sitemap.xml: every page in both languages and every unit not sold. */
import type { APIRoute } from 'astro';
import { loadSite } from '../lib/data';
import { LANGS, ROUTES, href } from '../lib/routes';
import { unitPath } from '../lib/units';

export const prerender = false;

const STATIC_PATHS = (['home', 'units', 'location', 'gallery', 'documents', 'contact', 'legal', 'privacy'] as const).flatMap((k) => LANGS.map((l) => ROUTES[k][l]));

export const GET: APIRoute = async ({ site, url }) => {
  const base = site ?? url;
  const { dev } = await loadSite();
  const paths = [...STATIC_PATHS, ...dev.units.filter((u) => u.status !== 'sold').flatMap((u) => LANGS.map((l) => unitPath(u, l)))];
  void href;
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${paths.map((p) => `  <url><loc>${new URL(p, base).href}</loc></url>`).join('\n')}
</urlset>`;
  return new Response(body, { headers: { 'content-type': 'application/xml; charset=utf-8' } });
};
