/**
 * The site's one data client. Every loader reads through `sites`, a
 * SitesClient (the @realadvisor/sites-sdk interface): live data when the
 * Worker has SITES_API_URL + SITES_API_KEY, else the fixture. Server only.
 */
import type { Agent, Organisation, Team } from '@realadvisor/sites-sdk/types';
import { siteClient, type Fixture } from '@realadvisor/sites-kit-react/server/data';
import fixture from '../../../../astro/studio-vey/src/data/fixture.json';
import { slugify } from './urls';

const fx = fixture as unknown as Fixture;
export const sites = siteClient({ fixture: fx });

export type Site = { org: Organisation; team: Team; agents: Agent[] };

/** Organisation, its primary team (the office) and agents: whose site this is. */
export async function site(): Promise<Site> {
  const [org, teams, agents] = await Promise.all([sites.organisation(), sites.teams(), sites.agents()]);
  const team = teams.find((t) => t.primary) ?? teams[0]!;
  return { org, team, agents };
}

/** The brand name without the legal form: "Studio Vey Immobilien AG" -> team "Studio Vey". */
export const brandName = (s: Site) => s.team?.name || s.org.name;

/** Minimum listings (any status) for a city to get its own area page. */
export const AREA_MIN = 3;

export type Area = { city: string; slug: string; total: number };

/** Cities with an area page, most listings first. */
export async function areas(): Promise<Area[]> {
  const all = await sites.allListings();
  const by = new Map<string, number>();
  for (const l of all) if (l.address.city) by.set(l.address.city, (by.get(l.address.city) ?? 0) + 1);
  return [...by]
    .filter(([, n]) => n >= AREA_MIN)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'de'))
    .map(([city, total]) => ({ city, slug: slugify(city), total }));
}
