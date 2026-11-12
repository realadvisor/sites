/**
 * THE listing search (port of ListingsSearch.astro: same markup, class and
 * data-rs-* hooks, same GET URLs; the browser side is the Astro kit's
 * client/listings-search, which swaps the server's HTML in). Filters, chips,
 * count, sort, list / map views, pagination, empty states, phone pill.
 *
 *   const result = searchListings(pool, parseSearch(url.searchParams));
 *   <h1 data-rs-sync="h1">{heading}</h1>
 *   <ListingsSearch result={result} base="/kaufen" contactHref="/kontakt">
 *     {(l, i) => <ListingCard listing={l} priority={i === 0} />}
 *   </ListingsSearch>
 *
 * The page must stay static (no `hydrate` handle): the script replaces parts
 * of it. Theme with the tokens of the Astro version (--accent, --rs-*, …).
 */
import type { ReactNode } from 'react';
import type { Listing } from '@realadvisor/sites-sdk/types';
import { mapView, searchHref, type FilterKey } from '@realadvisor/sites-kit/search';
import { formatAmount, formatPrice, formatSurface, listingUrl } from '@realadvisor/sites-kit/format';
import { count, lang, localePath, offerTypeLabel, propertyTypeLabel, t } from '@realadvisor/sites-kit/i18n';
import type { ListingsResult } from '../lib/search';
import { ListingsMap } from './ListingsMap';
import { ListingsPager } from './ListingsPager';
import { RaImage } from './RaImage';
import { usePageLocale } from './Document';
import { Select } from './form/Select';
import { Combobox } from './form/Combobox';
import { Button } from './form/Button';

type FilterName = 'offerType' | 'propertyType' | 'city' | 'price' | 'rooms';
export type ListingsSearchProps = {
  result: ListingsResult;
  base?: string;
  locale?: string;
  contactHref?: string;
  valuationHref?: string;
  tellUsHref?: string;
  listingHref?: (l: Listing) => string;
  /** Map popup price (default formatPrice). */
  price?: (l: Listing) => string;
  filters?: FilterName[];
  sold?: boolean;
  className?: string;
  /** The design's card; a plain card when absent. */
  children?: (l: Listing, i: number) => ReactNode;
  /** Replaces the "no listings at all" block. */
  empty?: ReactNode;
};

const GridIcon = () => (
  <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><rect x="4" y="4" width="7" height="7" /><rect x="13" y="4" width="7" height="7" /><rect x="4" y="13" width="7" height="7" /><rect x="13" y="13" width="7" height="7" /></svg>
);
const MapIcon = () => (
  <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round"><path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14" /></svg>
);

export function ListingsSearch(props: ListingsSearchProps) {
  const pathLocale = usePageLocale();
  const {
    result,
    locale = pathLocale,
    base = localePath('/listings', locale),
    contactHref,
    valuationHref,
    tellUsHref = contactHref,
    price,
    filters = ['offerType', 'propertyType', 'city', 'price', 'rooms'],
    sold = true,
    className,
    children,
    empty,
  } = props;
  const listingHref = (x: Listing) => (props.listingHref ? props.listingHref(x) : localePath(listingUrl(x), locale));
  const l = lang(locale);
  const { params: p, facets, counts, total } = result;
  const href = (over: Parameters<typeof searchHref>[2] = {}) => searchHref(base, p, over);
  const show = (f: FilterName) => filters.includes(f);
  const isMap = p.view === 'map';
  const nothingAtAll = counts.available + counts.sold === 0;
  const withCurrent = <T extends { value: string }>(opts: T[], value: string | undefined, make: (v: string) => T) =>
    value && !opts.some((o) => o.value === value) ? [make(value), ...opts] : opts;
  const amount = (n: number) => formatAmount(n, { currency: result.currency, locale });
  const typeOptions = withCurrent(
    facets.propertyTypes.map((f) => ({ value: f.value, label: propertyTypeLabel(f.value, locale) })),
    p.propertyType,
    (v) => ({ value: v, label: propertyTypeLabel(v, locale) }),
  );
  const cityOptions = withCurrent(facets.cities.map((f) => ({ value: f.value, label: f.value })), p.city, (v) => ({ value: v, label: v }));
  const priceOptions = withCurrent(
    facets.prices.map((n) => ({ value: String(n), label: t('priceMax', { price: amount(n) }, l) })),
    p.maxPrice ? String(p.maxPrice) : undefined,
    (v) => ({ value: v, label: t('priceMax', { price: amount(Number(v)) }, l) }),
  );
  const roomOptions = withCurrent(
    facets.rooms.map((n) => ({ value: String(n), label: t('roomsMin', { n: String(n) }, l) })),
    p.minRooms ? String(p.minRooms) : undefined,
    (v) => ({ value: v, label: t('roomsMin', { n: v }, l) }),
  );
  const sortOptions = (['newest', 'price-asc', 'price-desc', 'surface-desc'] as const).map((s) => ({ value: s, label: t(`sort_${s}`, {}, l) }));
  const showOffer = show('offerType') && (facets.offerTypes.length > 1 || !!p.offerType);
  const nFilters = result.chips.length;
  const chipLabel = (k: FilterKey): string =>
    k === 'offerType' ? offerTypeLabel(p.offerType!, locale)
    : k === 'propertyType' ? propertyTypeLabel(p.propertyType, locale)
    : k === 'city' ? p.city!
    : k === 'minPrice' ? t('priceMin', { price: amount(p.minPrice!) }, l)
    : k === 'maxPrice' ? t('priceMax', { price: amount(p.maxPrice!) }, l)
    : k === 'bbox' ? t('mapArea', {}, l)
    : t('roomsMin', { n: String(p.minRooms) }, l);
  const resetHref = searchHref(base, { ...p, offerType: undefined, propertyType: undefined, city: undefined, minPrice: undefined, maxPrice: undefined, minRooms: undefined, bbox: undefined }, { page: undefined, map: undefined });
  const mapMode = isMap && result.mapItems.length > 0;
  const facts = (x: Listing) =>
    [x.rooms ? `${x.rooms} ${t('rooms', {}, l).toLowerCase()}` : '', x.living_surface ? formatSurface(x.living_surface) : ''].filter(Boolean).join(' · ');
  const cardSizes = isMap ? '(min-width: 1280px) 300px, (min-width: 960px) 40vw, 100vw' : '(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw';
  const card = (x: Listing, i: number) =>
    children ? children(x, i) : (
      <a className="rs-card" href={listingHref(x)}>
        {x.photos[0] ? (
          <RaImage src={x.photos[0]} alt={x.photos[0].alt || `${propertyTypeLabel(x.property_type, locale)}, ${x.address.city ?? ''}`} width={600} height={400} sizes={cardSizes} />
        ) : (
          <span className="rs-card-nophoto" aria-hidden="true">{propertyTypeLabel(x.property_type, locale)}</span>
        )}
        <span className="rs-card-type">{propertyTypeLabel(x.property_type, locale)}{x.address.city && ` · ${x.address.city}`}</span>
        <span className="rs-card-title">{x.title}</span>
        <span className="rs-card-price">{x.status === 'sold' ? t('sold', {}, l) : formatPrice(x, { locale })}</span>
        {facts(x) && <span className="rs-card-facts">{facts(x)}</span>}
      </a>
    );
  const relax = result.relax.length > 0 && (
    <ul className="rs-relax">
      {result.relax.map((r) => (
        <li key={r.key}><a href={href({ [r.key]: undefined })} data-rs-nav="">{t('removeFilter', { filter: chipLabel(r.key) }, l)}</a> <span className="rs-n">{count('listings', r.count, l)}</span></li>
      ))}
    </ul>
  );

  return (
    <div className={['rs', isMap && 'is-map', className].filter(Boolean).join(' ')} data-rs-root="" data-rs-view={p.view}>
      {!nothingAtAll && (
        <form method="get" action={base} className="rs-form" data-rs-form="" role="search" aria-label={t('filters', {}, l)}>
          {isMap && <input type="hidden" name="view" value="map" />}
          {p.status === 'sold' && <input type="hidden" name="status" value="sold" />}
          <div className="rs-top">
            <button type="button" className="rs-filters-btn" popoverTarget="rs-sheet">
              <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"><path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0" /><circle cx="16" cy="6" r="2" /><circle cx="10" cy="12" r="2" /><circle cx="18" cy="18" r="2" /></svg>
              <span>{t('filters', {}, l)}</span>
              <span className="rs-badge" data-rs-swap="badge" hidden={!nFilters}>{nFilters}</span>
            </button>
            <div id="rs-sheet" className="rs-sheet" popover="auto">
              <div className="rs-sheet-head">
                <p className="rs-sheet-title">{t('filters', {}, l)}</p>
                <button type="button" className="rs-sheet-close" popoverTarget="rs-sheet" popoverTargetAction="hide" aria-label={t('close', {}, l)}>
                  <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
                </button>
              </div>
              {showOffer && (
                <fieldset className="rs-offer field">
                  <legend className="field-label">{t('offer', {}, l)}</legend>
                  <div className="rs-seg">
                    <label><input type="radio" name="offerType" value="" defaultChecked={!p.offerType} /><span>{t('all', {}, l)}</span></label>
                    <label><input type="radio" name="offerType" value="buy" defaultChecked={p.offerType === 'buy'} /><span>{t('offerBuy', {}, l)}</span></label>
                    <label><input type="radio" name="offerType" value="rent" defaultChecked={p.offerType === 'rent'} /><span>{t('offerRent', {}, l)}</span></label>
                  </div>
                </fieldset>
              )}
              {!showOffer && p.offerType && <input type="hidden" name="offerType" value={p.offerType} />}
              {show('city') && cityOptions.length > 1 && (
                <Combobox label={t('city', {}, l)} name="city" value={p.city} placeholder={t('allCities', {}, l)} options={cityOptions} className="rs-city" />
              )}
              {show('propertyType') && typeOptions.length > 1 && (
                <Select label={t('propertyType', {}, l)} name="propertyType" value={p.propertyType} placeholder={t('all', {}, l)} options={typeOptions} className="rs-type" />
              )}
              {show('price') && priceOptions.length > 0 && (
                <Select label={t('price', {}, l)} name="maxPrice" value={p.maxPrice ? String(p.maxPrice) : undefined} placeholder={t('any', {}, l)} options={priceOptions} className="rs-price" />
              )}
              {p.minPrice && <input type="hidden" name="minPrice" value={String(p.minPrice)} />}
              {show('rooms') && roomOptions.length > 1 && (
                <Select label={t('rooms', {}, l)} name="minRooms" value={p.minRooms ? String(p.minRooms) : undefined} placeholder={t('any', {}, l)} options={roomOptions} className="rs-rooms" />
              )}
              <Button type="submit" className="rs-apply"><span data-rs-swap="apply">{count('showListings', total, l)}</span></Button>
            </div>
          </div>

          <div className="rs-bar">
            <p className="rs-count" data-rs-count="" data-rs-swap="count" aria-live="polite" tabIndex={-1}>{count('listingsFound', total, l)}</p>
            <div className="rs-tools">
              {sold && counts.sold > 0 && (
                <nav className="rs-status" aria-label={t('status', {}, l)} data-rs-swap="status">
                  <a href={href({ status: undefined })} aria-current={p.status === 'available' ? 'page' : undefined}>{t('currentListings', {}, l)}</a>
                  <a href={href({ status: 'sold' })} aria-current={p.status === 'sold' ? 'page' : undefined}>{t('soldListings', {}, l)} <span className="rs-n">{counts.sold}</span></a>
                </nav>
              )}
              <Select label={t('sort', {}, l)} hideLabel name="sort" value={p.sort} options={sortOptions} className="rs-sort" />
              <nav className="rs-views" aria-label={`${t('viewList', {}, l)} / ${t('viewMap', {}, l)}`} data-rs-swap="views">
                <a href={href({ view: undefined })} data-rs-nav="" data-rs-view="list" aria-current={!isMap ? 'page' : undefined}><GridIcon />{t('viewList', {}, l)}</a>
                <a href={href({ view: 'map' })} data-rs-nav="" data-rs-view="map" aria-current={isMap ? 'page' : undefined}><MapIcon />{t('viewMap', {}, l)}</a>
              </nav>
            </div>
          </div>
        </form>
      )}

      <div className="rs-chips" data-rs-chips="" data-rs-swap="chips" hidden={!nFilters} aria-label={t('activeFilters', {}, l)} role="group">
        {result.chips.map((k) => (
          <a key={k} className="rs-chip" href={href({ [k]: undefined })} data-rs-nav="" aria-label={t('removeFilter', { filter: chipLabel(k) }, l)}>
            {chipLabel(k)}<svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M7 7l10 10M17 7L7 17" /></svg>
          </a>
        ))}
        {nFilters > 1 && <a className="rs-reset" href={resetHref} data-rs-nav="">{t('resetFilters', {}, l)}</a>}
      </div>

      <div className="rs-region" data-rs-swap="results">
        {nothingAtAll ? (
          empty ? <div data-rs-empty="none">{empty}</div> : (
            <div className="rs-empty" data-rs-empty="none">
              <h2 className="rs-empty-title">{t('noListings', {}, l)}</h2>
              <p className="rs-empty-text">{t('noListingsText', {}, l)}</p>
              <p className="rs-empty-actions">
                {valuationHref && <Button href={valuationHref}>{t('valuation', {}, l)}</Button>}
                {contactHref && <Button href={contactHref} variant="secondary">{t('contactUs', {}, l)}</Button>}
              </p>
            </div>
          )
        ) : mapMode ? (
          <>
            {result.truncated && <p className="rs-note">{t('mapTruncated', { n: String(result.mapItems.length) }, l)}</p>}
            <div className="rs-results rs-split">
              <div className="rs-col">
                {total > 0 ? (
                  <ul id="rs-results" className="rs-grid rs-list" data-rs-results="">
                    {result.items.map((x, i) => <li key={x.id} data-listing-id={x.id}>{card(x, i)}</li>)}
                  </ul>
                ) : (
                  <div className="rs-empty rs-empty-area" data-rs-empty="area">
                    <h2 className="rs-empty-title">{t('noneInArea', {}, l)}</h2>
                    <p className="rs-empty-text">{t('noneInAreaText', {}, l)}</p>
                    {relax}
                    <p className="rs-empty-actions"><Button href={resetHref} data-rs-reset data-rs-nav>{t('resetFilters', {}, l)}</Button></p>
                  </div>
                )}
                <ListingsPager result={result} href={href} locale={locale} />
              </div>
              <div className="rs-map" data-rs-map="">
                <div className="rs-follow" data-rs-follow-bar="">
                  <label className="rs-follow-toggle"><input type="checkbox" data-rs-follow="" defaultChecked /> <span>{t('searchAsMove', {}, l)}</span></label>
                  <button type="button" className="rs-search-area" data-rs-search-area="" hidden>{t('searchThisArea', {}, l)}</button>
                </div>
                <ListingsMap
                  listings={result.mapItems}
                  list="rs-results"
                  locale={locale}
                  view={mapView(p.map)}
                  sync
                  listMode="server"
                  href={listingHref}
                  price={price}
                />
              </div>
            </div>
          </>
        ) : total === 0 ? (
          <div className="rs-empty" data-rs-empty="nomatch">
            <h2 className="rs-empty-title">{t('noMatch', {}, l)}</h2>
            <p className="rs-empty-text">{t('noMatchText', {}, l)}</p>
            {relax}
            <p className="rs-empty-actions">
              <Button href={resetHref} data-rs-reset data-rs-nav>{t('resetFilters', {}, l)}</Button>
              {tellUsHref && <Button href={tellUsHref} variant="secondary">{t('tellUs', {}, l)}</Button>}
            </p>
          </div>
        ) : (
          <>
            {isMap && <p className="rs-note">{t('noCoords', {}, l)}</p>}
            <div className="rs-results">
              <ul id="rs-results" className="rs-grid" data-rs-results="">
                {result.items.map((x, i) => <li key={x.id} data-listing-id={x.id}>{card(x, i)}</li>)}
              </ul>
            </div>
            <ListingsPager result={result} href={href} locale={locale} />
          </>
        )}
      </div>

      {!nothingAtAll && total > 0 && (
        <a className="rs-pill" data-rs-pill="" data-rs-nav="" data-rs-swap="pill" href={href({ view: isMap ? undefined : 'map' })}>
          {isMap ? <GridIcon /> : <MapIcon />}
          {isMap ? t('viewList', {}, l) : t('viewMap', {}, l)}
        </a>
      )}
    </div>
  );
}

export default ListingsSearch;
