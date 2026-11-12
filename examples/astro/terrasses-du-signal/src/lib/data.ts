/**
 * The site's one data source. Every page calls `loadSite()`: the same calls as
 * `@realadvisor/sites-sdk` createClient, answered here from the example
 * fixture. On live data only `client` changes (createClient({ portals })).
 *
 * Fields the API does not carry yet (position on the floor, construction
 * photos) are read through `unitExtra()` and `developmentExtra()` (fixture
 * only) and never merged into SDK objects.
 * Unit numbers, orientations, outdoor surfaces and the development's
 * companies are API fields of the records.
 */
import type { Agent, DevelopmentWithUnits, Organisation, Team, Unit } from '@realadvisor/sites-sdk/types';
import type { Agency } from '@realadvisor/sites-kit';
import fixture from '../data/fixture.json';
import { createFixtureClient, fixtureOnly, type Fixture } from '@realadvisor/sites-kit/fixture';

const fx = fixture as unknown as Fixture;
export const client = createFixtureClient(fx);

/** The development this site is for (one-development site, AGENTS.md section 9). */
export const DEVELOPMENT_ID = '5418826d-128c-452c-8479-605681362db5';

export type Site = {
  org: Organisation;
  team?: Team;
  agents: Agent[];
  dev: DevelopmentWithUnits;
  /** The broker of the development, else the first agent of the team. */
  agent?: Agent;
};

export async function loadSite(): Promise<Site> {
  const [org, teams, agents, dev] = await Promise.all([
    client.organisation(),
    client.teams(),
    client.agents(),
    client.development(DEVELOPMENT_ID),
  ]);
  if (!dev) throw new Error(`Development ${DEVELOPMENT_ID} not found`);
  const team = teams.find((t) => t.primary) ?? teams[0];
  return { org, team, agents, dev, agent: dev.agents[0] ?? agents[0] };
}

/**
 * The organisation in the shape the kit's legal text and JSON-LD expect
 * Contacts come from the primary team; nothing is invented.
 */
export const legalAgency = ({ org, team }: Pick<Site, 'org' | 'team'>): Agency => ({
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
  position?: number;
};

/** fixture only: position on the floor. */
export const unitExtra = (u: Pick<Unit, 'id'>): UnitExtra => fixtureOnly(fx, 'units', u.id) as UnitExtra;

export type DevelopmentExtra = {
  construction_photos?: string[];
};

/** fixture only: construction photos. */
export const developmentExtra = (d: Pick<DevelopmentWithUnits, 'id'>): DevelopmentExtra =>
  fixtureOnly(fx, 'developments', d.id) as DevelopmentExtra;
