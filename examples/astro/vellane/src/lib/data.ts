/**
 * The site's one data client. Every page reads organisation, teams, agents
 * and listings through `sites` (the @realadvisor/sites-sdk SitesClient,
 * snake_case). With SITES_API_KEY set it is the live SDK client; otherwise
 * the example fixture (src/data/fixture.json) answers the same calls with the
 * same filters.
 *
 * Fields the API does not have yet live in `fixture_only` and are read only
 * through `extraNum` / `extraStr`: every use is marked `// fixture only:`.
 */
import { SITES_API_KEY } from 'astro:env/server';
import { createClient } from '@realadvisor/sites-sdk';
import type { Agent, Listing, SitesClient, Team } from '@realadvisor/sites-sdk/types';
import fixture from '../data/fixture.json';
import { createFixtureClient, fixtureOnly, type Fixture } from '@realadvisor/sites-kit/fixture';

const fx = fixture as unknown as Fixture;

export const live = !!SITES_API_KEY;
export const sites: SitesClient = live ? createClient({ portals: fx.portals }) : createFixtureClient(fx);

const extra = (id: string): Record<string, unknown> => (live ? {} : fixtureOnly(fx, 'listings', id));
/** One fixture-only number of a listing (undefined on live data). */
export const extraNum = (id: string, key: string) => {
  const v = extra(id)[key];
  return typeof v === 'number' && Number.isFinite(v) ? v : undefined;
};
/** One fixture-only string of a listing (undefined on live data). */
export const extraStr = (id: string, key: string) => {
  const v = extra(id)[key];
  return typeof v === 'string' && v.trim() ? v.trim() : undefined;
};

export type { Agent, Listing, Team };

/** What every page needs, in one round of parallel calls. */
export async function siteData() {
  const [org, teams, agents] = await Promise.all([sites.organisation(), sites.teams(), sites.agents()]);
  return { org, teams, agents, primary: teams.find((t) => t.primary) ?? teams[0] };
}
