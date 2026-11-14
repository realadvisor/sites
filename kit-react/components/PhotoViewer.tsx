/**
 * A listing's photos: a gallery ("1+4" mosaic, a swipe strip on the phone,
 * or a strip everywhere) that opens a full-screen viewer, a native modal
 * <dialog>: each photo whole, "3 / 13", prev and next buttons, ← → Home End,
 * Escape, swipe on touch (a scroll-snap track), focus on the close button
 * and back to the tile, page scroll locked while open. The behaviour is
 * `client/photo-viewer.ts`, which kit() loads on a page that has one.
 * Without JavaScript the tiles link to the photo list in <noscript>.
 *
 *   <PhotoViewer photos={listing.photos} alt={`${type}, ${city}`} />
 *   <PhotoViewer photos={photos} alt={(i) => captions[i]} layout="strip" locale="de-CH" />
 *
 * Theme: --pv-ratio (mosaic box, default 2.9 / 1), --pv-gap, --pv-bg (the
 * viewer), --pv-tile-bg; styles/photo-viewer.css (part of kit.css).
 */
import type { Photo } from '@realadvisor/sites-sdk/types';
import { RaImage } from './RaImage';
import { usePageLocale } from './Document';
import { fill, photoViewerLabels, type PhotoViewerLabels } from '../lib/listing-labels';

export type PhotoViewerProps = {
  photos: Photo[];
  /** Alt text of a photo without its own: a string ("<alt>, Photo 3") or one per photo. */
  alt: string | ((i: number) => string);
  /** "1+4": the mosaic (a strip on the phone). "strip": a swipe strip at every width. */
  layout?: '1+4' | 'strip';
  locale?: string;
  labels?: Partial<PhotoViewerLabels>;
  /** The first tile is the page's LCP image (default true). */
  priority?: boolean;
  /** Anchor prefix of the no-JS photo list (`#photos-3`); unique per page. */
  id?: string;
  className?: string;
};

/** Layout width of tile `i` in a mosaic of `count` tiles (phone: the 88% strip). */
const mosaicSizes = (count: number, i: number) => {
  const share = count === 1 ? 1 : count === 2 ? 0.5 : i === 0 ? (count === 3 ? 0.66 : 0.5) : count === 3 ? 0.33 : 0.25;
  return `(min-width: 1360px) ${Math.round(1360 * share)}px, (min-width: 761px) ${Math.round(100 * share)}vw, 88vw`;
};
const STRIP_SIZES = '(min-width: 761px) 40vw, 88vw';

export function PhotoViewer({ photos, alt, layout = '1+4', locale: localeProp, labels, priority = true, id = 'photos', className }: PhotoViewerProps) {
  const pathLocale = usePageLocale();
  const L = photoViewerLabels(localeProp ?? pathLocale, labels);
  const n = photos.length;
  if (!n) return null;
  const altOf = (i: number) => photos[i]?.alt || (typeof alt === 'function' ? alt(i) : `${alt}, ${fill(L.photo, i + 1)}`);
  const strip = layout === 'strip';
  // Mosaic: 1, 2, 3 or 5 tiles (4 photos show 3: a fourth tile would be a 2.3:1 crop).
  const shown = strip ? photos : photos.slice(0, n === 4 ? 3 : 5);
  const more = !strip && n > shown.length;
  return (
    <div className={['ra-pv', strip ? 'ra-pv--strip' : 'ra-pv--mosaic', className].filter(Boolean).join(' ')} data-photo-viewer="">
      <div className={`ra-pv-gal ra-pv-gal--${shown.length}`}>
        {shown.map((p, i) => {
          const big = !strip && i === 0;
          return (
            <a key={`${i}-${p.url}`} className="ra-pv-tile" href={`#${id}-${i + 1}`} data-pv-open={i} aria-label={`${altOf(i)}: ${L.open}`}>
              <RaImage src={p} alt={altOf(i)} width={big ? 1200 : 600} height={big ? 800 : 400} priority={priority && i === 0}
                sizes={strip ? STRIP_SIZES : mosaicSizes(shown.length, i)} />
              {more && i === shown.length - 1 && <span className="ra-pv-more">{fill(L.all, n)}</span>}
              <span className="ra-pv-n" aria-hidden="true">{i + 1} / {n}</span>
            </a>
          );
        })}
      </div>
      {more && <a className="ra-pv-all" href={`#${id}-1`} data-pv-open="0">{fill(L.all, n)}</a>}

      <dialog className="ra-pv-dialog" data-pv-dialog="" aria-label={L.photos}>
        <div className="ra-pv-bar">
          <p className="ra-pv-count" aria-live="polite"><span data-pv-index="">1</span> / {n}</p>
          <button type="button" className="ra-pv-btn" data-pv-close="" aria-label={L.close}>
            <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M5 5l14 14M19 5L5 19" /></svg>
          </button>
        </div>
        <ul className="ra-pv-track" data-pv-track="">
          {photos.map((p, i) => (
            <li key={`${i}-${p.url}`} className="ra-pv-slide">
              <RaImage src={p} alt={altOf(i)} width={1920} height={1280} fit="fit" widths={[960, 1440, 1920]} sizes="min(92vw, 1600px)" />
            </li>
          ))}
        </ul>
        {n > 1 && (
          <>
            <button type="button" className="ra-pv-btn ra-pv-step ra-pv-step--prev" data-pv-step="-1" aria-label={L.prev}>
              <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M15 5l-7 7 7 7" /></svg>
            </button>
            <button type="button" className="ra-pv-btn ra-pv-step ra-pv-step--next" data-pv-step="1" aria-label={L.next}>
              <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M9 5l7 7-7 7" /></svg>
            </button>
          </>
        )}
      </dialog>

      <noscript>
        <ul className="ra-pv-list">
          {photos.map((p, i) => (
            <li key={`${i}-${p.url}`} id={`${id}-${i + 1}`}>
              <RaImage src={p} alt={altOf(i)} width={1200} height={800} fit="fit" sizes="(min-width: 1025px) 45vw, 100vw" />
            </li>
          ))}
        </ul>
      </noscript>
    </div>
  );
}

export default PhotoViewer;
