/**
 * The site's one data client. Every loader reads through `sites`, a
 * SitesClient (the @realadvisor/sites-sdk interface): live data when the
 * Worker has SITES_API_URL + SITES_API_KEY, else the fixture. Server only.
 */
import { siteClient, type Fixture } from '@realadvisor/sites-kit-react/server/data';
import fixture from '../../../../astro/cala-moreta/src/data/fixture.json';

const fx = fixture as unknown as Fixture;
export const sites = siteClient({ fixture: fx });

/** The agency as the site shows it: the organisation and its primary team (phone, email, address). */
export async function agency() {
  const [org, teams] = await Promise.all([sites.organisation(), sites.teams()]);
  const team = teams.find((t) => t.primary) ?? teams[0];
  return { org, team, teams };
}
export type AgencyData = Awaited<ReturnType<typeof agency>>;

/** Brand name: the office (team), else the organisation. */
export const brandName = ({ org, team }: AgencyData) => team?.name ?? org.name;
