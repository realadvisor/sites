/**
 * sitemap.xml: every page in both languages, every available listing, every
 * agent, area page (towns with 2+ listings) and journal post.
 */
import { sitemap } from '@realadvisor/sites-kit-react/server/seo';
import { sites } from '../lib/data.server';
import { agentSlug, towns } from '../lib/data';
import { postsOf } from '../content/content.server';
import { LANGS, href, listingHref, type Route } from '../lib/i18n';

const STATIC: Route[] = ['home', 'buy', 'rent', 'sell', 'sold', 'areas', 'team', 'about', 'blog', 'contact', 'legal', 'privacy'];

export async function loader() {
  const [all, agents] = await Promise.all([sites.allListings(), sites.agents()]);
  const available = all.filter((l) => l.status === 'available');
  const areas = towns(all);
  const paths: string[] = [];
  for (const lang of LANGS) {
    paths.push(...STATIC.map((r) => href(r, lang)));
    paths.push(...available.map((l) => listingHref(l, lang)));
    paths.push(...agents.map((a) => href('team', lang, agentSlug(a))));
    paths.push(...areas.map((t) => href('areas', lang, t.slug)));
    paths.push(...postsOf(lang).map((p) => href('blog', lang, p.path)));
  }
  return sitemap(paths);
}
