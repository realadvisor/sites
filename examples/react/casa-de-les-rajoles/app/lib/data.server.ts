/**
 * The site's one data client. Every loader reads through `sites`, a
 * SitesClient (the @realadvisor/sites-sdk interface): live data when the
 * Worker has SITES_API_URL + SITES_API_KEY, else the fixture. Server only.
 *
 * Fields the API does not carry yet are read through `unitExtra()` and
 * `developmentExtra()` (fixture only) and are never merged into SDK objects.
 */
import type { Agent, DevelopmentWithUnits, Organisation, Team, Unit } from '@realadvisor/sites-sdk/types';
import type { Agency } from '@realadvisor/sites-kit-core';
import { siteClient, fixtureOnly, type Fixture } from '@realadvisor/sites-kit-react/server/data';
import fixture from '../../../../astro/casa-de-les-rajoles/src/data/fixture.json';

const fx = fixture as unknown as Fixture;
export const sites = siteClient({ fixture: fx });

/** The development this site is for (one-development site, AGENTS.md section 9). */
export const DEVELOPMENT_ID = '8a70316e-1d57-4953-b308-82d0bf03c044';

export type Site = {
  org: Organisation;
  team?: Team;
  agents: Agent[];
  dev: DevelopmentWithUnits;
  /** Development brokers first, then the rest of the team. */
  people: Agent[];
};

export async function loadSite(): Promise<Site> {
  const [org, teams, agents, dev] = await Promise.all([
    sites.organisation(),
    sites.teams(),
    sites.agents(),
    sites.development(DEVELOPMENT_ID),
  ]);
  if (!dev) throw new Error(`Development ${DEVELOPMENT_ID} not found`);
  const team = teams.find((t) => t.primary) ?? teams[0];
  const people = [...dev.agents, ...agents.filter((a) => !dev.agents.some((d) => d.id === a.id))];
  return { org, team, agents, dev, people };
}

/**
 * The organisation in the shape the kit's legal text and JSON-LD expect.
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
