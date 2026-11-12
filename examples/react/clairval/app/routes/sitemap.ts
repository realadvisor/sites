/**
 * sitemap.xml: every static page and every listing (available), agent,
 * office, destination and journal article, in both languages.
 */
import { sitemap } from '@realadvisor/sites-kit-react/server/seo';
import { sites } from '../lib/data.server';
import { agentSlug, href, LANGS, ROUTES, teamSlug, type RouteKey } from '../lib/routes';
import { POSTS } from '../content/journal';

const STATIC: RouteKey[] = ['home', 'buy', 'rent', 'sell', 'sold', 'team', 'offices', 'destinations', 'journal', 'about', 'contact', 'legal', 'privacy'];

export async function loader() {
  const [all, agents, teams] = await Promise.all([sites.allListings({ status: 'available' }), sites.agents(), sites.teams()]);
  const paths: string[] = [];
  for (const l of LANGS) {
    paths.push(...STATIC.map((k) => ROUTES[k][l]));
    paths.push(...all.map((x) => href('listing', l, x.slug)));
    paths.push(...agents.map((a) => href('team', l, agentSlug(a, agents))));
    for (const x of teams) {
      paths.push(href('offices', l, teamSlug(x, teams)));
      paths.push(href('destinations', l, teamSlug(x, teams)));
    }
    paths.push(...POSTS.map((p) => href('journal', l, p.slug)));
  }
  return sitemap(paths);
}
