/**
 * The listing card: a photo at magazine scale, then where it is, the title
 * in condensed caps and one line of facts with the price. `shape` sets the
 * photo ratio so a grid can mix landscape and portrait cards.
 * Listing titles are Italian: on English pages they carry lang="it".
 */
import type { Listing } from '@realadvisor/sites-sdk/types';
import { Photo } from './Photo';
import { CONTENT_LANG, UI, listingHref, type Lang } from '../lib/i18n';
import { factLine, price, typeLabel } from '../lib/format';
import { placeOf } from '../lib/districts';
import './ListingCard.css';

type Props = {
  listing: Listing;
  lang: Lang;
  shape?: 'wide' | 'land' | 'tall';
  priority?: boolean;
  sizes?: string;
  heading?: 'h2' | 'h3';
  /** Sold listings: no price, a "sold" line instead. */
  showPrice?: boolean;
};

const DIMS = { wide: [1500, 1000], land: [900, 675], tall: [800, 1000] } as const;

export function ListingCard({ listing: l, lang, shape = 'land', priority = false, heading: H = 'h3', showPrice = true, sizes }: Props) {
  const ui = UI[lang];
  const photo = l.photos[0];
  const kind = typeLabel(l, lang);
  const textLang = lang === CONTENT_LANG ? undefined : CONTENT_LANG;
  const [w, h] = DIMS[shape];
  const s = sizes ?? (shape === 'wide' ? '(min-width: 1520px) 1424px, 100vw' : '(min-width: 1520px) 700px, (min-width: 760px) 48vw, 100vw');
  const alt = photo?.alt || `${kind}, ${l.address.city ?? ''}`;
  const sold = l.status === 'sold';
  const facts = factLine(l, lang);
  return (
    <article className={`card card-${shape}`}>
      <div className="frame card-photo">
        {photo
          ? <Photo src={photo} alt={alt} width={w} height={h} sizes={s} priority={priority} widths={priority ? [480, 640, 800, 1100, 1500] : undefined} />
          : <span className="no-photo" aria-hidden="true">{kind}</span>}
      </div>
      <div className="card-text">
        <p className="card-place" title={placeOf(l)}>{placeOf(l)}</p>
        <H className="card-title d-s"><a href={listingHref(l, lang)} lang={textLang}>{l.title}</a></H>
        <p className="card-facts">
          {facts && <span className="num">{facts}</span>}
          {sold
            ? <span className="card-status">{l.offer_type === 'rent' ? ui.rented : ui.sold}</span>
            : showPrice && <span className="num card-price">{price(l, lang)}</span>}
        </p>
      </div>
    </article>
  );
}
