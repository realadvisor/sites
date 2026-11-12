/**
 * The site's one data client. Every loader reads through `sites`, a
 * SitesClient (the @realadvisor/sites-sdk interface): live data when the
 * Worker has SITES_API_URL + SITES_API_KEY, else the fixture. Server only.
 */
import { siteClient, type Fixture } from '@realadvisor/sites-kit-react/server/data';
import raw from '../../../../astro/ballatoio/src/data/fixture.json';
import type { AgencyData, Listing } from './data';

const fixture = raw as unknown as Fixture;
export const sites = siteClient({ fixture });

/** The agency as the site shows it: the organisation and its primary team (phone, email, address). */
export async function agency(): Promise<AgencyData> {
  const [org, teams] = await Promise.all([sites.organisation(), sites.teams()]);
  const team = teams.find((t) => t.primary) ?? teams[0];
  return { org, team, teams };
}

/** A listing as a card or a row shows it: no description, no agent (loader data stays small). */
export const cardOf = ({ description: _d, description_text: _t, agent: _a, ...l }: Listing): Listing => l as Listing;
