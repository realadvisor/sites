/**
 * Remote photo helper. Listing and agent photos are remote URLs; never ship
 * the original file. Ask imgproxy for the exact size you render.
 *
 *   <img src={img(photo.url, { w: 800, h: 600 })}
 *        srcset={srcset(photo.url, [400, 800, 1200], 4 / 3)}
 *        sizes="(min-width: 1024px) 33vw, 100vw"
 *        width="800" height="600" loading="lazy" decoding="async" alt="…" />
 *
 * - RealAdvisor storage URLs (storage.googleapis.com/...) are wrapped in an
 *   imgproxy URL on img.realadvisor.ch.
 * - Existing img.realadvisor.ch imgproxy URLs get their resize step replaced.
 * - Any other host is returned unchanged (resize it yourself or keep it small).
 */
const IMGPROXY = 'https://img.realadvisor.ch';
const PROXYABLE = [
  'https://storage.googleapis.com/img.realadvisor.ch/',
  'https://storage.googleapis.com/img-dev.realadvisor.ch/',
  'https://storage.googleapis.com/aggregator-images/',
  'https://storage.googleapis.com/aggregator-images-test/',
  'https://storage.googleapis.com/aggregator-images2/',
  'https://images.prismic.io/realadvisor/',
];

export type ImgOptions = {
  w: number;
  h?: number;
  fit?: 'fill' | 'fit';
  format?: 'webp' | 'avif' | 'jpg';
  quality?: number;
};

const b64url = (s: string) =>
  btoa(String.fromCharCode(...new TextEncoder().encode(s)))
    .replace(/=+$/, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

export function img(url: string | undefined | null, o: ImgOptions): string {
  if (!url) return '';
  const fit = o.fit ?? 'fill';
  const rs = `rs:${fit}:${Math.round(o.w)}:${Math.round(o.h ?? 0)}:1:0`;
  const q = `q:${o.quality ?? 75}`;
  const format = o.format ?? 'webp';
  if (url.startsWith(`${IMGPROXY}/`)) {
    // https://img.realadvisor.ch/_/rs:fill:W:H:1:0/<...>/<base64>.<ext>
    const parts = url.slice(IMGPROXY.length + 1).split('/');
    const source = parts[parts.length - 1]!.replace(/\.\w+$/, '');
    return `${IMGPROXY}/${parts[0]}/${rs}/${q}/${source}.${format}`;
  }
  if (PROXYABLE.some((p) => url.startsWith(p))) {
    return `${IMGPROXY}/_/${rs}/${q}/${b64url(url)}.${format}`;
  }
  if (url.startsWith('https://lh3.googleusercontent.com/')) {
    // Google profile photos (some agents): size suffix `=w<W>-h<H>-c` (c = crop).
    const size = o.h ? `w${Math.round(o.w)}-h${Math.round(o.h)}${fit === 'fill' ? '-c' : ''}` : `s${Math.round(o.w)}`;
    return `${url.replace(/=[^/=]*$/, '')}=${size}`;
  }
  return url;
}

/** srcset for responsive images. `ratio` = width / height, omit to keep the original ratio. */
export function srcset(
  url: string | undefined | null,
  widths: number[],
  ratio?: number,
  opts: Pick<ImgOptions, 'format' | 'quality'> = {},
): string {
  if (!url) return '';
  if (img(url, { w: 1 }) === url) return ''; // not resizable: let src stand alone
  return widths
    .map((w) => `${img(url, { w, h: ratio ? Math.round(w / ratio) : 0, fit: ratio ? 'fill' : 'fit', ...opts })} ${w}w`)
    .join(', ');
}
