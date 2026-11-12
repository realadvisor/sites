/** sitemap.xml: the static pages and every unit that is not let. */
import { legalPaths, sitemap } from '@realadvisor/sites-kit-react/server/seo';
import { rowsOf, site } from '../lib/data.server';
import { unitUrl } from '../lib/units';

const STATIC_PATHS = ['/', '/wohnungen', '/kontakt', '/lage', '/galerie', '/dokumente', '/news'];

export async function loader() {
  const { dev } = await site();
  return sitemap([...STATIC_PATHS, ...legalPaths(), ...rowsOf(dev).filter((r) => r.u.status !== 'sold').map((r) => unitUrl(r.u))]);
}
