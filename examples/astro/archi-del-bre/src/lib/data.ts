/**
 * The site's one data source. Every page calls `loadSite()`: the same calls as
 * `@realadvisor/sites-sdk` createClient, answered here from the example
 * fixture. On live data only `client` changes (createClient({ portals })).
 *
 * Fields the API does not carry yet are read through `unitExtra()` and
 * `developmentExtra()` (fixture only) and never merged into SDK objects.
 */
import type { Agent, DevelopmentWithUnits, Organisation, Team, Unit } from '@realadvisor/sites-sdk/types';
import fixture from '../data/fixture.json';
import { createFixtureClient, fixtureOnly, type Fixture } from '@realadvisor/sites-kit/fixture';

const fx = fixture as unknown as Fixture;
export const client = createFixtureClient(fx);

/** The development this site is for (one-development site, AGENTS.md section 9). */
export const DEVELOPMENT_ID = '3894f0bf-4a44-49b0-b26b-d286b4bda70b';

export type Site = {
  org: Organisation;
  team?: Team;
  agents: Agent[];
  dev: DevelopmentWithUnits;
  /** The broker of the development, else the first agent of the team. */
  agent?: Agent;
};

let cached: Promise<Site> | null = null;
export function loadSite(): Promise<Site> {
  cached ??= (async () => {
    const [org, teams, agents, dev] = await Promise.all([
      client.organisation(),
      client.teams(),
      client.agents(),
      client.development(DEVELOPMENT_ID),
    ]);
    if (!dev) throw new Error(`Development ${DEVELOPMENT_ID} not found`);
    const team = teams.find((t) => t.primary) ?? teams[0];
    return { org, team, agents, dev, agent: dev.agents[0] ?? agents[0] };
  })();
  return cached;
}

/** The organisation as the kit's legal text reads it. Contacts from the primary team. */
export const legalAgency = ({ org, team }: Pick<Site, 'org' | 'team'>) => ({
  id: org.id,
  name: org.name,
  website: org.website,
  address: org.address,
  phone: team?.phone,
  email: team?.email,
  logo: org.logo,
  brand: org.brand,
});

export type UnitExtra = {
  unit_number?: string;
  building?: string;
  position?: number;
  orientation?: string;
  garden_surface?: number;
  terrace_surface?: number;
};

/** fixture only: unit number, building, position on the floor, orientation, garden or terrace surface. */
export const unitExtra = (u: Pick<Unit, 'id'>): UnitExtra => fixtureOnly(fx, 'units', u.id) as UnitExtra;

export type DevelopmentExtra = {
  developer?: string;
  architect?: string;
  general_contractor?: string;
  buildings?: string[];
  construction_photos?: string[];
};

/** fixture only: developer, architect, general contractor, buildings, construction photos. */
export const developmentExtra = (d: Pick<DevelopmentWithUnits, 'id'>): DevelopmentExtra =>
  fixtureOnly(fx, 'developments', d.id) as DevelopmentExtra;
