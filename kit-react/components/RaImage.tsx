/**
 * THE way to show a listing, agent, agency or place photo (port of the Astro
 * kit's RaImage.astro, same URLs and srcsets). imgproxy at the size you
 * render, srcset, sizes, width/height, lazy by default; `priority` for the
 * page's one LCP image (eager, fetchpriority high, a preload React hoists
 * into <head>, at most 1600w, quality 70).
 *
 * Added over the Astro version (what the Astro sites built themselves):
 * - `avif`: an AVIF <source> (default: on the priority image only, as on
 *   Astro; a lazy photo stays a plain <img>, so CSS that sizes `> img` holds);
 * - `position`: object-position / focal point for boxes that crop further;
 * - `crop`: a part of the original (fractions), e.g. a square out of a
 *   portrait photo, before the resize.
 *
 *   <RaImage src={l.photos[0]} alt="…" width={800} height={600} sizes="(min-width: 1024px) 33vw, 100vw" />
 *   <RaImage src={hero} alt="" width={1600} height={1200} priority mobile={{ width: 800, height: 640 }} data-hero />
 *
 * `data-*` attributes go on the <img> (as Astro's `...rest`).
 */
import type { CSSProperties } from 'react';
import { preload } from 'react-dom';
import { imgUrl, srcsetUrl, type Crop } from '../lib/image';

export type RaImageProps = {
  /** A photo of the data (`{ url, alt }`) or a URL. */
  src: { url: string; alt?: string } | string | null | undefined;
  alt: string;
  width: number;
  height: number;
  /** Browser layout width per breakpoint. Default 100vw. */
  sizes?: string;
  priority?: boolean;
  fit?: 'fill' | 'fit';
  widths?: number[];
  quality?: number;
  /** Crop for screens under 768px: box ratio width/height and sizes. */
  mobile?: { width: number; height: number; sizes?: string };
  /** AVIF source first (default: `priority`, as the Astro kit). */
  avif?: boolean;
  /** object-position of the rendered photo, e.g. "50% 30%". */
  position?: string;
  /** Part of the original to use, in fractions of its size. */
  crop?: Crop;
  className?: string;
  style?: CSSProperties;
  /** `data-*` attributes, on the <img> (e.g. `data-hero`). */
  [data: `data-${string}`]: string | number | boolean | undefined;
};

const MOBILE = '(max-width: 767px)';
const DESKTOP = '(min-width: 768px)';
const MOBILE_W = [480, 600, 800, 1200];

export function RaImage(props: RaImageProps) {
  const { src, alt, width, height, priority = false, fit = 'fill', mobile, avif = priority, position, crop, className } = props;
  const data = Object.fromEntries(Object.entries(props).filter(([k]) => k.startsWith('data-')));
  const url = typeof src === 'string' ? src : src?.url;
  if (!url) return null;
  const widths = props.widths ?? (priority ? [640, 960, 1280, 1600] : [480, 768, 1200, 1920]);
  const quality = props.quality ?? (priority ? 70 : undefined);
  const sizes = props.sizes ?? (priority ? '(min-width: 1440px) 1440px, 100vw' : '100vw');
  const ratio = fit === 'fill' ? width / height : undefined;
  const set = srcsetUrl(url, widths, ratio, { quality, crop });
  const avifSet = set && avif ? srcsetUrl(url, widths, ratio, { quality, crop, format: 'avif' }) : '';
  const fallbackW = Math.min(1200, Math.max(...widths.filter((w) => w <= 1200), widths[0] ?? 768));
  const fallback = imgUrl(url, { w: fallbackW, h: ratio ? Math.round(fallbackW / ratio) : 0, fit, quality, crop });
  const mRatio = mobile ? mobile.width / mobile.height : 0;
  const mobileSet = mobile ? srcsetUrl(url, MOBILE_W, mRatio, { quality, crop }) : '';
  const mobileAvif = mobileSet && avif ? srcsetUrl(url, MOBILE_W, mRatio, { quality, crop, format: 'avif' }) : '';
  const mobileSizes = mobile?.sizes ?? '100vw';
  const style = position ? { objectPosition: position, ...props.style } : props.style;
  const image = (
    <img
      src={fallback}
      srcSet={set || undefined}
      sizes={set ? sizes : undefined}
      width={width}
      height={height}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : undefined}
      decoding="async"
      className={className}
      style={style}
      {...data}
    />
  );
  const usePicture = !!(mobileSet || avifSet);
  // Preloads (React puts them in <head>): the format the browser will pick first (AVIF when there is one).
  if (priority) {
    if (mobileSet) preload(fallback, { as: 'image', type: mobileAvif ? 'image/avif' : undefined, media: MOBILE, imageSrcSet: mobileAvif || mobileSet, imageSizes: mobileSizes, fetchPriority: 'high' });
    if (set) preload(fallback, { as: 'image', type: avifSet ? 'image/avif' : undefined, media: mobileSet ? DESKTOP : undefined, imageSrcSet: avifSet || set, imageSizes: sizes, fetchPriority: 'high' });
  }
  if (!usePicture) return image;
  return (
    <>
      <picture>
        {mobileAvif && <source media={MOBILE} type="image/avif" srcSet={mobileAvif} sizes={mobileSizes} width={mobile!.width} height={mobile!.height} />}
        {mobileSet && <source media={MOBILE} srcSet={mobileSet} sizes={mobileSizes} width={mobile!.width} height={mobile!.height} />}
        {avifSet && <source type="image/avif" srcSet={avifSet} sizes={sizes} />}
        {image}
      </picture>
    </>
  );
}

export default RaImage;
