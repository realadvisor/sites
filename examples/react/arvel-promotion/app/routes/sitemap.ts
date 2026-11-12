/**
 * sitemap.xml: static pages, every programme with its pages, and every unit
 * that is not sold (sold unit pages are noindex).
 */
import { legalPaths, sitemap } from '@realadvisor/sites-kit-react/server/seo';
import { sites } from '../lib/data.server';
import { programmeUrl, unitUrl, PROGRAMMES_PATH } from '../lib/fr';

const STATIC_PATHS = ['/', PROGRAMMES_PATH, '/a-propos', '/contact'];
const SECTIONS = ['', 'logements', 'situation', 'galerie', 'documents'];

export async function loader() {
  const paths = [...STATIC_PATHS, ...legalPaths()];
  for (const d of await sites.developments()) {
    paths.push(...SECTIONS.map((s) => programmeUrl(d, s)));
    const dev = await sites.development(d.id);
    for (const u of dev?.units ?? []) if (u.status !== 'sold') paths.push(unitUrl(d, u));
  }
  return sitemap(paths);
}
