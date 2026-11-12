/**
 * sitemap.xml: static pages, every programme with its pages, and every unit
 * that is not sold (sold unit pages are noindex).
 */
import type { APIRoute } from 'astro';
import { legalPath, privacyPath } from '@realadvisor/sites-kit/i18n';
import { sites } from '../lib/data';
import { programmeUrl, unitUrl, PROGRAMMES_PATH } from '../lib/fr';

export const prerender = false;

const STATIC_PATHS = ['/', PROGRAMMES_PATH, '/a-propos', '/contact', legalPath(), privacyPath()];
const SECTIONS = ['', 'logements', 'situation', 'galerie', 'documents'];

export const GET: APIRoute = async ({ site, url }) => {
  const base = site ?? url;
  const paths = [...STATIC_PATHS];
  for (const d of await sites.developments()) {
    paths.push(...SECTIONS.map((s) => programmeUrl(d, s)));
    const dev = await sites.development(d.id);
    for (const u of dev?.units ?? []) if (u.status !== 'sold') paths.push(unitUrl(d, u));
  }
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${paths.map((p) => `  <url><loc>${new URL(p, base).href}</loc></url>`).join('\n')}
</urlset>`;
  return new Response(body, { headers: { 'content-type': 'application/xml; charset=utf-8' } });
};
