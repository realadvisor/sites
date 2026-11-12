/**
 * sitemap.xml: every page in both languages, every available listing, every
 * agent, district page and journal post.
 */
import { sitemap } from '@realadvisor/sites-kit-react/server/seo';
import { sites } from '../lib/data.server';
import { agentSlug } from '../lib/data';
import { districtsWithListings } from '../lib/districts';
import { postsOf } from '../content/content.server';
import { LANGS, href, listingHref, type Route } from '../lib/i18n';

const STATIC: Route[] = ['home', 'buy', 'rent', 'sell', 'sold', 'areas', 'team', 'about', 'journal', 'contact', 'legal', 'privacy'];

export async function loader() {
  const [all, agents] = await Promise.all([sites.allListings(), sites.agents()]);
  const available = all.filter((l) => l.status === 'available');
  const areas = districtsWithListings(all);
  const paths: string[] = [];
  for (const lang of LANGS) {
    paths.push(...STATIC.map((r) => href(r, lang)));
    paths.push(...available.map((l) => listingHref(l, lang)));
    paths.push(...agents.map((a) => href('team', lang, agentSlug(a))));
    paths.push(...areas.map((d) => href('areas', lang, d.slug)));
    paths.push(...postsOf(lang).map((p) => href('journal', lang, p.path)));
  }
  return sitemap(paths);
}
