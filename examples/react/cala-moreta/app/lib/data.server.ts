/**
 * The site's one data client. Every loader reads through `sites`, a
 * SitesClient (the @realadvisor/sites-sdk interface): live data when the
 * Worker has SITES_API_URL + SITES_API_KEY, else the fixture. Server only.
 */
import { siteClient, fixtureOnly, type Fixture } from '@realadvisor/sites-kit-react/server/data';
import fixture from '../../../../astro/cala-moreta/src/data/fixture.json';

const fx = fixture as unknown as Fixture;
export const sites = siteClient({ fixture: fx });

/** The agency as the site shows it: the organisation and its primary team (phone, email, address). */
export async function agency() {
  const [org, teams] = await Promise.all([sites.organisation(), sites.teams()]);
  const team = teams.find((t) => t.primary) ?? teams[0];
  return { org, team, teams };
}
export type AgencyData = Awaited<ReturnType<typeof agency>>;

/** Brand name: the office (team), else the organisation. */
export const brandName = ({ org, team }: AgencyData) => team?.name ?? org.name;

// fixture only: energy class (A–G) per listing. The API has no energy class
// yet; a listing without one shows nothing.
export function energyClass(listingId: string): string | undefined {
  const v = fixtureOnly(fx, 'listings', listingId).energy_class; // fixture only: energy_class
  return typeof v === 'string' && /^[A-G]$/.test(v) ? v : undefined;
}

// fixture only: terrace surface (m²) and year built. The API has neither yet.
export function extraFacts(listingId: string): { terrace?: number; yearBuilt?: number } {
  const f = fixtureOnly(fx, 'listings', listingId);
  const terrace = f.terrace_surface; // fixture only: terrace_surface
  const year = f.year_built; // fixture only: year_built
  return {
    terrace: typeof terrace === 'number' && terrace > 0 ? terrace : undefined,
    yearBuilt: typeof year === 'number' && year > 1000 ? year : undefined,
  };
}
