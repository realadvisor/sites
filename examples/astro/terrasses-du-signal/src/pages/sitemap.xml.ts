/** sitemap.xml: the static pages and every unit that is not sold. */
import type { APIRoute } from 'astro';
import { legalPath, privacyPath } from '@realadvisor/sites-kit/i18n';
import { loadSite } from '../lib/data';
import { sortUnits, unitPath } from '../lib/units';

export const prerender = false;

const STATIC_PATHS = ['/', '/appartements', '/situation', '/galerie', '/documents', '/contact', legalPath(), privacyPath()];

export const GET: APIRoute = async ({ site, url }) => {
  const base = site ?? url;
  const { dev } = await loadSite();
  const paths = [...STATIC_PATHS, ...sortUnits(dev.units).filter((u) => u.status !== 'sold').map(unitPath)];
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${paths.map((p) => `  <url><loc>${new URL(p, base).href}</loc></url>`).join('\n')}
</urlset>`;
  return new Response(body, { headers: { 'content-type': 'application/xml; charset=utf-8' } });
};
