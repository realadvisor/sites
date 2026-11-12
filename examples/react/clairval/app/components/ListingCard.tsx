/**
 * Listing card: 4:3 photo with at most one badge (sold, for rent), place
 * line, serif title, facts, price. Sold listings show no price. Used in the
 * kit's ListingsSearch slot and in every grid.
 */
import type { Listing } from '@realadvisor/sites-sdk/types';
import { Img } from './Img';
import { listingHref, type L } from '../lib/routes';
import { cityName, tx } from '../lib/copy';
import { bedrooms, formatSurface, price, typeLabel } from '../lib/format';
import './ListingCard.css';

type Props = { listing: Listing; l: L; priority?: boolean; sizes?: string; as?: 'h2' | 'h3' };

export function ListingCard({ listing: x, l, priority = false, sizes = '(min-width: 1440px) 420px, (min-width: 1024px) 30vw, (min-width: 640px) 46vw, calc(100vw - 32px)', as: H = 'h3' }: Props) {
  const t = tx(l);
  const photo = x.photos[0];
  const badge = x.status === 'sold' ? t('sold') : x.offer_type === 'rent' ? t('forRent') : undefined;
  const facts = [bedrooms(x.bedrooms, l), x.living_surface ? formatSurface(x.living_surface) : '', x.land_surface ? `${formatSurface(x.land_surface)} ${t('land')}` : ''].filter(Boolean);
  const place = [cityName(x.address.city, l), x.address.country === 'France' ? 'France' : x.address.country === 'Switzerland' ? (l === 'fr' ? 'Suisse' : 'Switzerland') : x.address.country].filter(Boolean).join(', ');
  return (
    <article className={x.status === 'sold' ? 'card card--sold' : 'card'}>
      <a className="card__link" href={listingHref(x, l)}>
        <div className="card__media">
          {photo
            ? <Img src={photo} alt={photo.alt || x.title} width={800} height={600} sizes={sizes} priority={priority} widths={priority ? [480, 800, 1000] : undefined} />
            : <span className="card__nophoto">{typeLabel(x.property_type, l)}</span>}
          {badge && <span className="card__badge">{badge}</span>}
        </div>
        <div className="card__body">
          {place && <p className="card__place">{place}</p>}
          <H className="card__title">{x.title}</H>
          {facts.length > 0 && <p className="card__facts">{facts.map((f, i) => <span key={i} className="num">{f}</span>)}</p>}
          {x.status !== 'sold' && <p className="card__price num">{price(x, l)}</p>}
        </div>
      </a>
    </article>
  );
}
