/**
 * The site's one data client. Every page reads through `sites`, a SitesClient
 * with the same calls as `@realadvisor/sites-sdk` createClient: on live data
 * this file becomes `createClient({ portals })` and nothing else changes.
 * Server side only.
 */
import type { Agent, Listing, Organisation, Team } from '@realadvisor/sites-sdk/types';
import fixture from '../data/fixture.json';
import { createFixtureClient, fixtureOnly, type Fixture } from '@realadvisor/sites-kit/fixture';

const fx = fixture as unknown as Fixture;
export const sites = createFixtureClient(fx);

/** Fields the API does not have yet (fixture only). Never present them as API data. */
export type ListingExtras = {
  energy_class?: string;
  year_built?: number;
  floor?: number;
  terrace_surface?: number;
  balcony_surface?: number;
  charges?: number;
};
// fixture only: every read of these extras goes through this one function.
export const listingExtras = (id: string): ListingExtras => fixtureOnly(fx, 'listings', id) as ListingExtras;

export type Site = { org: Organisation; team: Team; agents: Agent[] };

/** Organisation, its primary team (the office) and agents: whose site this is. */
export async function site(): Promise<Site> {
  const [org, teams, agents] = await Promise.all([sites.organisation(), sites.teams(), sites.agents()]);
  const team = teams.find((t) => t.primary) ?? teams[0]!;
  return { org, team, agents };
}

/** The brand name without the legal form: "Studio Vey Immobilien AG" -> team "Studio Vey". */
export const brandName = (s: Site) => s.team?.name || s.org.name;

const fold = (s = '') => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
/** URL slug of a name: "Küsnacht" -> "kuesnacht", "Nora Vey" -> "nora-vey". */
export const slugify = (s: string) =>
  fold(s.replace(/ä/gi, 'ae').replace(/ö/gi, 'oe').replace(/ü/gi, 'ue'))
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

export const agentSlug = (a: Pick<Agent, 'first_name' | 'last_name'>) => slugify(`${a.first_name} ${a.last_name}`);
export const agentUrl = (a: Pick<Agent, 'first_name' | 'last_name'>) => `/team/${agentSlug(a)}`;
export const listingUrl = (l: Pick<Listing, 'slug'>) => `/objekte/${l.slug}`;
export const areaUrl = (city: string) => `/orte/${slugify(city)}`;

/** Minimum listings (any status) for a city to get its own area page. */
export const AREA_MIN = 3;

/** Cities with an area page, most listings first. */
export async function areas(): Promise<{ city: string; slug: string; total: number }[]> {
  const all = await sites.allListings();
  const by = new Map<string, number>();
  for (const l of all) if (l.address.city) by.set(l.address.city, (by.get(l.address.city) ?? 0) + 1);
  return [...by]
    .filter(([, n]) => n >= AREA_MIN)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'de'))
    .map(([city, total]) => ({ city, slug: slugify(city), total }));
}
