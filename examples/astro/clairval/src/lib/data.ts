/**
 * The site's one data client. Every page reads organisation, teams, agents,
 * listings and developments through `sites` (the @realadvisor/sites-sdk
 * SitesClient interface, snake_case). With SITES_API_KEY set it is the live
 * SDK client; otherwise the example fixture (src/data/fixture.json) answers
 * the same calls with the same filters.
 *
 * On the site's second language, `inPageLocale` reads listing texts in the
 * page's language when the data has them.
 */
import { SITES_API_KEY } from 'astro:env/server';
import { createClient } from '@realadvisor/sites-sdk';
import type { Agent, DevelopmentWithUnits, Listing, SitesClient, Team } from '@realadvisor/sites-sdk/types';
import fixture from '../data/fixture.json';
import { createFixtureClient, type Fixture } from '@realadvisor/sites-kit-core/fixture';
import { inPageLocale } from '@realadvisor/sites-kit-core/page-locale';

const fx = fixture as unknown as Fixture;

export const live = !!SITES_API_KEY;
export const sites: SitesClient = inPageLocale(live ? createClient({ portals: fx.portals }) : createFixtureClient(fx));

export type { Agent, DevelopmentWithUnits, Listing, Team };

/** Everything most pages need, in one round of parallel calls. */
export async function siteData() {
  const [org, teams, agents] = await Promise.all([sites.organisation(), sites.teams(), sites.agents()]);
  return { org, teams, agents, primary: teams.find((t) => t.primary) ?? teams[0] };
}
