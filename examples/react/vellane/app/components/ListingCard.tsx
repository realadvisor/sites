/**
 * Listing card: rounded 4:3 photo with a save heart, price first, then the
 * title, facts and place. The whole card is one link (stretched from the
 * title); the heart sits above it. No photo: a neutral tile with the type.
 */
import type { Listing } from '@realadvisor/sites-sdk/types';
import { RaImage } from './RaImage';
import { img } from '@realadvisor/sites-kit/image';
import { cityLine, factsLine, listingHref, price, typeLabel } from '../lib/site';
import { SaveButton } from './SaveButton';
import './ListingCard.css';

type Props = { listing: Listing; priority?: boolean; as?: 'h2' | 'h3'; sizes?: string };

export function ListingCard({ listing: l, priority, as: H = 'h3', sizes = '(min-width: 1280px) 400px, (min-width: 640px) 50vw, 100vw' }: Props) {
  const photo = l.photos[0];
  const href = listingHref(l);
  const sold = l.status === 'sold';
  const facts = factsLine(l);
  const place = cityLine(l);
  return (
    <article className={sold ? 'card is-sold' : 'card'}>
      <div className="card__media">
        {photo ? (
          <RaImage src={photo} alt={photo.alt || `${typeLabel(l.property_type)} à ${l.address.city ?? ''}`} width={640} height={480} sizes={sizes} priority={priority} />
        ) : (
          <span className="card__nophoto">{typeLabel(l.property_type)}</span>
        )}
        {sold && <span className="card__badge">{l.offer_type === 'rent' ? 'Loué' : 'Vendu'}</span>}
        {!sold && (
          <SaveButton className="card__save" id={l.id} href={href} title={l.title} price={price(l)} place={place} facts={facts}
            img={photo ? img(photo.url, { w: 320, h: 240 }) : ''} alt={photo?.alt ?? ''} />
        )}
      </div>
      <div className="card__body">
        <p className="card__price num">{price(l)}</p>
        <H className="card__title"><a href={href}>{l.title}</a></H>
        {facts && <p className="card__facts">{facts}</p>}
        {place && <p className="card__place">{typeLabel(l.property_type)} · {place}</p>}
      </div>
    </article>
  );
}
