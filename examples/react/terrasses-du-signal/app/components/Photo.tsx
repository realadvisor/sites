/**
 * The kit's RaImage with the Astro kit's format rule: an AVIF source only on
 * the priority (LCP) image, so the markup (bare <img> or <picture>) and the
 * bytes stay those of the Astro version.
 */
import { RaImage, type RaImageProps } from '@realadvisor/sites-kit-react/components/RaImage';

export function Photo(props: RaImageProps) {
  return <RaImage {...props} avif={!!props.priority} />;
}
