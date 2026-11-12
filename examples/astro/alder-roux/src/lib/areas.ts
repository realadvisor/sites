/**
 * Area pages: one per city with 3 or more listings (available and sold),
 * computed from the data on every request, so a city appears or drops out
 * with the listings.
 */
import type { Listing, Team } from '@realadvisor/sites-sdk/types';
import { sites } from './data';
import { slugify } from './routes';

export const AREA_MIN = 3;

export type Area = { slug: string; city: string; count: number };

export async function areaList(): Promise<Area[]> {
  const all = await sites.allListings();
  return areasOf(all);
}

export function areasOf(all: Listing[]): Area[] {
  const by = new Map<string, Area>();
  for (const x of all) {
    const city = x.address.city?.trim();
    if (!city) continue;
    const slug = slugify(city);
    const a = by.get(slug) ?? { slug, city, count: 0 };
    a.count++;
    by.set(slug, a);
  }
  return [...by.values()].filter((a) => a.count >= AREA_MIN).sort((a, b) => b.count - a.count || a.city.localeCompare(b.city));
}

/** The office that handles a city: the team in that city, else the team with most listings there. */
export function officeFor(city: string, listings: Listing[], teams: Team[]): Team | undefined {
  const same = teams.find((t) => t.address.city && slugify(t.address.city) === slugify(city));
  if (same) return same;
  const votes = new Map<string, number>();
  for (const x of listings) for (const id of x.team_ids) votes.set(id, (votes.get(id) ?? 0) + 1);
  const best = [...votes.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  return teams.find((t) => t.id === best) ?? teams[0];
}
