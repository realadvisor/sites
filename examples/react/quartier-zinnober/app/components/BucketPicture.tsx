/**
 * A Pexels photo from the RealAdvisor image bucket (lib/bucket.ts), served by
 * imgproxy through the kit helper: <picture> with AVIF and WebP srcsets and a
 * JPEG fallback. The crop is done in CSS (object-fit / object-position).
 */
import { img, srcset } from '@realadvisor/sites-kit/image';
import { BUCKET } from '../lib/bucket';

type Props = { name: string; alt: string; sizes: string; ratio?: number; priority?: boolean; position?: string; className?: string };

export function BucketPicture({ name, alt, sizes, ratio, priority = false, position, className }: Props) {
  const p = BUCKET[name];
  if (!p) throw new Error(`BucketPicture: unknown photo "${name}" (lib/bucket.ts)`);
  const widths = [480, 800, 1200, 1600];
  const set = (format: 'avif' | 'webp' | 'jpg', quality: number) => srcset(p.url, widths, undefined, { format, quality });
  const w = 1200;
  const h = Math.round(ratio ? w / ratio : (w * p.height) / p.width);
  const src = img(p.url, { w: 1200, format: 'jpg', quality: 72, fit: 'fit' });
  return (
    <picture className={className}>
      <source type="image/avif" srcSet={set('avif', 50)} sizes={sizes} />
      <source type="image/webp" srcSet={set('webp', 68)} sizes={sizes} />
      <img
        src={src}
        srcSet={set('jpg', 72)}
        sizes={sizes}
        alt={alt}
        width={w}
        height={h}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : undefined}
        decoding="async"
        style={position ? { objectPosition: position } : undefined}
      />
    </picture>
  );
}
