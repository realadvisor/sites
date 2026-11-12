/**
 * Pure helpers on the SDK records (no data access: loaders read through
 * `sites` in data.server.ts). Safe in components.
 */
import type { Agent, Listing, Organisation, Team } from '@realadvisor/sites-sdk/types';

export type { Agent, Listing, Organisation, Team };

/** The agency as the site shows it: the organisation and its primary team (phone, email, address). */
export type AgencyData = { org: Organisation; team: Team | undefined; teams: Team[] };
/** The name visitors know: the team's ("Ballatoio"), not the company's legal name. */
export const brandName = (a: Pick<AgencyData, 'org' | 'team'>) => a.team?.name ?? a.org.name;


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
