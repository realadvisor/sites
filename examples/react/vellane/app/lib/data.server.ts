/**
 * The site's one data client. Every loader reads organisation, teams, agents
 * and listings through `sites` (a SitesClient, the @realadvisor/sites-sdk
 * interface): live data when the Worker has SITES_API_URL + SITES_API_KEY,
 * else the fixture (the Astro site's src/data/fixture.json). Server only.
 */
import type { Agent, Listing, Team } from '@realadvisor/sites-sdk/types';
import { siteClient, type Fixture } from '@realadvisor/sites-kit-react/server/data';
import fixture from '../../../../astro/vellane/src/data/fixture.json';

const fx = fixture as unknown as Fixture;
export const sites = siteClient({ fixture: fx });

export type { Agent, Listing, Team };

/** What every page needs, in one round of parallel calls. */
export async function siteData() {
  const [org, teams, agents] = await Promise.all([sites.organisation(), sites.teams(), sites.agents()]);
  return { org, teams, agents, primary: teams.find((t) => t.primary) ?? teams[0] };
}

/** The organisation as the kit's legal text and JSON-LD take it (organisation address, primary team contact). */
export async function agency() {
  const { org, primary } = await siteData();
  return { id: org.id, name: org.name, website: org.website, phone: primary?.phone, email: primary?.email, address: org.address };
}
