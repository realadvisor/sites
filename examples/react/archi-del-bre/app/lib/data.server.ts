/**
 * The site's one data source. Every loader calls `loadSite()`: one SitesClient
 * (the @realadvisor/sites-sdk interface), live data when the Worker has
 * SITES_API_URL + SITES_API_KEY, else the fixture. Server only.
 * Fields the API does not carry yet: lib/extras.ts (fixture only).
 */
import type { Agent, DevelopmentWithUnits, Organisation, Team } from '@realadvisor/sites-sdk/types';
import { siteClient, type Fixture } from '@realadvisor/sites-kit-react/server/data';
import fixture from '../../../../astro/archi-del-bre/src/data/fixture.json';

export const sites = siteClient({ fixture: fixture as unknown as Fixture });

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

/** One read per request: the root loader (header, footer, 404) and the page's loader share it. */
const perRequest = new WeakMap<Request, Promise<Site>>();
export function loadSite(request?: Request): Promise<Site> {
  if (!request) return readSite();
  let p = perRequest.get(request);
  if (!p) perRequest.set(request, (p = readSite()));
  return p;
}

async function readSite(): Promise<Site> {
  const [org, teams, agents, dev] = await Promise.all([
    sites.organisation(),
    sites.teams(),
    sites.agents(),
    sites.development(DEVELOPMENT_ID),
  ]);
  if (!dev) throw new Error(`Development ${DEVELOPMENT_ID} not found`);
  const team = teams.find((t) => t.primary) ?? teams[0];
  return { org, team, agents, dev, agent: dev.agents[0] ?? agents[0] };
}

/** The organisation in the shape the kit's legal text expects, contacts from the primary team (as the Astro site: the organisation's address). */
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
