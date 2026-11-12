/**
 * The site's one data client. Every page reads through `client` (a
 * @realadvisor/sites-sdk SitesClient): here it answers from the example
 * fixture; with `createClient` from @realadvisor/sites-sdk it would answer
 * from rest-api with the same calls.
 *
 * Fields the API does not have yet live in `fixture_only` and are read only
 * through `extra()` / `devExtra()` below: they never enter an SDK object.
 */
import type { Agent, DevelopmentWithUnits, Organisation, Team, Unit } from '@realadvisor/sites-sdk/types';
import type { Agency } from '@realadvisor/sites-kit';
import fixture from '../data/fixture.json';
import { createFixtureClient, fixtureOnly, type Fixture } from '@realadvisor/sites-kit/fixture';

const fx = fixture as unknown as Fixture;
export const client = createFixtureClient(fx);

/** The development this site markets (one-development site). */
export const DEVELOPMENT_ID = '04495a59-33bc-4f21-8dfb-1efc3f7ca206';

export type Site = {
  org: Organisation;
  team?: Team;
  agents: Agent[];
  dev: DevelopmentWithUnits;
  /** The rental contact: the development's first agent, else the team's first. */
  contact?: Agent;
};

export async function site(): Promise<Site> {
  const [org, teams, agents, dev] = await Promise.all([
    client.organisation(),
    client.teams(),
    client.agents(),
    client.development(DEVELOPMENT_ID),
  ]);
  if (!dev) throw new Error(`development ${DEVELOPMENT_ID} not found`);
  const team = teams.find((t) => t.primary) ?? teams[0];
  return { org, team, agents, dev, contact: dev.agents[0] ?? agents[0] };
}

/** Fixture-only facts of one unit. */
export type UnitExtra = {
  number?: string;
  building?: string;
  position?: number;
  orientation?: string;
  moveIn?: string;
  charges?: number;
  terrace?: number;
};

// fixture only: unit number, building, position, orientation, move-in date, charges, terrace.
export function extra(u: Pick<Unit, 'id'>): UnitExtra {
  const x = fixtureOnly(fx, 'units', u.id) as Record<string, unknown>;
  const s = (k: string) => (typeof x[k] === 'string' ? (x[k] as string) : undefined);
  const n = (k: string) => (typeof x[k] === 'number' ? (x[k] as number) : undefined);
  return {
    number: s('unit_number'),
    building: s('building'),
    position: n('position'),
    orientation: s('orientation'),
    moveIn: s('move_in_date'),
    charges: n('charges'),
    terrace: n('terrace_surface'),
  };
}

/** Fixture-only facts of the development. */
export type DevExtra = {
  developer?: string;
  architect?: string;
  contractor?: string;
  buildings: string[];
  constructionPhotos: string[];
};

// fixture only: developer, architect, general contractor, buildings, construction photos.
export function devExtra(id: string): DevExtra {
  const x = fixtureOnly(fx, 'developments', id) as Record<string, unknown>;
  const list = (k: string) => (Array.isArray(x[k]) ? (x[k] as unknown[]).filter((v): v is string => typeof v === 'string') : []);
  return {
    developer: typeof x.developer === 'string' ? x.developer : undefined,
    architect: typeof x.architect === 'string' ? x.architect : undefined,
    contractor: typeof x.general_contractor === 'string' ? x.general_contractor : undefined,
    buildings: list('buildings'),
    constructionPhotos: list('construction_photos'),
  };
}

/** The organisation and its team in the kit's Agency shape, for the kit's legal text only. */
export const legalAgency = (s: Site): Agency => ({
  id: s.org.id,
  name: s.org.name,
  website: s.org.website,
  phone: s.team?.phone,
  email: s.team?.email,
  address: s.org.address,
});
