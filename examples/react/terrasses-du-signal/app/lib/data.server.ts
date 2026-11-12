/**
 * The site's one data client. Every loader reads through `sites`, a
 * SitesClient (the @realadvisor/sites-sdk interface): live data when the
 * Worker has SITES_API_URL + SITES_API_KEY, else the fixture. Server only.
 *
 * The position on the floor, which the API does not carry yet, is read
 * through `extras` (fixture only) and never merged into SDK objects.
 * Unit numbers, orientations, outdoor surfaces and the development's
 * companies are API fields of the records.
 */
import type { Agent, DevelopmentWithUnits, Organisation, Team } from '@realadvisor/sites-sdk/types';
import type { Agency } from '@realadvisor/sites-kit';
import { siteClient, fixtureOnly, type Fixture } from '@realadvisor/sites-kit-react/server/data';
import { notFound } from '@realadvisor/sites-kit-react/server/seo';
import fixture from '../../../../astro/terrasses-du-signal/src/data/fixture.json';
import type { Extras, UnitExtra } from './units';

const fx = fixture as unknown as Fixture;
export const sites = siteClient({ fixture: fx });

/** The development this site is for (one-development site, AGENTS.md section 9). */
export const DEVELOPMENT_ID = '5418826d-128c-452c-8479-605681362db5';

export type Site = {
  org: Organisation;
  team?: Team;
  agents: Agent[];
  dev: DevelopmentWithUnits;
  /** The broker of the development, else the first agent of the team. */
  agent?: Agent;
  /** fixture only: position on the floor, by unit id. */
  extras: Extras;
};

export async function loadSite(): Promise<Site> {
  const [org, teams, agents, dev] = await Promise.all([
    sites.organisation(),
    sites.teams(),
    sites.agents(),
    sites.development(DEVELOPMENT_ID),
  ]);
  if (!dev) throw notFound();
  const team = teams.find((t) => t.primary) ?? teams[0];
  // fixture only: every read of the unit extras goes through here.
  const extras: Extras = Object.fromEntries(dev.units.map((u) => [u.id, fixtureOnly(fx, 'units', u.id) as UnitExtra]));
  return { org, team, agents, dev, agent: dev.agents[0] ?? agents[0], extras };
}

/**
 * The organisation in the shape the kit's legal text and JSON-LD expect
 * Contacts come from the primary team; nothing is invented. Same as the
 * Astro version.
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
