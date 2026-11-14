/**
 * Listing card: 4:3 photo with one badge, type and place in a muted line,
 * serif title, facts in a hairline row, price. Sold listings show "Vendu"
 * and no price. Used by the search (kit ListingsSearch slot) and every grid.
 */
import type { Listing } from '@realadvisor/sites-sdk/types';
import { Img } from './Img';
import { listingHref, type L } from '../lib/routes';
import { cityName, tx } from '../lib/copy';
import { formatSurface, price, rooms, typeLabel } from '../lib/format';
import './ListingCard.css';

type Props = {
  listing: Listing;
  l: L;
  priority?: boolean;
  sizes?: string;
  /** Heading level of the title inside the page outline. */
  as?: 'h2' | 'h3';
  variant?: 'default' | 'large';
};

export function ListingCard({ listing: x, l, priority = false, sizes = '(min-width: 1360px) 420px, (min-width: 1024px) 31vw, (min-width: 640px) 46vw, calc(100vw - 32px)', as: H = 'h3', variant = 'default' }: Props) {
  const t = tx(l);
  const photo = x.photos[0];
  const badge = x.status === 'sold' ? t('sold') : x.offer_type === 'rent' ? t('forRent') : undefined;
  const facts = [rooms(x.rooms, l), x.living_surface ? formatSurface(x.living_surface) : '', x.land_surface ? `${t('landArea')} ${formatSurface(x.land_surface)}` : ''].filter(Boolean);
  const place = cityName(x.address.city, l);
  return (
    <article className={['card', `card--${variant}`, x.status === 'sold' && 'card--sold'].filter(Boolean).join(' ')} data-listing-id={x.id}>
      <a className="card__link" href={listingHref(x, l)}>
        <div className="card__media">
          {photo
            ? <Img src={photo} alt={photo.alt || x.title} width={800} height={600} sizes={sizes} priority={priority} widths={priority ? [480, 800, 1000] : undefined} />
            : <span className="card__nophoto">{typeLabel(x.property_type, l)}</span>}
          {badge && <span className="card__badge">{badge}</span>}
        </div>
        <div className="card__body">
          <p className="card__eyebrow" title={[typeLabel(x.property_type, l), place].filter(Boolean).join(' · ')}>{typeLabel(x.property_type, l)}{place && <> · {place}</>}</p>
          <H className="card__title">{x.title}</H>
          {facts.length > 0 && <p className="card__facts num">{facts.map((f, i) => <span key={i}>{f}</span>)}</p>}
          {x.status !== 'sold' && <p className="card__price num">{price(x, l)}</p>}
        </div>
      </a>
    </article>
  );
}
