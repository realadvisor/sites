/** sitemap.xml: every page in both languages and every unit not sold. */
import { sitemap } from '@realadvisor/sites-kit-react/server/seo';
import { loadSite } from '../lib/data.server';
import { LANGS, ROUTES } from '../lib/routes';
import { unitPath } from '../lib/units';

const STATIC_PATHS = (['home', 'units', 'location', 'gallery', 'documents', 'contact', 'legal', 'privacy'] as const).flatMap((k) => LANGS.map((l) => ROUTES[k][l]));

export async function loader() {
  const { dev } = await loadSite();
  return sitemap([...STATIC_PATHS, ...dev.units.filter((u) => u.status !== 'sold').flatMap((u) => LANGS.map((l) => unitPath(u, l)))]);
}
