/** Pure helpers over SDK records (no data access): slugs and the towns with an area page. Safe in components. */
import type { Agent, Listing } from '@realadvisor/sites-sdk/types';

const fold = (s = '') => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
export const slugify = (s: string) => fold(s).replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/** Agent URL slug: `laia-vidal`. */
export const agentSlug = (a: Pick<Agent, 'first_name' | 'last_name'>) => slugify(`${a.first_name} ${a.last_name}`);

export type Town = { name: string; slug: string; listings: Listing[] };

/** Towns with at least `min` listings (an area page each) (any offer, any status), most listings first. */
export function towns(listings: Listing[], min = 2): Town[] {
  const m = new Map<string, Town>();
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
