/** sitemap.xml: the static pages and every unit that is not let. */
import type { APIRoute } from 'astro';
import { legalPath, privacyPath } from '@realadvisor/sites-kit/i18n';
import { site as load } from '../lib/data';
import { rowsOf, unitUrl } from '../lib/units';

export const prerender = false;

const STATIC_PATHS = ['/', '/wohnungen', '/kontakt', '/lage', '/galerie', '/dokumente', '/news', legalPath(), privacyPath()];

export const GET: APIRoute = async ({ site, url }) => {
  const base = site ?? url;
  const { dev } = await load();
  const paths = [...STATIC_PATHS, ...rowsOf(dev).filter((r) => r.u.status !== 'sold').map((r) => unitUrl(r.u))];
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${paths.map((p) => `  <url><loc>${new URL(p, base).href}</loc></url>`).join('\n')}
</urlset>`;
  return new Response(body, { headers: { 'content-type': 'application/xml; charset=utf-8' } });
};
