/**
 * Photo URLs: the Astro kit's `img()` / `srcset()` (imgproxy on
 * img.realadvisor.ch, Google profile photos, other hosts unchanged) plus a
 * crop of the original (imgproxy `c:` step), which sites had to add.
 */
import { img, srcset, type ImgOptions } from '@realadvisor/sites-kit/image';

export { img, srcset, type ImgOptions };

/** A part of the original, in fractions: [left, top, width, height] (0 = full size). */
export type Crop = { left: number; top: number; width: number; height: number };

const IMGPROXY = 'https://img.realadvisor.ch/';

/** `img()` with an optional crop of the original before the resize. */
export function imgUrl(url: string | null | undefined, o: ImgOptions & { crop?: Crop }): string {
  const out = img(url, o);
  if (!o.crop || !out.startsWith(IMGPROXY)) return out;
  const c = `c:${o.crop.width}:${o.crop.height}:nowe:${o.crop.left}:${o.crop.top}`;
  return out.replace('/rs:', `/${c}/rs:`);
}

/** srcset with an optional crop: `ratio` = width / height of the box (fill), omitted = the photo's own ratio. */
export function srcsetUrl(
  url: string | null | undefined,
  widths: number[],
  ratio: number | undefined,
  opts: Pick<ImgOptions, 'format' | 'quality'> & { crop?: Crop } = {},
): string {
  if (!url) return '';
  if (!opts.crop) return srcset(url, widths, ratio, opts);
  if (img(url, { w: 1 }) === url) return '';
  return widths
    .map((w) => `${imgUrl(url, { w, h: ratio ? Math.round(w / ratio) : 0, fit: ratio ? 'fill' : 'fit', ...opts })} ${w}w`)
    .join(', ');
}
