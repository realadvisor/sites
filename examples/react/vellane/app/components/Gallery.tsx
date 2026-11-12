/**
 * Listing gallery. Desktop: one large photo and up to four tiles (1 + 4),
 * fewer photos fill the grid differently. Phone: a swipeable strip with a
 * "1 / 6" counter. "Toutes les photos" opens a dialog with every photo at
 * its own ratio (object-fit: contain). The first photo is the page's LCP.
 * Behaviour: gallery() in app/client.ts.
 */
import type { Photo } from '@realadvisor/sites-sdk/types';
import { RaImage } from './RaImage';
import { Icon } from './Icon';
import './Gallery.css';

export function Gallery({ photos, label, noPhotoText }: { photos: Photo[]; label: string; noPhotoText: string }) {
  const n = photos.length;
  const alt = (p: Photo, i: number) => p.alt || `${label}, photo ${i + 1}`;
  if (n === 0) return <div className="gal gal--none"><span>{noPhotoText}</span></div>;
  return (
    <div className={`gal gal--${Math.min(n, 5)}`} data-gallery="">
      <ul className="gal__grid" aria-label={`Photos (${n})`} data-gal-strip="">
        {photos.map((p, i) => (
          <li key={i} className={i >= 5 ? 'gal__item gal__item--extra' : 'gal__item'}>
            <button type="button" className="gal__open" data-gal-open={i} aria-label={`Agrandir la photo ${i + 1} sur ${n}`} disabled>
              <RaImage src={p} alt={alt(p, i)} width={i === 0 ? 1200 : 600} height={i === 0 ? 800 : 400} priority={i === 0}
                sizes={i === 0 ? '(min-width: 960px) 50vw, 100vw' : '(min-width: 960px) 25vw, 100vw'} />
            </button>
          </li>
        ))}
      </ul>
      <p className="gal__count" aria-hidden="true"><span data-gal-index="">1</span> / {n}</p>
      {n > 1 && (
        <button type="button" className="gal__all" data-gal-open="0" hidden>
          <Icon name="grid" size={16} /> Toutes les photos ({n})
        </button>
      )}
      <dialog className="gal__dlg" data-gal-dialog="" aria-label={`Photos : ${label}`}>
        <div className="gal__bar">
          <p>{label} · {n} photos</p>
          <button type="button" className="gal__close" data-gal-close="" aria-label="Fermer"><Icon name="close" size={22} /></button>
        </div>
        <ol className="gal__list">
          {photos.map((p, i) => (
            <li key={i} id={`photo-${i}`}>
              <RaImage src={p} alt={alt(p, i)} width={1600} height={1066} fit="fit" sizes="(min-width: 1100px) 1000px, 100vw" />
            </li>
          ))}
        </ol>
      </dialog>
    </div>
  );
}
