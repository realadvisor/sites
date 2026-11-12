/**
 * The kit's RaImage with the Astro kit's format rule: an AVIF source only on
 * the priority (LCP) image, so lazy photos stay a plain <img> as on the
 * Astro version (the page CSS targets `> img`).
 * Kit gap: RaImage passes no data-* attributes (the Astro site marks heroes `data-hero`).
 */
import { RaImage, type RaImageProps } from '@realadvisor/sites-kit-react/components/RaImage';

export function Img(props: RaImageProps) {
  return <RaImage avif={!!props.priority} {...props} />;
}
