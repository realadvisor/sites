/**
 * The site's one data client. Every loader reads through `sites`, a
 * SitesClient (the @realadvisor/sites-sdk interface): live data when the
 * Worker has SITES_API_URL + SITES_API_KEY, else app/data/fixture.json
 * (`sites-kit fixture` puts the fictional Demo Agency there). Server only:
 * never import it from app/client.ts or an island.
 */
import { agencyOf, type Agency } from '@realadvisor/sites-kit-core/agency';
import { siteClient, type Fixture } from '@realadvisor/sites-kit-react/server/data';
import fixture from '../data/fixture.json';

export const sites = siteClient({ fixture: fixture as unknown as Fixture });

/** The agency whose site this is: organisation + its primary team (legal notice, JSON-LD, footer). */
export async function agency(): Promise<Agency> {
  const [org, teams] = await Promise.all([sites.organisation(), sites.teams()]);
  return agencyOf(org, teams.find((t) => t.primary) ?? teams[0]);
}
