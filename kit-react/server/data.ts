/**
 * The site's data client: one `SitesClient` (the `@realadvisor/sites-sdk`
 * interface) for every page, whatever the data source.
 *
 *   // app/lib/data.server.ts
 *   import fixture from '../data/fixture.json';
 *   export const sites = siteClient({ fixture });
 *
 * - SITES_API_URL + SITES_API_KEY set (publish, CRM preview, .dev.vars):
 *   the SDK's `createClient`, live data (the API caches 60 s).
 * - Otherwise: the fixture (`pnpm dev`, the build, check:deploy), with the
 *   same filters as the API, so a page runs unchanged on both.
 *
 * On a site with more than one locale, listings and developments come in the
 * page's language (`pageLocale(request)`, set by the worker for each request)
 * when the CRM has their texts in it; `text_locale` then says so.
 *
 * Server only: never import it from app/client.ts or an island.
 */
import { createClient, createFixtureClient } from '@realadvisor/sites-sdk';
import type { Portals, SitesClient } from '@realadvisor/sites-sdk/types';
import { previewApi } from '@realadvisor/sites-kit/env';
import { withTextLocale } from '@realadvisor/sites-kit/page-locale';
import type { Fixture } from './fixture-client';

export { createFixtureClient, fixtureOnly, type Fixture } from './fixture-client';

/** One live client per access and portals, so each keeps its Turnstile key. */
const clients = new Map<string, SitesClient>();

/** True when the Worker has data access (SITES_API_URL + SITES_API_KEY). */
export function hasLiveData(): boolean {
  const { url, token } = previewApi();
  return !!(url && token);
}

/** The SDK client on live data, or null in fixture mode. The enquiry action sends through it. Without portals: the site's own. */
export function liveClient(portals?: Portals): SitesClient | null {
  const { url, token } = previewApi();
  if (!url || !token) return null;
  // The SDK reads process.env; a Worker's env reaches it through setRuntimeEnv + this url/key.
  const key = `${url}\0${token}\0${JSON.stringify(portals ?? null)}`;
  let live = clients.get(key);
  if (!live) {
    if (clients.size > 8) clients.clear();
    live = createClient({ portals, url, key: token });
    clients.set(key, live);
  }
  return live;
}

export type SiteClientOptions = {
  /** The site's fixture (src/data/fixture.json): data in dev and build, the portals live. */
  fixture: Fixture;
  /** Portals by name; default the fixture's (`main` is the enquiry portal). */
  portals?: Portals;
};

export type SiteClient = SitesClient & {
  /** Live SDK client or null (fixture mode). */
  readonly live: () => SitesClient | null;
  readonly portals: Portals;
};

/** One SitesClient that reads live data when the Worker has access, else the fixture. */
export function siteClient({ fixture, portals = fixture.portals }: SiteClientOptions): SiteClient {
  const fx = createFixtureClient(fixture);
  const pick = () => liveClient(portals) ?? fx;
  return {
    portals,
    live: () => liveClient(portals),
    organisation: () => pick().organisation(),
    teams: () => pick().teams(),
    agents: (q) => pick().agents(q),
    listings: (q) => pick().listings(withTextLocale(q)),
    allListings: (q) => pick().allListings(withTextLocale(q)),
    listing: (s, q) => pick().listing(s, withTextLocale(q)),
    developments: (q) => pick().developments(withTextLocale(q)),
    development: (s, q) => pick().development(s, withTextLocale(q)),
    turnstileSiteKey: () => pick().turnstileSiteKey(),
  };
}
