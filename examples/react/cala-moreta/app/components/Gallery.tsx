/**
 * Listing gallery: one large photo and a 2×2 grid (desktop), one photo with a
 * counter (phone). "View all photos" opens a native popover (works without
 * JS, Escape closes it) with every photo at its own ratio in a snap strip;
 * a small script (app/client.ts) adds previous / next and arrow keys.
 */
import { RaImage } from '@realadvisor/sites-kit-react/components/RaImage';
import type { Photo } from '@realadvisor/sites-sdk/types';
import { UI, fill, type Lang } from '../lib/i18n';
import './Gallery.css';

type Props = { photos: Photo[]; alt: string; lang: Lang; empty: string };

export function Gallery({ photos, alt, lang, empty }: Props) {
  const ui = UI[lang];
  const n = photos.length;
  const altOf = (p: Photo, i: number) => (p.alt && i === 0 ? p.alt : `${alt}, ${ui.photoOf.replace('{i}', String(i + 1)).replace('{n}', String(n)).toLowerCase()}`);
  const side = photos.slice(1, 5);
  return (
    <>
      {n === 0 ? (
        <div className="g-empty" aria-hidden="true">{empty}</div>
      ) : (
        <div className={['g', side.length === 0 && 'g-one'].filter(Boolean).join(' ')} data-gallery="">
          <div className="g-main">
            <RaImage src={photos[0]} alt={altOf(photos[0]!, 0)} width={1200} height={800} priority sizes="(min-width: 1360px) 860px, (min-width: 900px) 62vw, 100vw" mobile={{ width: 800, height: 600 }} />
            {n > 1 && <span className="g-count num" aria-hidden="true">1 / {n}</span>}
          </div>
          {side.length > 0 && (
            <div className={`g-side g-side-${side.length}`}>
              {side.map((p, i) => (
                <div className="g-tile" key={i}>
                  <RaImage src={p} alt={altOf(p, i + 1)} width={600} height={400} sizes="(min-width: 1360px) 420px, 31vw" />
                </div>
              ))}
            </div>
          )}
          {n > 1 && (
            <button type="button" className="g-all" popoverTarget="lightbox">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>
              {fill(ui.allPhotos, { n })}
            </button>
          )}
        </div>
      )}
      {n > 1 && (
        <div id="lightbox" className="lb" popover="auto" aria-label={alt} data-lightbox="">
          <div className="lb-bar">
            <p className="lb-count num" aria-live="polite" data-lb-count="">{fill(ui.photoOf, { i: 1, n })}</p>
            <button type="button" className="lb-close" popoverTarget="lightbox" popoverTargetAction="hide" aria-label={ui.close}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M5 5l14 14M19 5 5 19" /></svg>
            </button>
          </div>
          <ul className="lb-strip" tabIndex={0} aria-label={alt} data-lb-strip="" data-label={ui.photoOf}>
            {photos.map((p, i) => (
              <li key={i}><RaImage src={p} alt={altOf(p, i)} width={1600} height={1067} fit="fit" widths={[800, 1200, 1600, 2000]} sizes="100vw" /></li>
            ))}
          </ul>
          <button type="button" className="lb-nav lb-prev" aria-label={ui.prev} data-lb-prev="" hidden>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
          </button>
          <button type="button" className="lb-nav lb-next" aria-label={ui.next} data-lb-next="" hidden>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      )}
    </>
  );
}
