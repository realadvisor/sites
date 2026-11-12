/**
 * The Astro kit's listing search (lib/search.ts: parseSearch, runSearch,
 * searchHref, the same URLs and facets) over SDK records.
 *
 *   const params = parseSearch(url.searchParams);
 *   const result = searchListings(await sites.allListings({ offer_type: 'buy', status: 'available' }), params, { url });
 *   <ListingsSearch result={result}>{(l, i) => <ListingCard listing={l} />}</ListingsSearch>
 *
 * Language: `locale`, else the locale of `url` (the page's path, site.json
 * `locales`), else the site's. Currency: the price filter and its steps work
 * in one currency (`currency`, else the one most of the pool is in); amounts
 * are never converted, so a listing priced in another currency drops out of
 * a price filter (a CHF + EUR agency: filter in one, or hide the price filter).
 */
import type { Listing } from '@realadvisor/sites-sdk/types';
import { poolCurrency, runSearch, type SearchOptions, type SearchParams, type SearchResult } from '@realadvisor/sites-kit-core/search';
import { LOCALE } from '@realadvisor/sites-kit-core/format';
import { localeOfPath } from '@realadvisor/sites-kit-core/i18n';

export { parseSearch, searchHref, mapView, type SearchParams } from '@realadvisor/sites-kit-core/search';

/** The kit's SearchResult and the price filter's currency. */
export type ListingsResult = SearchResult & { currency?: string };

export type ListingsSearchOptions = SearchOptions & {
  /** The page (request URL or pathname): its locale when `locale` is not given. */
  url?: Request | URL | string;
};

const pathOf = (u: Request | URL | string) => (typeof u === 'string' ? new URL(u, 'http://x').pathname : u instanceof URL ? u.pathname : new URL(u.url).pathname);

export function searchListings(pool: Listing[], params: SearchParams, opts: ListingsSearchOptions = {}): ListingsResult {
  const { url, ...rest } = opts;
  const currency = rest.currency ?? poolCurrency(pool);
  const locale = rest.locale ?? (url ? localeOfPath(pathOf(url)) : LOCALE);
  return { ...runSearch(pool, params, { ...rest, locale, currency }), currency };
}
