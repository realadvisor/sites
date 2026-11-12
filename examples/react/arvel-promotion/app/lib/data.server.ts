/**
 * The site's one data client. Every loader reads through `sites`, a
 * SitesClient (the @realadvisor/sites-sdk interface): live data when the
 * Worker has SITES_API_URL + SITES_API_KEY, else the fixture. Fields the API
 * does not have yet come from `fixtureOnly()`, and each use is marked
 * `// fixture only:` where it is rendered. Server only.
 */
import type { DevelopmentWithUnits, Team } from '@realadvisor/sites-sdk/types';
import { siteClient, fixtureOnly, type Fixture } from '@realadvisor/sites-kit-react/server/data';
import fixture from '../../../../astro/arvel-promotion/src/data/fixture.json';
import type { DevelopmentExtra, UnitExtras } from './units';

const fx = fixture as unknown as Fixture;
export const sites = siteClient({ fixture: fx });

/** The site's own team (contact details of the developer). */
export async function primaryTeam(): Promise<Team | undefined> {
  const teams = await sites.teams();
  return teams.find((t) => t.primary) ?? teams[0];
}

/** Programmes in a stable order: on sale first, then building, then delivered. */
const ORDER: Record<string, number> = { marketing: 0, construction: 1, planning: 2, delivered: 3 };
export async function programmes() {
  const all = await sites.developments();
  return [...all].sort((a, b) => (ORDER[a.status ?? ''] ?? 9) - (ORDER[b.status ?? ''] ?? 9));
}

// ---- fixture only -------------------------------------------------------
// Fields the API does not have yet. Never put them into an SDK-shaped object:
// loaders pass them next to the record, keyed by id.

/** Extras of every unit of a development (unit_number, position, orientation, terrace_surface). */
export const unitExtras = (d: Pick<DevelopmentWithUnits, 'units'>): UnitExtras =>
  Object.fromEntries(d.units.map((u) => [u.id, fixtureOnly(fx, 'units', u.id)])) as UnitExtras;
export const developmentExtra = (d: { id: string }): DevelopmentExtra => fixtureOnly(fx, 'developments', d.id) as DevelopmentExtra;

/**
 * The organisation in the shape the kit's legal text builder takes
 * (`@realadvisor/sites-kit/legal`): name and the primary team's contacts.
 * No legal ids in the data yet: those lines stay out (never invented).
 */
export async function legalIdentity() {
  const [org, team] = await Promise.all([sites.organisation(), primaryTeam()]);
  return { id: org.id, name: org.name, phone: team?.phone, email: team?.email, address: team?.address ?? org.address };
}
