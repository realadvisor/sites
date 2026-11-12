/**
 * The locale of the page being rendered, for the data helpers: `ra` (Astro)
 * and `siteClient` (React) read texts in it without the page passing it.
 * The Astro middleware and the React worker run each request inside
 * `withPageLocale(localeOfPath(url.pathname), ...)`.
 *
 * Only a site with more than one locale (site.json `locales`) reads texts
 * per locale: a one-language site keeps the CRM's original texts.
 */
import { AsyncLocalStorage } from 'node:async_hooks';
import type { SitesClient } from '@realadvisor/sites-sdk/types';
import site from 'virtual:sites-kit/site';

const store = new AsyncLocalStorage<string>();

/** Runs `fn` with `locale` as the page locale. */
export const withPageLocale = <T>(locale: string, fn: () => T): T => store.run(locale, fn);

/** The page locale to read texts in, or undefined (one-language site, or outside a request). */
export const textLocale = (): string | undefined => (site.locales.length > 1 ? store.getStore() : undefined);

/** `q` with the page locale, unless it names one. */
export const withTextLocale = <Q extends { locale?: string }>(q: Q | undefined): Q | undefined => {
  const locale = q?.locale ?? textLocale();
  return locale ? ({ ...q, locale } as Q) : q;
};

/**
 * A SitesClient that reads listings and developments in the page locale
 * (`textLocale()`) unless a call names its own `locale`: for a site that
 * builds its own client (`createClient` / `createFixtureClient`) instead of
 * `ra`.
 */
export const inPageLocale = (client: SitesClient): SitesClient => ({
  ...client,
  listings: (q) => client.listings(withTextLocale(q)),
  allListings: (q) => client.allListings(withTextLocale(q)),
  listing: (slugOrId, q) => client.listing(slugOrId, withTextLocale(q)),
  developments: (q) => client.developments(withTextLocale(q)),
  development: (slugOrId, q) => client.development(slugOrId, withTextLocale(q)),
});
