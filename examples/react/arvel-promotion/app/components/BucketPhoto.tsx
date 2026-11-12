/**
 * A site photo from the image bucket (app/content/photos.ts), served by
 * imgproxy at 480–2000w as AVIF + WebP at the photo's own ratio; CSS sets the
 * box (object-fit) and `position` the crop focus (object-position).
 */
import { img, srcset } from '@realadvisor/sites-kit-core/image';
import { PHOTOS, type PhotoName } from '../content/photos';

export type { PhotoName };
type Props = { name: PhotoName; alt: string; sizes?: string; priority?: boolean; position?: string };

const WIDTHS = [480, 800, 1200, 1600, 2000];

export function BucketPhoto({ name, alt, sizes = '100vw', priority = false, position }: Props) {
  const p = PHOTOS[name];
  const avif = srcset(p.url, WIDTHS, undefined, { format: 'avif', quality: 50 });
  const webp = srcset(p.url, WIDTHS, undefined, { format: 'webp', quality: 72 });
  const fallback = img(p.url, { w: 1200, fit: 'fit', format: 'webp', quality: 72 });
  return (
    <picture>
      <source type="image/avif" srcSet={avif} sizes={sizes} />
      <img src={fallback} srcSet={webp} sizes={sizes} width={p.width} height={p.height} alt={alt}
        loading={priority ? 'eager' : 'lazy'} fetchPriority={priority ? 'high' : undefined} decoding="async"
        style={position ? { objectPosition: position } : undefined} />
    </picture>
  );
}
