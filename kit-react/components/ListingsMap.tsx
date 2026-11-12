/**
 * Listings map (port of ListingsMap.astro: same markup and data-* contract;
 * the browser side is @realadvisor/sites-kit/client/listings-map, no map
 * library, OSM tiles only). Height: `--map-h` on a parent. Keep the attribution.
 *
 *   <ListingsMap listings={located} href={listingUrl} price={price} />
 */
import type { Listing } from '@realadvisor/sites-sdk/types';
import { formatPrice, listingUrl } from '@realadvisor/sites-kit/format';
import { img } from '@realadvisor/sites-kit/image';
import { lang, localePath, pluralForms, propertyTypeLabel, t } from '@realadvisor/sites-kit/i18n';
import { usePageLocale } from './Document';

type MapProps<L> = {
  listings: L[];
  /** id of the list whose cards (`data-listing-id`) follow the map. */
  list?: string;
  locale?: string;
  /** First view (zoom, centre) instead of fitting the listings. */
  view?: { z: number; lat: number; lng: number };
  /** Keep the visitor's view in the URL as `?map=z/lat/lng`. */
  sync?: boolean;
  listMode?: 'client' | 'server';
  href?: (l: L) => string;
  price?: (l: L) => string;
  className?: string;
};

/** The map over SDK listings (also ListingsSearch's). */
export function ListingsMap({ listings, list, locale: localeProp, view, sync, listMode, href, price, className }: MapProps<Listing>) {
  const pathLocale = usePageLocale();
  const locale = localeProp ?? pathLocale;
  const l = lang(locale);
  const points = listings
    .filter((x) => x.address.lat != null && x.address.lng != null)
    .map((x) => ({
      id: x.id,
      lat: x.address.lat,
      lng: x.address.lng,
      url: href ? href(x) : localePath(listingUrl(x), locale),
      title: x.title,
      type: propertyTypeLabel(x.property_type, locale),
      price: price ? price(x) : formatPrice(x, { locale }),
      photo: x.photos[0]?.url ? img(x.photos[0].url, { w: 320, h: 213 }) : undefined,
    }));
  const labels = { lang: l, inArea: pluralForms('inArea', l), listings: pluralForms('listings', l), showAll: t('showAll', {}, l), close: t('close', {}, l) };
  return (
    <div
      className={['ra-map', className].filter(Boolean).join(' ')}
      data-ra-map=""
      data-points={JSON.stringify(points)}
      data-labels={JSON.stringify(labels)}
      data-list={list}
      data-view={view ? JSON.stringify(view) : undefined}
      data-sync={sync ? 'true' : undefined}
      data-list-mode={listMode === 'server' ? 'server' : undefined}
    >
      <div className="ra-map-viewport" data-map-viewport="" tabIndex={0} role="application" aria-label={t('mapLabel', {}, l)} aria-roledescription="map">
        <div className="ra-map-tiles" data-map-tiles="" aria-hidden="true"></div>
        <div className="ra-map-markers" data-map-markers=""></div>
        <div className="ra-map-popup" data-map-popup=""></div>
      </div>
      <div className="ra-map-status" data-map-status="" role="status">
        <span data-map-count=""></span>
        <button type="button">{t('showAll', {}, l)}</button>
      </div>
      <div className="ra-map-zoom">
        <button type="button" data-map-zoom="1" aria-label={t('zoomIn', {}, l)}>+</button>
        <button type="button" data-map-zoom="-1" aria-label={t('zoomOut', {}, l)}>−</button>
      </div>
      <p className="ra-map-attr">© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">{t('osmContributors', {}, l)}</a></p>
    </div>
  );
}

export default ListingsMap;
