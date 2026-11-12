/** sitemap.xml: static pages, area and agent pages, journal posts and every available listing. */
import { legalPaths, sitemap } from '@realadvisor/sites-kit-react/server/seo';
import { areas, sites } from '../lib/data.server';
import { posts } from '../content/journal.server';
import { agentUrl, listingUrl } from '../lib/urls';

const STATIC_PATHS = ['/', '/kaufen', '/mieten', '/verkaufen', '/verkauft', '/team', '/ueber-uns', '/journal', '/kontakt'];

export async function loader() {
  const [listings, agents, places] = await Promise.all([sites.allListings({ status: 'available' }), sites.agents(), areas()]);
  return sitemap([
    ...STATIC_PATHS,
    ...legalPaths(),
    ...places.map((p) => `/orte/${p.slug}`),
    ...agents.map(agentUrl),
    ...posts().map((p) => `/journal/${p.id}`),
    ...listings.map(listingUrl),
  ]);
}
