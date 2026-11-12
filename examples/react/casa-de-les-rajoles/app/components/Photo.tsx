/**
 * A photo from the RealAdvisor image bucket through the kit's imgproxy helper:
 * AVIF first, WebP fallback, cropped to width/height (the box ratio), with an
 * optional portrait crop under 768px. CSS sets the rendered size; `priority`
 * for the page's one LCP image. Same URLs as the Astro version's Photo.astro.
 */
import { img, srcset } from '@realadvisor/sites-kit-core/image';

export type PhotoProps = {
  src: string;
  alt: string;
  width: number;
  height: number;
  sizes?: string;
  priority?: boolean;
  className?: string;
  position?: string;
  mobile?: { width: number; height: number; sizes?: string };
  lang?: string;
};

export function Photo({ src, alt, width, height, sizes = '100vw', priority = false, className, position, mobile, lang }: PhotoProps) {
  const ratio = width / height;
  const widths = priority ? [640, 960, 1280, 1600] : [480, 720, 960, 1280, 1600];
  const q = priority ? 62 : 60;
  const avif = srcset(src, widths, ratio, { format: 'avif', quality: q });
  const webp = srcset(src, widths, ratio, { quality: 70 });
  const mRatio = mobile ? mobile.width / mobile.height : 0;
  const mW = [480, 640, 800, 1080];
  const mAvif = mobile ? srcset(src, mW, mRatio, { format: 'avif', quality: q }) : '';
  const mWebp = mobile ? srcset(src, mW, mRatio, { quality: 70 }) : '';
  const fallback = img(src, { w: 960, h: Math.round(960 / ratio), quality: 70 });
  return (
    <picture className={className}>
      {mobile && <source media="(max-width: 767px)" type="image/avif" srcSet={mAvif} sizes={mobile.sizes ?? '100vw'} />}
      {mobile && <source media="(max-width: 767px)" type="image/webp" srcSet={mWebp} sizes={mobile.sizes ?? '100vw'} />}
      <source type="image/avif" srcSet={avif} sizes={sizes} />
      <img src={fallback} srcSet={webp} sizes={sizes} width={width} height={height} alt={alt} lang={lang} loading={priority ? 'eager' : 'lazy'} fetchPriority={priority ? 'high' : undefined} decoding={priority ? 'sync' : 'async'} style={position ? { objectPosition: position } : undefined} />
    </picture>
  );
}
