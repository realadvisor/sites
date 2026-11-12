/**
 * Destinations: one per office (team). A listing belongs to the destination
 * of its broker's team. Everything here is computed from the data on each
 * request, so a destination follows the listings and the teams.
 */
import type { Listing, Team } from '@realadvisor/sites-sdk/types';
import { teamSlug } from './routes';

export type Destination = {
  slug: string;
  team: Team;
  /** Every listing of the team (available and sold). */
  all: Listing[];
  available: Listing[];
  /** Places with available listings, most first. */
  places: { city: string; count: number }[];
};

export function teamOf(x: Pick<Listing, 'team_ids'>, teams: Team[]): Team | undefined {
  return teams.find((t) => x.team_ids.includes(t.id));
}

export function destinations(teams: Team[], listings: Listing[]): Destination[] {
  return teams.map((team) => {
    const all = listings.filter((x) => x.team_ids.includes(team.id));
    const available = all.filter((x) => x.status === 'available');
    const by = new Map<string, number>();
    for (const x of available) {
      const c = x.address.city?.trim();
      if (c) by.set(c, (by.get(c) ?? 0) + 1);
    }
    const places = [...by.entries()].map(([city, count]) => ({ city, count })).sort((a, b) => b.count - a.count || a.city.localeCompare(b.city));
    return { slug: teamSlug(team, teams), team, all, available, places };
  });
}

/** Lowest and highest public price per currency of a set of listings. */
export function priceSpan(xs: Listing[]) {
  const by = new Map<string, { min: number; max: number }>();
  for (const x of xs) {
    if (x.price == null || x.price <= 0 || x.price_on_request) continue;
    const r = by.get(x.currency);
    by.set(x.currency, r ? { min: Math.min(r.min, x.price), max: Math.max(r.max, x.price) } : { min: x.price, max: x.price });
  }
  return [...by.entries()].map(([currency, r]) => ({ currency, ...r }));
}
