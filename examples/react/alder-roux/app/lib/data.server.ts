/**
 * The site's one data client. Every loader reads organisation, teams,
 * agents, listings and developments through `sites` (the
 * @realadvisor/sites-sdk SitesClient interface): live data when the Worker
 * has SITES_API_URL + SITES_API_KEY, else the example fixture with the same
 * filters. Server only.
 *
 * Texts come in the page's language (siteClient reads the page locale).
 *
 * Fields the API does not have yet (a unit's position on its floor) live in
 * the fixture's `fixture_only` and reach pages only through `extras()`
 * (empty on live data).
 */
import { fixtureOnly, hasLiveData, siteClient, type Fixture } from '@realadvisor/sites-kit-react/server/data';
import type { Agent, DevelopmentWithUnits, Listing, Team } from '@realadvisor/sites-sdk/types';
import fixture from '../../../../astro/alder-roux/src/data/fixture.json';
import type { Extras } from './extras';
import { areasOf } from './areas';
import { agentSlug, teamSlug, unitIdPrefix } from './routes';

const fx = fixture as unknown as Fixture;
export const sites = siteClient({ fixture: fx });

/** True on live data (no fixture-only extras there). */
export const live = () => hasLiveData();

/** Fixture-only extras of these records ({} on live data, where they do not exist yet). */
export function extras(kind: 'listings' | 'units' | 'developments', ids: string[]): Extras {
  if (live()) return {};
  const out: Extras = {};
  for (const id of ids) {
    const x = fixtureOnly(fx, kind, id) as Record<string, unknown>;
    if (Object.keys(x).length) out[id] = x;
  }
  return out;
}

export type { Agent, DevelopmentWithUnits, Listing, Team };

/** Everything most pages need, in one round of parallel calls. */
export async function siteData() {
  const [org, teams, agents] = await Promise.all([sites.organisation(), sites.teams(), sites.agents()]);
  return { org, teams, agents, primary: teams.find((t) => t.primary) ?? teams[0] };
}

export const areaList = async () => areasOf(await sites.allListings());

// Page-level lookups for the routes with a slug (null: the page throws notFound()).
export const findAgent = async (slug: string) => {
  const agents = await sites.agents();
  return agents.find((a) => agentSlug(a, agents) === slug) ?? null;
};
export const findTeam = async (slug: string) => {
  const teams = await sites.teams();
  return teams.find((x) => teamSlug(x, teams) === slug) ?? null;
};
export const findUnit = async (devSlug: string, unitSlug: string) => {
  const dev = await sites.development(devSlug);
  const prefix = unitIdPrefix(unitSlug);
  const unit = dev && prefix ? dev.units.find((u) => u.id.toLowerCase().startsWith(prefix)) : undefined;
  return dev && unit ? { dev, unit } : null;
};
