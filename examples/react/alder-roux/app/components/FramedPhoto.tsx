/**
 * A pool photo with its own framing, served by imgproxy (img.realadvisor.ch)
 * like RaImage: AVIF, WebP and JPEG per width at the photo's own ratio, the
 * box crop from CSS (object-fit: cover + the focal point), and optionally a
 * separate phone crop (imgproxy `crop` with fractions of the original) under
 * 768px. Same URLs as the Astro version's FramedPhoto.astro.
 */
import { preload } from 'react-dom';
import { img } from '@realadvisor/sites-kit-core/image';
import type { Framed } from '../content/places';

export type FramedPhotoProps = {
  photo: Framed; alt: string; width: number; height: number; sizes?: string; priority?: boolean;
  /** Use the photo's phone crop under 768px (heroes with a portrait box). */
  mobile?: boolean; widths?: number[]; className?: string;
};

const IMGPROXY = 'https://img.realadvisor.ch';
const MOBILE = '(max-width: 767px)';
const b64 = (s: string) => btoa(s).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');

export function FramedPhoto({ photo, alt, width, height, sizes: sizesProp, priority = false, mobile = false, widths: widthsProp, className }: FramedPhotoProps) {
  const widths = widthsProp ?? [480, 800, 1200, 1600, 2000];
  const sizes = sizesProp ?? (priority ? '(min-width: 1440px) 1440px, 100vw' : '100vw');
  const [l, t, cw, ch] = photo.mobile;
  const cropped = (w: number, fmt: string) => `${IMGPROXY}/_/crop:${cw}:${ch}:nowe:${l}:${t}/rs:fit:${w}:0:1:0/q:75/${b64(photo.url)}.${fmt}`;
  const set = (fmt: 'avif' | 'webp' | 'jpg') => widths.map((w) => `${img(photo.url, { w, fit: 'fit', format: fmt, quality: 75 })} ${w}w`).join(', ');
  const mset = (fmt: string) => [480, 800, 1200].map((w) => `${cropped(w, fmt)} ${w}w`).join(', ');
  const fallback = img(photo.url, { w: 1200, fit: 'fit', format: 'jpg', quality: 75 });
  if (priority) {
    if (mobile) preload(cropped(800, 'avif'), { as: 'image', type: 'image/avif', media: MOBILE, imageSrcSet: mset('avif'), imageSizes: '100vw', fetchPriority: 'high' });
    preload(fallback, { as: 'image', type: 'image/avif', media: mobile ? '(min-width: 768px)' : undefined, imageSrcSet: set('avif'), imageSizes: sizes, fetchPriority: 'high' });
  }
  return (
    <picture>
      {mobile && <source media={MOBILE} type="image/avif" srcSet={mset('avif')} sizes="100vw" />}
      {mobile && <source media={MOBILE} type="image/webp" srcSet={mset('webp')} sizes="100vw" />}
      <source type="image/avif" srcSet={set('avif')} sizes={sizes} />
      <source type="image/webp" srcSet={set('webp')} sizes={sizes} />
      <img src={fallback} srcSet={set('jpg')} sizes={sizes} width={width} height={height} alt={alt}
        loading={priority ? 'eager' : 'lazy'} fetchPriority={priority ? 'high' : undefined} decoding="async"
        style={{ objectPosition: photo.position }} className={className} />
    </picture>
  );
}
