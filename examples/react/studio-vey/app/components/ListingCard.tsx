/**
 * Editorial listing card: 4:3 photo, small-caps kind line, serif title,
 * price and facts. Sold: a "Verkauft" tab on the photo edge and no price.
 */
import type { Listing } from '@realadvisor/sites-sdk/types';
import { RaImage } from '@realadvisor/sites-kit-react/components/RaImage';
import { propertyTypeLabel } from '@realadvisor/sites-kit/i18n';
import { facts, kind, price } from '../lib/format';
import { listingUrl } from '../lib/urls';
import './ListingCard.css';

type Props = { listing: Listing; priority?: boolean; sizes?: string; as?: 'h2' | 'h3' };

export function ListingCard({ listing: l, priority = false, sizes = '(min-width: 1360px) 420px, (min-width: 1024px) 31vw, (min-width: 640px) 46vw, 100vw', as: H = 'h3' }: Props) {
  const photo = l.photos[0];
  const sold = l.status === 'sold';
  const f = facts(l);
  return (
    <article className={sold ? 'card is-sold' : 'card'}>
      <a className="card-link" href={listingUrl(l)}>
        <div className="card-media">
          {photo ? (
            <RaImage src={photo} alt={photo.alt || l.title} width={800} height={600} sizes={sizes} priority={priority} />
          ) : (
            <span className="nophoto caps">{propertyTypeLabel(l.property_type)}</span>
          )}
          {sold && <span className="card-tab caps">Verkauft</span>}
        </div>
        <p className="card-kind caps">{kind(l)}</p>
        <H className="card-title">{l.title}</H>
        <p className="card-meta">
          {!sold && <span className="card-price num">{price(l)}</span>}
          {f && <span className="card-facts num">{f}</span>}
        </p>
      </a>
    </article>
  );
}
