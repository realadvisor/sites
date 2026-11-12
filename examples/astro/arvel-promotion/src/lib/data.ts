/**
 * The site's one data client. Every page reads through `sites` (same calls as
 * @realadvisor/sites-sdk createClient, so the site runs unchanged on live
 * data). Fields the API does not have yet come from `fixtureOnly()`, and each
 * use is marked `// fixture only:` where it is rendered.
 */
import type { DevelopmentWithUnits, Team, Unit } from '@realadvisor/sites-sdk/types';
import fixture from '../data/fixture.json';
import { createFixtureClient, fixtureOnly, type Fixture } from '@realadvisor/sites-kit/fixture';

const fx = fixture as unknown as Fixture;
export const sites = createFixtureClient(fx);

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
// Fields the API does not have yet. Never put them into an SDK-shaped object.

export type UnitExtra = {
  unit_number?: string;
  /** 1-based position on the floor, left to right on the stacking plan. */
  position?: number;
  /** Main facade: N, NE, E, SE, S, SW, W, NW. */
  orientation?: string;
  terrace_surface?: number;
};
export type DevelopmentExtra = {
  developer?: string;
  architect?: string;
  general_contractor?: string;
  construction_photos?: string[];
};

export const unitExtra = (u: Pick<Unit, 'id'>): UnitExtra => fixtureOnly(fx, 'units', u.id) as UnitExtra;
export const developmentExtra = (d: { id: string }): DevelopmentExtra => fixtureOnly(fx, 'developments', d.id) as DevelopmentExtra;

/** Units in stacking-plan order: floor, then position on the floor (fixture only), then surface. */
export const unitsInOrder = (d: DevelopmentWithUnits) =>
  [...d.units].sort(
    (a, b) =>
      (a.floor ?? 0) - (b.floor ?? 0) ||
      (unitExtra(a).position ?? 99) - (unitExtra(b).position ?? 99) ||
      (a.living_surface ?? 0) - (b.living_surface ?? 0),
  );

/**
 * The organisation in the shape the kit's legal text builder takes
 * (`@realadvisor/sites-kit/legal`): name and the primary team's contacts.
 * No legal ids in the data yet: those lines stay out (never invented).
 */
export async function legalIdentity() {
  const [org, team] = await Promise.all([sites.organisation(), primaryTeam()]);
  return { id: org.id, name: org.name, phone: team?.phone, email: team?.email, address: team?.address ?? org.address };
}
