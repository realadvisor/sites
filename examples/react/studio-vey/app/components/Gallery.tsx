/**
 * Listing gallery: one large photo and a 2x2 grid (1 + 4), "all photos" on
 * the last tile; on phones the first photo with a counter. Every tile opens
 * the lightbox (a native <dialog>; behaviour: gallery() in app/client.ts) at
 * that photo. Without JS the tiles stay plain photos.
 */
import type { Photo } from '@realadvisor/sites-sdk/types';
import { RaImage } from '@realadvisor/sites-kit-react/components/RaImage';
import './Gallery.css';

export function Gallery({ photos, title, label }: { photos: Photo[]; title: string; label?: string }) {
  const n = photos.length;
  if (n === 0) return null;
  const alt = (p: Photo, i: number) => p.alt || `${title}, Foto ${i + 1}`;
  return (
    <section className={`gal gal--${Math.min(n, 5)}`} aria-label={`Fotos: ${title}`} data-gallery="">
      <div className="gal-grid">
        <a className="gal-tile gal-main" href="#foto-1" data-open="0">
          <RaImage src={photos[0]} alt={alt(photos[0]!, 0)} width={1400} height={1050} priority sizes="(min-width: 1024px) 58vw, 100vw" mobile={{ width: 800, height: 600 }} />
          {label && <span className="gal-label caps">{label}</span>}
          {n > 1 && <span className="gal-all caps">Alle {n} Fotos</span>}
          <span className="gal-count caps" aria-hidden="true">1 / {n}</span>
        </a>
        {photos.slice(1, 5).map((p, i) => (
          <a key={i} className="gal-tile" href={`#foto-${i + 2}`} data-open={i + 1}>
            <RaImage src={p} alt={alt(p, i + 1)} width={700} height={525} sizes="(min-width: 1024px) 21vw, 50vw" />
          </a>
        ))}
      </div>
      <button type="button" className="gal-phone-all caps" data-open="0">Alle {n} Fotos ansehen</button>

      <dialog className="lb" aria-label={`Fotos: ${title}`} data-lightbox="">
        <div className="lb-bar">
          <p className="lb-count caps" aria-live="polite"><span data-lb-index="">1</span> / {n}</p>
          <button type="button" className="lb-btn lb-close" data-lb-close="" aria-label="Schliessen">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19" /></svg>
          </button>
        </div>
        <ol className="lb-track" data-lb-track="" id="fotos">
          {photos.map((p, i) => (
            <li key={i} className="lb-slide" id={`foto-${i + 1}`}>
              <RaImage src={p} alt={alt(p, i)} width={1800} height={1200} fit="fit" widths={[800, 1200, 1800]} sizes="100vw" />
            </li>
          ))}
        </ol>
        {n > 1 && (
          <>
            <button type="button" className="lb-btn lb-prev" data-lb-step="-1" aria-label="Vorheriges Foto">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" aria-hidden="true"><path d="M15 4l-8 8 8 8" /></svg>
            </button>
            <button type="button" className="lb-btn lb-next" data-lb-step="1" aria-label="Nächstes Foto">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" aria-hidden="true"><path d="M9 4l8 8-8 8" /></svg>
            </button>
          </>
        )}
      </dialog>
    </section>
  );
}
