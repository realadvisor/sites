/**
 * The site's one data client. Every page reads organisation, teams, agents,
 * listings and developments through `sites` (the @realadvisor/sites-sdk
 * SitesClient interface, snake_case). With SITES_API_KEY set it is the live
 * SDK client; otherwise the example fixture (src/data/fixture.json) answers
 * the same calls with the same filters.
 *
 * Fields the API does not have yet (position on the floor, buildings,
 * documents, construction photos) live in `fixture_only` and are read only
 * through `extra()`: every use is marked `// fixture only:` in the pages.
 */
import { SITES_API_KEY } from 'astro:env/server';
import { createClient } from '@realadvisor/sites-sdk';
import type { Agent, DevelopmentWithUnits, Listing, SitesClient, Team } from '@realadvisor/sites-sdk/types';
import fixture from '../data/fixture.json';
import { createFixtureClient, fixtureOnly, type Fixture } from '@realadvisor/sites-kit/fixture';
import { inPageLocale } from '@realadvisor/sites-kit/page-locale';

const fx = fixture as unknown as Fixture;

export const live = !!SITES_API_KEY;
// Listings and developments in the page's language when the CRM has their texts in it.
export const sites: SitesClient = inPageLocale(live ? createClient({ portals: fx.portals }) : createFixtureClient(fx));

/** Fixture-only extras of one record ({} on live data, where they do not exist yet). */
export const extra = (kind: 'listings' | 'units' | 'developments', id: string): Record<string, unknown> =>
  live ? {} : fixtureOnly(fx, kind, id);

/** Typed read of one fixture-only number. */
export const extraNum = (kind: 'listings' | 'units' | 'developments', id: string, key: string) => {
  const v = extra(kind, id)[key];
  return typeof v === 'number' && Number.isFinite(v) ? v : undefined;
};

export type { Agent, DevelopmentWithUnits, Listing, Team };

/** Everything most pages need, in one round of parallel calls. */
export async function siteData() {
  const [org, teams, agents] = await Promise.all([sites.organisation(), sites.teams(), sites.agents()]);
  return { org, teams, agents, primary: teams.find((t) => t.primary) ?? teams[0] };
}
