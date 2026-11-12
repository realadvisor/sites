/** URLs and slugs of this site (browser-safe: islands use them too). */
import type { Agent, Listing } from '@realadvisor/sites-sdk/types';

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
