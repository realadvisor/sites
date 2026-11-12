/** sitemap.xml: every page in both languages and every unit that is not sold. */
import { sitemap } from '@realadvisor/sites-kit-react/server/seo';
import { loadSite } from '../lib/data.server';
import { LANGS, href, type Route } from '../lib/i18n';
import { sortUnits, unitSlug } from '../lib/units.server';

const STATIC: Route[] = ['home', 'units', 'plans', 'area', 'gallery', 'docs', 'contact', 'legal', 'privacy'];

export async function loader() {
  const { dev } = await loadSite();
  const units = sortUnits(dev.units).filter((u) => u.status !== 'sold');
  return sitemap(LANGS.flatMap((l) => [...STATIC.map((r) => href(r, l)), ...units.map((u) => href('units', l, unitSlug(u)))]));
}
