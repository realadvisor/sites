/**
 * Listing search for /listings: the URL is the state (GET params, works
 * without JS), the listings are filtered, sorted and paged in memory from
 * one `allListings()` pool, so facets (cities, types, price steps) and
 * "remove this filter" counts come for free. Rendered by
 * components/ListingsSearch.astro; the page does:
 *
 *   const params = parseSearch(Astro.url.searchParams);
 *   const result = runSearch(await allListings(), params);
 *
 * No Astro, no i18n import (only types): tested with
 * `node --experimental-strip-types --test test/`.
 */
import type { Listing } from './ra';

export type Sort = 'newest' | 'price-asc' | 'price-desc' | 'surface-desc';
export const SORTS: readonly Sort[] = ['newest', 'price-asc', 'price-desc', 'surface-desc'];

/** Filters a visitor sets (chips, "remove this filter"); `bbox` is the map area. */
export type FilterKey = 'offerType' | 'propertyType' | 'city' | 'minPrice' | 'maxPrice' | 'minRooms' | 'bbox';
export const FILTER_KEYS: readonly FilterKey[] = ['offerType', 'propertyType', 'city', 'minPrice', 'maxPrice', 'minRooms', 'bbox'];

export type SearchParams = {
  offerType?: 'buy' | 'rent';
  /** A type (`house_villa`) or its group (`house`): prefix match, as the API. */
  propertyType?: string;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  minRooms?: number;
  status: 'available' | 'sold';
  sort: Sort;
  view: 'list' | 'map';
  page: number;
  /** Map position `zoom/lat/lng`, written by the map as the visitor moves it. */
  map?: string;
  /**
   * Map view only: the visible area `south,west,north,east`. The list, the
   * count and the pages show only the listings inside it; the markers show
   * every match (the visitor pans to the others). Set by "search as I move
   * the map" (client/listings-search.ts).
   */
  bbox?: string;
};

export type Box = { s: number; w: number; n: number; e: number };
/** `s,w,n,e` → box, or undefined when malformed or empty. */
export function parseBox(v: string | null | undefined): Box | undefined {
  const parts = (v ?? '').split(',').map((x) => (x.trim() === '' ? NaN : Number(x)));
  if (parts.length !== 4 || !parts.every(Number.isFinite)) return undefined;
  const [s, w, n, e] = parts as [number, number, number, number];
  return s < n && w < e && s >= -90 && n <= 90 && w >= -180 && e <= 180 ? { s, w, n, e } : undefined;
}
const inBox = (l: Listing, b: Box) =>
  l.address.lat != null && l.address.lng != null &&
  l.address.lat >= b.s && l.address.lat <= b.n && l.address.lng >= b.w && l.address.lng <= b.e;

const MAP_RE = /^\d{1,2}(\.\d+)?\/-?\d{1,2}(\.\d+)?\/-?\d{1,3}(\.\d+)?$/;
const positive = (v: string | null, max = Infinity) => {
  const n = Number(v);
  return v && Number.isFinite(n) && n > 0 && n <= max ? n : undefined;
};
/** No property costs more: a larger value is junk (it would land in the h1). */
const MAX_PRICE = 1e9;

/** Search state from the query string. Junk values are dropped, never thrown. */
export function parseSearch(q: URLSearchParams): SearchParams {
  const offer = q.get('offerType');
  const sort = q.get('sort');
  const type = q.get('propertyType')?.trim();
  const city = q.get('city')?.trim();
  const map = q.get('map');
  let minPrice = positive(q.get('minPrice'), MAX_PRICE);
  let maxPrice = positive(q.get('maxPrice'), MAX_PRICE);
  if (minPrice && maxPrice && minPrice > maxPrice) [minPrice, maxPrice] = [maxPrice, minPrice];
  return {
    offerType: offer === 'buy' || offer === 'rent' ? offer : undefined,
    propertyType: type && /^[a-z0-9_]{1,64}$/.test(type) ? type : undefined,
    city: city ? city.slice(0, 80) : undefined,
    minPrice,
    maxPrice,
    minRooms: positive(q.get('minRooms'), 50),
    status: q.get('status') === 'sold' ? 'sold' : 'available',
    // `asc` / `desc`: the price sort of earlier sites (Rockwell).
    sort: sort === 'asc' ? 'price-asc' : sort === 'desc' ? 'price-desc' : SORTS.includes(sort as Sort) ? (sort as Sort) : 'newest',
    view: q.get('view') === 'map' ? 'map' : 'list',
    page: Math.max(1, Math.floor(positive(q.get('page')) ?? 1)),
    map: map && MAP_RE.test(map) ? map : undefined,
    // Normalised (5 decimals, ~1 m): one area is one URL, one cache entry.
    bbox: q.get('view') === 'map' ? boxParam(parseBox(q.get('bbox'))) : undefined,
  };
}

const boxParam = (b: Box | undefined) => (b ? [b.s, b.w, b.n, b.e].map((x) => +x.toFixed(5)).join(',') : undefined);

const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase();
/** The group of a type: `house_villa` → `house`. */
export const typeGroup = (type: string) => type.split('_')[0]!;

/**
 * Does `l` pass the filters of `p` (status included), ignoring `skip`?
 * `currency`: the price filter's currency (runSearch: `SearchOptions.currency`);
 * a listing priced in another currency never passes a price filter.
 */
export function matches(l: Listing, p: SearchParams, skip?: FilterKey, currency?: string): boolean {
  const priced = l.price != null && !l.price_on_request && inCurrency(l, currency);
  return (
    l.status === p.status &&
    (skip === 'offerType' || !p.offerType || l.offer_type === p.offerType) &&
    (skip === 'propertyType' || !p.propertyType || l.property_type === p.propertyType || l.property_type.startsWith(`${p.propertyType}_`)) &&
    (skip === 'city' || !p.city || (!!l.address.city && fold(l.address.city) === fold(p.city))) &&
    (skip === 'minPrice' || p.minPrice == null || (priced && l.price! >= p.minPrice)) &&
    (skip === 'maxPrice' || p.maxPrice == null || (priced && l.price! <= p.maxPrice)) &&
    (skip === 'minRooms' || p.minRooms == null || (l.rooms != null && l.rooms >= p.minRooms)) &&
    (skip === 'bbox' || !p.bbox || inBox(l, parseBox(p.bbox)!))
  );
}

/** No currency on the record: the pool's. */
const inCurrency = (l: Listing, currency?: string) => !currency || !l.currency || l.currency.toUpperCase() === currency.toUpperCase();

/** The currency most listings of the pool are priced in (the price filter's default). */
export function poolCurrency(pool: Listing[]): string | undefined {
  const m = new Map<string, number>();
  for (const l of pool) if (l.currency) m.set(l.currency.toUpperCase(), (m.get(l.currency.toUpperCase()) ?? 0) + 1);
  return [...m].sort((a, b) => b[1] - a[1])[0]?.[0];
}

const matchesIn = (...a: Parameters<typeof matches>) => matches(...a);
const priceOf = (l: Listing) => (l.price != null && !l.price_on_request ? l.price : null);

/** Sorted copy. Listings without the sort value (price on request, no surface) go last. */
export function sortListings(list: Listing[], sort: Sort): Listing[] {
  const last = (a: number | null, b: number | null, dir: 1 | -1) =>
    a == null ? (b == null ? 0 : 1) : b == null ? -1 : (a - b) * dir;
  const newest = (a: Listing, b: Listing) => (b.published_at ?? '').localeCompare(a.published_at ?? '');
  return [...list].sort((a, b) =>
    sort === 'price-asc' ? last(priceOf(a), priceOf(b), 1) || newest(a, b)
    : sort === 'price-desc' ? last(priceOf(a), priceOf(b), -1) || newest(a, b)
    : sort === 'surface-desc' ? last(a.living_surface ?? null, b.living_surface ?? null, -1) || newest(a, b)
    : newest(a, b));
}

const BUY_STEPS = [100e3, 200e3, 300e3, 400e3, 500e3, 600e3, 750e3, 1e6, 1.25e6, 1.5e6, 2e6, 2.5e6, 3e6, 4e6, 5e6, 7.5e6, 10e6, 15e6, 20e6, 30e6];
const RENT_STEPS = [500, 750, 1000, 1250, 1500, 1750, 2000, 2500, 3000, 3500, 4000, 5000, 6000, 7500, 10e3, 15e3, 20e3];

/**
 * Price steps for the min/max selects: round amounts covering the agency's
 * own prices (one step below the cheapest to one above the dearest), at most
 * `max` of them. Buy and rent never share steps: a 2'000 rent and a
 * 2'000'000 house would make one useless list.
 */
export function priceSteps(prices: number[], offerType: 'buy' | 'rent' | undefined, max = 10): number[] {
  const ps = prices.filter((p) => p > 0);
  if (ps.length < 2) return [];
  const all = offerType === 'rent' || (!offerType && Math.max(...ps) < 30e3) ? RENT_STEPS : BUY_STEPS;
  const [lo, hi] = [Math.min(...ps), Math.max(...ps)];
  const above = all.findIndex((s) => s > lo);
  const from = above < 0 ? all.length - 1 : Math.max(0, above - 1);
  let to = all.findIndex((s) => s >= hi);
  if (to < 0) to = all.length - 1;
  let steps = all.slice(from, to + 1);
  if (steps.length > max && max >= 2) {
    const k = (steps.length - 1) / (max - 1);
    steps = [...new Set(Array.from({ length: max }, (_, i) => steps[Math.round(i * k)]!))];
  }
  return steps;
}

/** Page numbers with gaps (`null`): 1 … 4 5 6 … 12. */
export function pageList(page: number, pages: number): (number | null)[] {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
  const keep = new Set([1, pages, page - 1, page, page + 1].filter((n) => n >= 1 && n <= pages));
  if (page <= 3) [2, 3, 4].forEach((n) => keep.add(n));
  if (page >= pages - 2) [pages - 3, pages - 2, pages - 1].forEach((n) => keep.add(n));
  const out: (number | null)[] = [];
  let prev = 0;
  for (const n of [...keep].sort((a, b) => a - b)) {
    if (n - prev === 2) out.push(n - 1);
    else if (n - prev > 2) out.push(null);
    out.push(n);
    prev = n;
  }
  return out;
}

export type Facet<T extends string | number = string> = { value: T; count: number };

export type SearchResult = {
  params: SearchParams;
  /** Every listing that matches, sorted. */
  matches: Listing[];
  /** The cards to render: this page (inside the map area in map view). */
  items: Listing[];
  /** Map view: the markers, every match with coordinates (any area), the first `mapLimit`. */
  mapItems: Listing[];
  total: number;
  /** `params.page`, clamped to the last page. */
  page: number;
  pages: number;
  /** Map view: more markers than `mapLimit`; only the first ones are shown. */
  truncated: boolean;
  /** Listings per status in the whole pool (the "Sold (n)" link; "no listings at all"). */
  counts: { available: number; sold: number };
  hasFilters: boolean;
  /** Active filters, in display order. */
  chips: FilterKey[];
  /** No match: active filters whose removal finds listings, best first (at most 3). */
  relax: { key: FilterKey; count: number }[];
  facets: {
    /** Offer types present (status pool); the switch shows only with both. */
    offerTypes: ('buy' | 'rent')[];
    /** Type groups present (status + offer), most listings first. */
    propertyTypes: Facet[];
    /** Cities present (status pool, any offer), A–Z. */
    cities: Facet[];
    prices: number[];
    rooms: number[];
  };
};

export type SearchOptions = {
  pageSize?: number;
  mapLimit?: number;
  /** Page locale: facet sort order (and, in the React kit, labels). */
  locale?: string;
  /**
   * Currency of the price filter and its steps (default: the one most of the
   * pool is in). Amounts are never converted: a listing in another currency
   * is left out of a price filter and of the price steps. A pool in CHF and
   * EUR filters by price in one of them only.
   */
  currency?: string;
};

export function runSearch(pool: Listing[], params: SearchParams, opts: SearchOptions = {}): SearchResult {
  const pageSize = opts.pageSize ?? 24;
  const mapLimit = opts.mapLimit ?? 500;
  const listings = Array.isArray(pool) ? pool : [];
  const currency = opts.currency ?? poolCurrency(listings);
  const matches = (l: Listing, p: SearchParams, skip?: FilterKey) => matchesIn(l, p, skip, currency);
  const inStatus = listings.filter((l) => l.status === params.status);
  const inOffer = inStatus.filter((l) => !params.offerType || l.offer_type === params.offerType);
  const found = sortListings(listings.filter((l) => matches(l, params)), params.sort);
  const total = found.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(params.page, pages);
  const items = found.slice((page - 1) * pageSize, page * pageSize);
  const located = params.view !== 'map' ? [] : sortListings(
    listings.filter((l) => matches(l, params, 'bbox') && l.address.lat != null && l.address.lng != null),
    params.sort,
  );
  const chips = FILTER_KEYS.filter((k) => params[k] != null);

  const tally = (values: string[]) => {
    const m = new Map<string, number>();
    for (const v of values) m.set(v, (m.get(v) ?? 0) + 1);
    return [...m].map(([value, count]) => ({ value, count }));
  };
  // Cities from the status pool, not the offer: the city combobox keeps its
  // options when the visitor switches buy/rent without a page load.
  const cityName = new Map<string, string>();
  for (const l of inStatus) if (l.address.city?.trim()) cityName.set(fold(l.address.city), cityName.get(fold(l.address.city)) ?? l.address.city.trim());

  const relax = total > 0 ? [] : chips
    .map((key) => ({ key, count: listings.filter((l) => matches(l, params, key)).length }))
    .filter((r) => r.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  return {
    params,
    matches: found,
    items,
    mapItems: located.slice(0, mapLimit),
    total,
    page,
    pages,
    truncated: located.length > mapLimit,
    counts: {
      available: listings.filter((l) => l.status === 'available').length,
      sold: listings.filter((l) => l.status === 'sold').length,
    },
    hasFilters: chips.length > 0,
    chips,
    relax,
    facets: {
      offerTypes: (['buy', 'rent'] as const).filter((o) => inStatus.some((l) => l.offer_type === o)),
      propertyTypes: tally(inOffer.map((l) => typeGroup(l.property_type))).sort((a, b) => b.count - a.count),
      cities: tally(inStatus.flatMap((l) => (l.address.city?.trim() ? [fold(l.address.city)] : [])))
        .map((f) => ({ value: cityName.get(f.value)!, count: f.count }))
        .sort((a, b) => a.value.localeCompare(b.value, opts.locale)),
      prices: priceSteps(inOffer.flatMap((l) => (priceOf(l) != null && inCurrency(l, currency) ? [priceOf(l)!] : [])), params.offerType),
      rooms: [1, 2, 3, 4, 5].filter((n) => inOffer.some((l) => (l.rooms ?? 0) >= n)),
    },
  };
}

type Over = Partial<Record<keyof SearchParams, string | number | undefined>>;
export const ORDER: (keyof SearchParams)[] = ['offerType', 'propertyType', 'city', 'minPrice', 'maxPrice', 'minRooms', 'status', 'sort', 'view', 'page', 'map', 'bbox'];
const DEFAULTS: Partial<Record<keyof SearchParams, string>> = { status: 'available', sort: 'newest', view: 'list', page: '1' };

/**
 * URL of the search with `over` applied (`undefined` removes a param).
 * Changing a filter, the status, the sort or the view goes back to page 1.
 * Changing a filter or the status keeps a map area the visitor searched in
 * (with its position: list and map stay on that area); without one, or when
 * the area itself is removed, the map position goes too and the map refits.
 */
export function searchHref(base: string, p: SearchParams, over: Over = {}): string {
  const touched = Object.keys(over) as (keyof SearchParams)[];
  const v: Over = { ...p, ...over };
  if (!touched.includes('page') && touched.some((k) => k !== 'map')) v.page = undefined;
  if (!touched.includes('map') && (touched.includes('bbox') ? !v.bbox : !v.bbox && touched.some((k) => (FILTER_KEYS as string[]).includes(k) || k === 'status'))) v.map = undefined;
  if (v.view !== 'map') v.map = v.bbox = undefined;
  const u = new URLSearchParams();
  for (const k of ORDER) {
    const x = v[k];
    if (x != null && x !== '' && String(x) !== DEFAULTS[k]) u.set(k, String(x));
  }
  // `/` and `,` are legal in a query: keep map=12/46.5/6.6 and bbox=46,6,47,7 readable.
  const s = u.toString().replace(/%2F/gi, '/').replace(/%2C/gi, ',');
  return `${base}${s ? `?${s}` : ''}`;
}

/** Initial map view from `map=zoom/lat/lng`. */
export function mapView(map: string | undefined): { z: number; lat: number; lng: number } | undefined {
  if (!map || !MAP_RE.test(map)) return undefined;
  const [z, lat, lng] = map.split('/').map(Number) as [number, number, number];
  return z >= 3 && z <= 18 && Math.abs(lat) <= 85 && Math.abs(lng) <= 180 ? { z, lat, lng } : undefined;
}
