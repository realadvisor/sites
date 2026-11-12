/**
 * The site's one data client. Every page reads through `sites`, with the same
 * calls as `createClient` from @realadvisor/sites-sdk: swap the fixture client
 * for the live one and the pages run unchanged.
 */
import type { Agent, Listing, Organisation, Team } from '@realadvisor/sites-sdk/types';
import raw from '../data/fixture.json';
import { createFixtureClient, type Fixture } from '@realadvisor/sites-kit-core/fixture';
import { inPageLocale } from '@realadvisor/sites-kit-core/page-locale';

const fixture = raw as unknown as Fixture;
// Texts in the page's language when the data has them.
export const sites = inPageLocale(createFixtureClient(fixture));

export type { Agent, Listing, Organisation, Team };

/** The agency as the site shows it: the organisation and its primary team (phone, email, address). */
export async function agency() {
  const [org, teams] = await Promise.all([sites.organisation(), sites.teams()]);
  const team = teams.find((t) => t.primary) ?? teams[0];
  return { org, team, teams };
}
export type AgencyData = Awaited<ReturnType<typeof agency>>;

const fold = (s = '') => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
export const slugify = (s: string) => fold(s).replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/** Agent URL slug: `laia-vidal`. */
export const agentSlug = (a: Pick<Agent, 'first_name' | 'last_name'>) => slugify(`${a.first_name} ${a.last_name}`);

/** Towns with at least `min` listings (an area page each) (any offer, any status), most listings first. */
export function towns(listings: Listing[], min = 2) {
  const m = new Map<string, { name: string; slug: string; listings: Listing[] }>();
  for (const l of listings) {
    const name = l.address.city?.trim();
    if (!name) continue;
    const slug = slugify(name);
    const e = m.get(slug) ?? { name, slug, listings: [] };
    e.listings.push(l);
    m.set(slug, e);
  }
  return [...m.values()].filter((t) => t.listings.length >= min).sort((a, b) => b.listings.length - a.listings.length || a.name.localeCompare(b.name, 'es'));
}
