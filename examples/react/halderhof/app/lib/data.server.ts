/**
 * The site's one data client. Every loader reads organisation, teams,
 * agents, listings and developments through `sites` (a SitesClient, the
 * @realadvisor/sites-sdk interface): live data when the Worker has
 * SITES_API_URL + SITES_API_KEY, else the example fixture. Server only.
 *
 * Fields the API does not have yet (position on the floor, buildings,
 * documents, construction photos) live in `fixture_only` and are read only
 * through `extra()` ({} on live data): every use is marked `// fixture only:`.
 */
import type { Agent, DevelopmentWithUnits, Listing, Team, Unit } from '@realadvisor/sites-sdk/types';
import { fixtureOnly, hasLiveData, siteClient, type Fixture } from '@realadvisor/sites-kit-react/server/data';
import fixture from '../../../../astro/halderhof/src/data/fixture.json';
import { agentSlug, teamSlug, unitIdPrefix } from './routes';
import { regionsOf } from './regions';
import type { UnitExtras } from './dev';

const fx = fixture as unknown as Fixture;
export const sites = siteClient({ fixture: fx });

type Kind = 'listings' | 'units' | 'developments';
/** Fixture-only extras of one record ({} on live data, where they do not exist yet). */
export const extra = (kind: Kind, id: string): Record<string, unknown> => (hasLiveData() ? {} : fixtureOnly(fx, kind, id));
export const extraNum = (kind: Kind, id: string, key: string) => {
  const v = extra(kind, id)[key];
  return typeof v === 'number' && Number.isFinite(v) ? v : undefined;
};

// fixture only: position on the floor
export const unitExtras = (units: Pick<Unit, 'id'>[]): UnitExtras =>
  Object.fromEntries(units.map((u) => [u.id, { position: extraNum('units', u.id, 'position') }]));

/** Everything most pages need, in one round of parallel calls. */
export async function siteData() {
  const [org, teams, agents] = await Promise.all([sites.organisation(), sites.teams(), sites.agents()]);
  return { org, teams, agents, primary: teams.find((t) => t.primary) ?? teams[0] };
}

/** A listing as a card shows it: no description, no agent, the first photo (loader data stays small). */
export const cardOf = ({ description: _d, description_text: _t, agent: _a, ...l }: Listing): Listing =>
  ({ ...l, photos: l.photos.slice(0, 1) }) as Listing;

export async function regionList() {
  const [teams, all] = await Promise.all([sites.teams(), sites.allListings()]);
  return regionsOf(teams, all.map(cardOf));
}

// ---- lookups for the routes with a slug ----------------------------------
export const findAgent = async (slug: string): Promise<Agent | null> => {
  const agents = await sites.agents();
  return agents.find((a) => agentSlug(a, agents) === slug) ?? null;
};
export const findTeam = async (slug: string): Promise<Team | null> => {
  const teams = await sites.teams();
  return teams.find((x) => teamSlug(x, teams) === slug) ?? null;
};
export const findRegion = async (slug: string) => (await regionList()).find((r) => r.slug === slug) ?? null;
export const findUnit = async (devSlug: string, unitSlug: string): Promise<{ dev: DevelopmentWithUnits; unit: Unit } | null> => {
  const dev = await sites.development(devSlug);
  const prefix = unitIdPrefix(unitSlug);
  const unit = dev && prefix ? dev.units.find((u) => u.id.toLowerCase().startsWith(prefix)) : undefined;
  return dev && unit ? { dev, unit } : null;
};

/**
 * The organisation as the kit's legal text and JSON-LD read it (the Astro
 * version's inline `agency`): contacts from the primary team, nothing invented.
 */
export const legalAgency = ({ org, primary }: Pick<Awaited<ReturnType<typeof siteData>>, 'org' | 'primary'>) => ({
  id: org.id,
  name: org.name,
  phone: primary?.phone,
  email: primary?.email,
  address: org.address,
  website: org.website,
});
