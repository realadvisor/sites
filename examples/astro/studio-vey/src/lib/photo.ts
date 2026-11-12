/**
 * Bucket photo with a crop of the original (imgproxy `c:` step) on top of the
 * kit's `img()`. Kit gap: `img()` only resizes; no crop/gravity option.
 * `crop` = fractions of the original: [left, top, width, height] (0 = full).
 */
import { img, type ImgOptions } from '@realadvisor/sites-kit/image';

export type Crop = { left: number; top: number; width: number; height: number };

export function cropImg(url: string, crop: Crop, o: ImgOptions): string {
  const c = `c:${crop.width}:${crop.height}:nowe:${crop.left}:${crop.top}`;
  return img(url, o).replace('/_/rs:', `/_/${c}/rs:`);
}
