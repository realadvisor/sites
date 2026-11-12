/**
 * A photo from the RealAdvisor bucket through the kit's imgproxy helper:
 * AVIF then WebP, cropped server side to the slot's ratio (width/height),
 * optional phone crop. CSS sets the rendered box. `priority` for the page's
 * one LCP image. Kit gap: RaImage serves AVIF only to its priority image and
 * has no art-directed phone crop with AVIF, hence this wrapper.
 */
import { img, srcset } from '@realadvisor/sites-kit/image';

type Props = {
  src: string;
  alt: string;
  width: number;
  height: number;
  sizes: string;
  priority?: boolean;
  /** Load at once but without high priority (photos in the first screen besides the LCP one). */
  eager?: boolean;
  className?: string;
  /** Phone box ratio (<= 640px wide), e.g. { width: 4, height: 5 }: fetches enough width to cover it. */
  mobile?: { width: number; height: number };
  widths?: number[];
  quality?: number;
};

export function Photo({ src, alt, width, height, sizes, priority = false, eager = false, className, mobile, widths = [480, 720, 960, 1280, 1600, 2000], quality = 60 }: Props) {
  const ratio = width / height;
  const set = (r: number, format: 'avif' | 'webp') => srcset(src, widths, r, { format, quality: format === 'avif' ? quality - 4 : quality + 8 });
  // Phone crop: the same wide file, cropped by object-fit; `sizes` asks for
  // enough pixels to fill the taller phone box (a <source media> crop made
  // Chromium start and abort both downloads on desktop).
  const sz = mobile ? `(max-width: 640px) ${Math.round(Math.min(1.5, width / height / (mobile.width / mobile.height)) * 100)}vw, ${sizes}` : sizes;
  const fallback = img(src, { w: 960, h: Math.round(960 / ratio), quality: quality + 8 });
  return (
    <picture className={className}>
      <source type="image/avif" srcSet={set(ratio, 'avif')} sizes={sz} />
      <img src={fallback} srcSet={set(ratio, 'webp')} sizes={sz} width={width} height={height} alt={alt} loading={priority || eager ? 'eager' : 'lazy'} fetchPriority={priority ? 'high' : undefined} decoding={priority ? 'sync' : 'async'} />
    </picture>
  );
}
