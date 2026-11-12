/**
 * Regions: one per office (team), named after its city. A listing belongs to
 * the region of its team; the towns of a region and every count come from
 * the listings on each request, so a live site gets its own regions.
 */
import type { Listing, Team } from '@realadvisor/sites-sdk/types';
import { teamSlug } from './routes';

export type Town = { city: string; buy: Listing[]; rent: Listing[]; sold: Listing[] };
export type Region = { slug: string; team: Team; listings: Listing[]; available: Listing[]; sold: Listing[]; towns: Town[] };

export function regionsOf(teams: Team[], all: Listing[]): Region[] {
  return teams.map((team) => {
    const listings = all.filter((x) => x.team_ids.includes(team.id));
    const by = new Map<string, Town>();
    for (const x of listings) {
      const city = x.address.city?.trim();
      if (!city) continue;
      const t = by.get(city) ?? { city, buy: [], rent: [], sold: [] };
      if (x.status === 'sold') t.sold.push(x);
      else if (x.offer_type === 'rent') t.rent.push(x);
      else t.buy.push(x);
      by.set(city, t);
    }
    const n = (t: Town) => t.buy.length + t.rent.length + t.sold.length;
    const towns = [...by.values()].sort((a, b) => (a.city === team.address.city ? -1 : b.city === team.address.city ? 1 : n(b) - n(a)));
    return {
      slug: teamSlug(team, teams),
      team,
      listings,
      available: listings.filter((x) => x.status === 'available'),
      sold: listings.filter((x) => x.status === 'sold'),
      towns,
    };
  });
}

/** Min and max of the asking prices (not shown for one listing alone). */
export const priceSpan = (xs: Pick<Listing, 'price' | 'price_on_request'>[]) => {
  const p = xs.filter((x) => !x.price_on_request && x.price).map((x) => x.price!);
  return p.length >= 2 ? { min: Math.min(...p), max: Math.max(...p) } : undefined;
};
