/**
 * A site photo from the RealAdvisor image bucket (Pexels, see
 * app/content/photo-credits.md), through the kit's imgproxy helper: AVIF + WebP
 * at 480–1600w. Same contract as RaImage: CSS sets the rendered box,
 * width/height give the ratio, `priority` for the page's one LCP image.
 * Same URLs as the Astro version's BucketPhoto.astro.
 */
import { img, srcset } from '@realadvisor/sites-kit/image';

type Props = { src: string; alt: string; width: number; height: number; sizes?: string; priority?: boolean; className?: string; position?: string; widths?: number[]; fallbackWidth?: number };

export function BucketPhoto({ src, alt, width, height, sizes = '100vw', priority = false, className, position, widths = [480, 640, 960, 1280, 1600], fallbackWidth = 960 }: Props) {
  const avif = srcset(src, widths, undefined, { format: 'avif', quality: 58 });
  const webp = srcset(src, widths, undefined, { quality: 72 });
  const fallback = img(src, { w: fallbackWidth, fit: 'fit', quality: 72 });
  return (
    <picture className={className}>
      <source type="image/avif" srcSet={avif} sizes={sizes} />
      <img src={fallback} srcSet={webp} sizes={sizes} width={width} height={height} alt={alt} loading={priority ? 'eager' : 'lazy'} fetchPriority={priority ? 'high' : undefined} decoding="async" style={position ? { objectPosition: position } : undefined} />
    </picture>
  );
}
