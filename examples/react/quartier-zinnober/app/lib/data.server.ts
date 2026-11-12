/**
 * The site's one data client. Every loader reads through `sites`, a
 * SitesClient (the @realadvisor/sites-sdk interface): live data when the
 * Worker has SITES_API_URL + SITES_API_KEY, else the fixture. Server only.
 *
 * Fields the API does not have yet live in `fixture_only` and are read only
 * through `extra()` / `devExtra()` below: they never enter an SDK object.
 * Unit numbers, orientations, move-in dates, charges and the development's
 * companies are API fields of the records.
 */
import type { Agent, DevelopmentWithUnits, Organisation, Team, Unit } from '@realadvisor/sites-sdk/types';
import type { Agency } from '@realadvisor/sites-kit-core';
import { siteClient, fixtureOnly, type Fixture } from '@realadvisor/sites-kit-react/server/data';
import fixture from '../../../../astro/quartier-zinnober/src/data/fixture.json';
import type { Row, UnitExtra } from './units';

const fx = fixture as unknown as Fixture;
export const sites = siteClient({ fixture: fx });

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
    sites.organisation(),
    sites.teams(),
    sites.agents(),
    sites.development(DEVELOPMENT_ID),
  ]);
  if (!dev) throw new Error(`development ${DEVELOPMENT_ID} not found`);
  const team = teams.find((t) => t.primary) ?? teams[0];
  return { org, team, agents, dev, contact: dev.agents[0] ?? agents[0] };
}

// fixture only: building, position.
export function extra(u: Pick<Unit, 'id'>): UnitExtra {
  const x = fixtureOnly(fx, 'units', u.id) as Record<string, unknown>;
  const s = (k: string) => (typeof x[k] === 'string' ? (x[k] as string) : undefined);
  const n = (k: string) => (typeof x[k] === 'number' ? (x[k] as number) : undefined);
  return {
    building: s('building'),
    position: n('position'),
  };
}

/** Fixture-only facts of the development. */
export type DevExtra = {
  buildings: string[];
  constructionPhotos: string[];
};

// fixture only: buildings, construction photos.
export function devExtra(id: string): DevExtra {
  const x = fixtureOnly(fx, 'developments', id) as Record<string, unknown>;
  const list = (k: string) => (Array.isArray(x[k]) ? (x[k] as unknown[]).filter((v): v is string => typeof v === 'string') : []);
  return {
    buildings: list('buildings'),
    constructionPhotos: list('construction_photos'),
  };
}

/** Every unit with its fixture-only facts, sorted building, floor, position. */
export function rowsOf(dev: DevelopmentWithUnits): Row[] {
  return dev.units
    .map((u) => ({ u, x: extra(u) }))
    .sort(
      (a, b) =>
        (a.x.building ?? '').localeCompare(b.x.building ?? '') ||
        (a.u.floor ?? 0) - (b.u.floor ?? 0) ||
        (a.x.position ?? 0) - (b.x.position ?? 0) ||
        (a.u.rooms ?? 0) - (b.u.rooms ?? 0),
    );
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

/** What the header and footer show (root loader): small on purpose. */
export const layoutData = (s: Site) => ({
  available: s.dev.stats.available,
  units: s.dev.stats.units,
  devTitle: s.dev.title,
  devAddress: s.dev.address,
  orgName: s.org.name,
  orgAddress: s.org.address,
  team: s.team ? { name: s.team.name, phone: s.team.phone, email: s.team.email, address: s.team.address } : undefined,
});
export type LayoutData = ReturnType<typeof layoutData>;
