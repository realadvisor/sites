/**
 * Editorial photo sequence (one wide, two side by side, repeat) with a
 * lightbox. Each photo is a link to the large image, so it works without JS;
 * lightbox() in app/client.ts opens it in a <dialog> (Escape, arrows, focus return).
 */
import { img } from '@realadvisor/sites-kit-core/image';
import { PHOTOS } from '../content/photos';
import { Photo } from './Photo';
import { BucketPhoto, type PhotoName } from './BucketPhoto';
import './Gallery.css';

/** A data photo (`url`) or a site photo (`local`, app/content/photos.ts). */
export type GalleryPhoto = { url?: string; local?: PhotoName; alt: string };

export function Gallery({ photos, id }: { photos: GalleryPhoto[]; id: string }) {
  // Pattern of the sequence: wide, pair, pair, wide, pair, pair ...
  // A half photo left alone on the last row goes wide.
  const kind = (i: number) => (i % 5 === 0 || (i === photos.length - 1 && (i % 5) % 2 === 1) ? 'wide' : 'half');
  const sizesFor = (i: number) => (kind(i) === 'wide' ? '(min-width: 1360px) 1280px, 100vw' : '(min-width: 900px) 50vw, 100vw');
  const large = (p: GalleryPhoto) =>
    p.local ? img(PHOTOS[p.local].url, { w: 2000, fit: 'fit', quality: 72 }) : img(p.url!, { w: 2000, fit: 'fit', quality: 82 });
  return (
    <ul className="gallery" data-gallery={id}>
      {photos.map((p, i) => (
        <li key={i} className={`g-${kind(i)} frame settle`}>
          <a href={large(p)} data-lightbox="" data-alt={p.alt} data-i={i} aria-label={`Agrandir : ${p.alt}`}>
            {p.local ? (
              <BucketPhoto name={p.local} alt={p.alt} sizes={sizesFor(i)} />
            ) : (
              <Photo src={p.url} alt={p.alt} width={kind(i) === 'wide' ? 1600 : 800} height={kind(i) === 'wide' ? 900 : 600} sizes={sizesFor(i)} />
            )}
          </a>
        </li>
      ))}
    </ul>
  );
}
