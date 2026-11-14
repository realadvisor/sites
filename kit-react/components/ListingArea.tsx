/**
 * A listing's approximate area on the kit's map: a soft circle about 1.5 km
 * across at town zoom, never a pin (the data's coordinates are rounded).
 * Two layers:
 * - always: a static map of the same OSM tiles with the circle (no
 *   JavaScript, lazy images, the one map host the CSP allows);
 * - near the screen, with JavaScript: the kit's ListingsMap (no listings,
 *   its first view on the place; the same tiles and script) mounted from a
 *   <template> with the circle over it, locked (page scroll and swipes pass through) until the
 *   visitor taps «Activer la carte». `client/listing-area.ts`, loaded by kit().
 * The © OpenStreetMap credit and an "Open in OpenStreetMap" link stay.
 *
 *   {listing.address.lat != null && listing.address.lng != null && (
 *     <ListingArea lat={listing.address.lat} lng={listing.address.lng} />
 *   )}
 *
 * Height: --la-h (default clamp(260px, 32vw, 380px)); circle: --la-fill,
 * --la-line; styles/listing-area.css (part of kit.css).
 */
import type { CSSProperties } from 'react';
import { usePageLocale } from './Document';
import { ListingsMap } from './ListingsMap';
import { areaTiles, listingAreaLabels, osmUrl, type ListingAreaLabels } from '../lib/listing-labels';

export type ListingAreaProps = {
  lat: number;
  lng: number;
  /** Map zoom (default 13: a town, not a street). */
  zoom?: number;
  /** Radius of the area in metres (default 750: about 1.5 km across). */
  radius?: number;
  locale?: string;
  labels?: Partial<ListingAreaLabels>;
  /** Hide the "Approximate location · Open in OpenStreetMap" line (the page writes its own). */
  note?: boolean;
  className?: string;
};

export function ListingArea({ lat, lng, zoom = 13, radius = 750, locale: localeProp, labels, note = true, className }: ListingAreaProps) {
  const pathLocale = usePageLocale();
  const locale = localeProp ?? pathLocale;
  const L = listingAreaLabels(locale, labels);
  const z = Math.round(Math.max(3, Math.min(17, zoom)));
  const { tiles, width, height, px, py, r } = areaTiles(lat, lng, z, radius);
  return (
    <div className={['ra-la', className].filter(Boolean).join(' ')} data-listing-area="" data-radius={radius} data-lat={lat} data-lng={lng} data-label={L.map} style={{ '--la-r': `${r}px` } as CSSProperties}>
      <div className="ra-la-frame">
        <div className="ra-la-static" role="img" aria-label={L.approx}>
          <div className="ra-la-tiles" style={{ width, height, transform: `translate(${-Math.round(px)}px, ${-Math.round(py)}px)` }}>
            {tiles.map((tile) => (
              <img key={tile.src} src={tile.src} alt="" width={256} height={256} loading="lazy" decoding="async" style={{ left: tile.left, top: tile.top }} />
            ))}
          </div>
          <span className="ra-la-area" aria-hidden="true" />
        </div>
        <div className="ra-la-live" data-la-live="" />
        <template data-la-tpl="">
          <ListingsMap listings={[]} view={{ z, lat, lng }} locale={locale} className="ra-la-map" />
          <span className="ra-la-ring" aria-hidden="true" />
        </template>
        <button type="button" className="ra-la-unlock" data-la-unlock="" hidden>{L.activate}</button>
        <p className="ra-la-credit">© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">{L.credit}</a></p>
      </div>
      {note && (
        <p className="ra-la-note">
          <span>{L.approx}</span>{' · '}
          <a href={osmUrl(lat, lng, z)} target="_blank" rel="noopener">{L.openOsm}</a>
        </p>
      )}
    </div>
  );
}

export default ListingArea;
