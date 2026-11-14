/**
 * Listing card in two forms:
 * - `spec` (default): photo, town and type, title, then a key / value spec
 *   table split by hairlines (price, bedrooms, living area, plot).
 * - `overlay`: the search grid; full photo with name and price over it,
 *   bedrooms / bathrooms / area on the right.
 * Listing titles are Spanish: on English pages they carry lang="es".
 */
import { RaImage } from '@realadvisor/sites-kit-react/components/RaImage';
import type { Listing } from '@realadvisor/sites-sdk/types';
import { CONTENT_LANG, UI, listingHref, type Lang } from '../lib/i18n';
import { price, specRows, surface, typeLabel } from '../lib/format';
import './ListingCard.css';

type Props = {
  listing: Listing;
  lang: Lang;
  variant?: 'spec' | 'overlay';
  priority?: boolean;
  sizes?: string;
  heading?: 'h2' | 'h3';
};

export function ListingCard({ listing: l, lang, variant = 'spec', priority = false, heading: H = 'h3', ...props }: Props) {
  const ui = UI[lang];
  const url = listingHref(l, lang);
  const photo = l.photos[0];
  const kind = typeLabel(l, lang);
  const textLang = lang === CONTENT_LANG ? undefined : CONTENT_LANG;
  const sizes = props.sizes ?? (variant === 'overlay' ? '(min-width: 1360px) 650px, (min-width: 760px) 48vw, 100vw' : '(min-width: 1360px) 430px, (min-width: 760px) 31vw, 100vw');
  const badge = l.status === 'sold' ? ui.sold : null;
  const alt = photo?.alt || `${kind}, ${l.address.city ?? ''}`;
  const facts = [
    l.bedrooms ? `${l.bedrooms} ${lang === 'es' ? 'dorm.' : 'bed'}` : '',
    l.bathrooms ? `${l.bathrooms} ${lang === 'es' ? (l.bathrooms === 1 ? 'baño' : 'baños') : l.bathrooms === 1 ? 'bath' : 'baths'}` : '',
    surface(l.living_surface),
  ].filter(Boolean);
  const kicker = [l.address.city, kind].filter(Boolean).join(' · ');
  if (variant === 'spec') {
    return (
      <article className="card">
        <div className="card-photo">
          {photo
            ? <RaImage src={photo} alt={alt} width={720} height={540} sizes={sizes} priority={priority} />
            : <span className="card-nophoto" aria-hidden="true">{kind}</span>}
          {badge && <span className="card-badge">{badge}</span>}
        </div>
        <p className="card-kicker" title={kicker}>{kicker}</p>
        <H className="card-title"><a href={url} lang={textLang}>{l.title}</a></H>
        <dl className="spec">
          {specRows(l, lang, { price: l.status !== 'sold' }).map(([k, v]) => (
            <div key={k}><dt>{k}</dt><dd className="num">{v}</dd></div>
          ))}
        </dl>
      </article>
    );
  }
  return (
    <article className="ocard">
      {photo
        ? <RaImage src={photo} alt={alt} width={800} height={600} sizes={sizes} priority={priority} />
        : <span className="card-nophoto" aria-hidden="true">{kind}</span>}
      <div className="ocard-body">
        <div className="ocard-main">
          <p className="ocard-kicker" title={kicker}>{kicker}</p>
          <H className="ocard-title"><a href={url} lang={textLang}>{l.title}</a></H>
          <p className="ocard-price num">{price(l, lang)}</p>
        </div>
        {facts.length > 0 && (
          <ul className="ocard-facts">{facts.map((f) => <li key={f} className="num">{f}</li>)}</ul>
        )}
      </div>
    </article>
  );
}
