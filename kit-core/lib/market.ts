/**
 * The agency's market for a home selection: a Swiss agency's home shows homes
 * in Switzerland priced in CHF, not the French chalet in EUR it also lists.
 * Prices of different currencies are never compared: a sort by price only
 * runs inside one currency. Show every price with `formatPrice` (`format`).
 *
 *   const home = marketListings(forSale, { currency: 'CHF', countries: ['CH'], sort: 'price-desc' });
 *   const groups = byCurrency(all, 'CHF');   // [{ currency: 'CHF', listings }, { currency: 'EUR', listings }]
 *
 * A listing without `address.country` counts as in the market (the CRM leaves
 * it empty for many domestic listings); pass `unknownCountry: 'drop'` to leave
 * it out.
 */

type Priced = { currency?: string | null; price?: number | null; price_on_request?: boolean | null; address?: { country?: string | null } | null };

export type MarketOptions = {
  /** ISO code of the agency's currency. Default: CHF when `countries` has CH, else EUR. */
  currency?: string;
  /** ISO country codes of the agency's market (`['CH']`, `['FR', 'MC']`). */
  countries: string[];
  /** Keep or drop listings without a country. Default 'keep'. */
  unknownCountry?: 'keep' | 'drop';
  /** Sort by price inside the market (one currency). Prices on request go last. Default: the input order. */
  sort?: 'price-asc' | 'price-desc';
};

const up = (s: string | null | undefined) => (s ?? '').trim().toUpperCase();

/**
 * A copy sorted by price, prices on request last. Currencies are never
 * compared: a mixed list is sorted inside each currency, the currencies in
 * the order they first appear (use `marketListings` or `byCurrency` first).
 */
export function sortByPrice<T extends Priced>(listings: T[], dir: 'price-asc' | 'price-desc' = 'price-asc'): T[] {
  const shown = (l: T) => (l.price_on_request || l.price == null || l.price <= 0 ? null : l.price);
  const order = new Map<string, number>();
  for (const l of listings) if (!order.has(up(l.currency))) order.set(up(l.currency), order.size);
  return [...listings].sort((a, b) => {
    const ca = order.get(up(a.currency))!, cb = order.get(up(b.currency))!;
    if (ca !== cb) return ca - cb;
    const x = shown(a), y = shown(b);
    if (x == null || y == null) return x == null ? (y == null ? 0 : 1) : -1;
    return dir === 'price-asc' ? x - y : y - x;
  });
}

/** The listings in the agency's market: its currency and its countries, optionally sorted by price. */
export function marketListings<T extends Priced>(listings: T[], opts: MarketOptions): T[] {
  const countries = new Set(opts.countries.map(up));
  const currency = up(opts.currency) || (countries.has('CH') ? 'CHF' : 'EUR');
  const out = listings.filter((l) => {
    if (up(l.currency) !== currency) return false;
    const c = up(l.address?.country);
    return c ? countries.has(c) : opts.unknownCountry !== 'drop';
  });
  return opts.sort ? sortByPrice(out, opts.sort) : out;
}

/** Listings grouped by currency, the agency's own first, then by size: one sorted list per group. */
export function byCurrency<T extends Priced>(listings: T[], own?: string): { currency: string; listings: T[] }[] {
  const groups = new Map<string, T[]>();
  for (const l of listings) {
    const c = up(l.currency) || '?';
    if (!groups.has(c)) groups.set(c, []);
    groups.get(c)!.push(l);
  }
  return [...groups]
    .map(([currency, ls]) => ({ currency, listings: ls }))
    .sort((a, b) => Number(b.currency === up(own)) - Number(a.currency === up(own)) || b.listings.length - a.listings.length);
}
