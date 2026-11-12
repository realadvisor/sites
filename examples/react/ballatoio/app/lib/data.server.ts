/**
 * The site's one data client. Every loader reads through `sites`, a
 * SitesClient (the @realadvisor/sites-sdk interface): live data when the
 * Worker has SITES_API_URL + SITES_API_KEY, else the fixture. Server only.
 */
import { siteClient, fixtureOnly, type Fixture } from '@realadvisor/sites-kit-react/server/data';
import raw from '../../../../astro/ballatoio/src/data/fixture.json';
import type { AgencyData, Extras, Listing } from './data';

const fixture = raw as unknown as Fixture;
export const sites = siteClient({ fixture });

/** The agency as the site shows it: the organisation and its primary team (phone, email, address). */
export async function agency(): Promise<AgencyData> {
  const [org, teams] = await Promise.all([sites.organisation(), sites.teams()]);
  const team = teams.find((t) => t.primary) ?? teams[0];
  return { org, team, teams };
}

// fixture only: every read of these extras goes through this one function.
export function extras(listingId: string): Extras {
  const f = fixtureOnly(fixture, 'listings', listingId);
  const num = (v: unknown, min = 0) => (typeof v === 'number' && Number.isFinite(v) && v >= min ? v : undefined);
  const energy = f.energy_class; // fixture only: energy_class
  return {
    energy: typeof energy === 'string' && /^[A-G]\d?$/.test(energy) ? energy : undefined,
    year: num(f.year_built, 1000), // fixture only: year_built
    floor: num(f.floor), // fixture only: floor
    terrace: num(f.terrace_surface, 1), // fixture only: terrace_surface
    balcony: num(f.balcony_surface, 1), // fixture only: balcony_surface
    charges: num(f.charges, 1), // fixture only: charges (monthly service charges)
  };
}

/** A listing as a card or a row shows it: no description, no agent (loader data stays small). */
export const cardOf = ({ description: _d, description_text: _t, agent: _a, ...l }: Listing): Listing => l as Listing;
