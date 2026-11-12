/** sitemap.xml: the static pages and every unit that is not sold. */
import { legalPaths, sitemap } from '@realadvisor/sites-kit-react/server/seo';
import { loadSite } from '../lib/data.server';
import { sortUnits, unitPath } from '../lib/units';

const STATIC_PATHS = ['/', '/appartements', '/situation', '/galerie', '/documents', '/contact'];

export async function loader() {
  const { dev, extras } = await loadSite();
  return sitemap([...STATIC_PATHS, ...legalPaths(), ...sortUnits(dev.units, extras).filter((u) => u.status !== 'sold').map(unitPath)]);
}
