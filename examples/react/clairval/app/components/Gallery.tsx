/**
 * Listing gallery, 1 + 4: one large photo and a 2 x 2 grid beside it, with
 * "View all photos" on the last tile. Every tile opens a dialog with all the
 * photos in one column, whole (object-fit: contain), at the clicked photo
 * (gallery() in app/client.ts). Phone: the same tiles become a swipeable
 * strip of every photo with a "1 / 9" counter (one set of images, one LCP photo).
 */
import type { Photo } from '@realadvisor/sites-sdk/types';
import { Img } from './Img';
import type { L } from '../lib/routes';
import './Gallery.css';

const COPY = {
  en: { all: (n: number) => `View all ${n} photos`, close: 'Close', photos: 'Photos', of: 'of', photo: 'Photo' },
  fr: { all: (n: number) => `Voir les ${n} photos`, close: 'Fermer', photos: 'Photos', of: 'sur', photo: 'Photo' },
};

export function Gallery({ photos, title, l, badge }: { photos: Photo[]; title: string; l: L; badge?: string }) {
  const C = COPY[l];
  const alt = (p: Photo, i: number) => p.alt || `${title}, ${C.photo.toLowerCase()} ${i + 1}`;
  const n = photos.length;
  if (n === 0) return null;
  return (
    <div className="gal" data-gallery="">
      <div className={`gal__grid gal__grid--${Math.min(n, 5)}`}>
        <a className="gal__tile gal__tile--main" href="#photo-1" data-open="0" aria-label={`${C.photo} 1 ${C.of} ${n}`}>
          <Img src={photos[0]} alt={alt(photos[0]!, 0)} width={1200} height={900} priority sizes="(min-width: 1024px) 50vw, 100vw" />
          {badge && <span className="gal__badge">{badge}</span>}
        </a>
        {photos.slice(1, 5).map((p, i) => (
          <a key={i} className="gal__tile" href={`#photo-${i + 2}`} data-open={i + 1} aria-label={`${C.photo} ${i + 2} ${C.of} ${n}`}>
            <Img src={p} alt={alt(p, i + 1)} width={600} height={450} sizes="(min-width: 1024px) 25vw, 50vw" />
          </a>
        ))}
        {photos.slice(5).map((p, i) => (
          <a key={i} className="gal__tile gal__tile--extra" href={`#photo-${i + 6}`} data-open={i + 5} aria-label={`${C.photo} ${i + 6} ${C.of} ${n}`}>
            <Img src={p} alt={alt(p, i + 5)} width={800} height={600} sizes="100vw" widths={[480, 800, 1000]} />
          </a>
        ))}
        {n > 1 && (
          <button type="button" className="gal__all" data-open="0">
            <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M1 1h4v4H1zM6 1h4v4H6zM11 1h4v4h-4zM1 6h4v4H1zM6 6h4v4H6zM11 6h4v4h-4zM1 11h4v4H1zM6 11h4v4H6zM11 11h4v4h-4z" /></svg>
            {C.all(n)}
          </button>
        )}
      </div>

      {n > 1 && <button type="button" className="gal__count num" data-open="0" aria-label={C.all(n)}><span data-count="">1</span> / {n}</button>}

      <dialog className="gal__dlg" aria-label={`${C.photos}: ${title}`} data-dialog="">
        <div className="gal__bar">
          <p className="gal__dlg-title">{title} <span className="num">· {n} {C.photos.toLowerCase()}</span></p>
          <button type="button" className="gal__close" data-close="" aria-label={C.close}>
            <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M5 5l14 14M19 5L5 19" /></svg>
            <span>{C.close}</span>
          </button>
        </div>
        <ol className="gal__list plain">
          {photos.map((p, i) => (
            <li key={i} id={`photo-${i + 1}`} data-photo={i}>
              <Img src={p} alt={alt(p, i)} width={1600} height={1200} fit="fit" sizes="(min-width: 1200px) 1100px, 100vw" widths={[800, 1200, 1600]} />
            </li>
          ))}
        </ol>
      </dialog>
    </div>
  );
}
