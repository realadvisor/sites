/**
 * The site's one data client. Every page reads through `sites`, with the same
 * calls as `createClient` from @realadvisor/sites-sdk: swap the fixture client
 * for the live one and the pages run unchanged.
 */
import type { Agent, Listing, Organisation, Team } from '@realadvisor/sites-sdk/types';
import raw from '../data/fixture.json';
import { createFixtureClient, type Fixture } from '@realadvisor/sites-kit/fixture';
import { inPageLocale } from '@realadvisor/sites-kit/page-locale';

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
/** The name visitors know: the team's ("Ballatoio"), not the company's legal name. */
export const brandName = (a: AgencyData) => a.team?.name ?? a.org.name;


const fold = (s = '') => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
export const slugify = (s: string) => fold(s).replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
export const sameText = (a?: string, b?: string) => fold(a) === fold(b);

/** Agent URL slug: `giulia-ferrante`. */
export const agentSlug = (a: Pick<Agent, 'first_name' | 'last_name'>) => slugify(`${a.first_name} ${a.last_name}`);
export const agentName = (a: Pick<Agent, 'first_name' | 'last_name'>) => `${a.first_name} ${a.last_name}`;

/** Newest first, available before sold. */
export const byNewest = (a: Listing, b: Listing) => b.published_at.localeCompare(a.published_at);

/** First photo of a list of listings, for a section that needs one. */
export const firstPhoto = (ls: Listing[]) => ls.find((l) => l.photos[0])?.photos[0];
