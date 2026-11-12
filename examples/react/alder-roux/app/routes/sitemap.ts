/**
 * sitemap.xml: every static page and every listing, agent, office, area,
 * development and unit (sold units and listings left out), in both languages.
 */
import { sitemap } from '@realadvisor/sites-kit-react/server/seo';
import { sites } from '../lib/data.server';
import { agentSlug, href, LANGS, ROUTES, teamSlug, unitSlug, type RouteKey } from '../lib/routes';
import { areasOf } from '../lib/areas';

const STATIC: RouteKey[] = ['home', 'buy', 'rent', 'sell', 'team', 'offices', 'areas', 'sold', 'about', 'contact', 'legal', 'privacy'];

export async function loader() {
  const [all, agents, teams, devs] = await Promise.all([sites.allListings(), sites.agents(), sites.teams(), sites.developments()]);
  const full = await Promise.all(devs.map((d) => sites.development(d.slug)));
  const paths: string[] = [];
  for (const l of LANGS) {
    paths.push(...STATIC.map((k) => ROUTES[k][l]));
    paths.push(...all.filter((x) => x.status === 'available').map((x) => href('listing', l, x.slug)));
    paths.push(...agents.map((a) => href('team', l, agentSlug(a, agents))));
    paths.push(...teams.map((x) => href('offices', l, teamSlug(x, teams))));
    paths.push(...areasOf(all).map((a) => href('areas', l, a.slug)));
    if (devs.length) paths.push(ROUTES.developments[l]);
    for (const d of full) {
      if (!d) continue;
      paths.push(href('developments', l, d.slug));
      paths.push(...d.units.filter((u) => u.status !== 'sold').map((u) => href('developments', l, d.slug, unitSlug(u))));
    }
  }
  return sitemap(paths);
}
