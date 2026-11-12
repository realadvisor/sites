/**
 * sitemap.xml: every static page, every available listing, agency, agent and city page.
 * Add each new static page to STATIC_PATHS. (/favoris is per-browser and noindex: left out.)
 */
import { sitemap } from '@realadvisor/sites-kit-react/server/seo';
import { sites } from '../lib/data.server';
import { agentHref, citiesOf, cityHref, listingHref, R, teamHref } from '../lib/site';

const STATIC_PATHS = [R.home, R.buy, R.rent, R.sell, R.sold, R.agencies, R.team, R.cities, R.about, R.contact, R.legal, R.privacy];

export async function loader() {
  const [all, teams, agents] = await Promise.all([sites.allListings(), sites.teams(), sites.agents()]);
  return sitemap([
    ...STATIC_PATHS,
    ...all.filter((l) => l.status === 'available').map(listingHref),
    ...teams.map(teamHref),
    ...agents.map(agentHref),
    ...citiesOf(all).map((c) => cityHref(c.city)),
  ]);
}
