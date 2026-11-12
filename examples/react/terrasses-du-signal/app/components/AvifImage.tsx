/**
 * A lazy RealAdvisor photo with an AVIF source first, for long galleries
 * where every byte counts; same imgproxy URLs as the Astro version's AvifImage.astro.
 */
import { img, srcset } from '@realadvisor/sites-kit/image';

type Props = { src: string; alt: string; width: number; height: number; sizes: string; widths?: number[]; quality?: number };

export function AvifImage({ src, alt, width, height, sizes, widths = [360, 480, 720, 1080, 1440], quality = 58 }: Props) {
  const ratio = width / height;
  const avif = srcset(src, widths, ratio, { quality, format: 'avif' });
  const webp = srcset(src, widths, ratio, { quality });
  const fallback = img(src, { w: 720, h: Math.round(720 / ratio), quality });
  return (
    <picture>
      <source type="image/avif" srcSet={avif} sizes={sizes} />
      <img src={fallback} srcSet={webp} sizes={sizes} width={width} height={height} alt={alt} loading="lazy" decoding="async" />
    </picture>
  );
}
