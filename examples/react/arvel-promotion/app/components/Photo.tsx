/**
 * The kit's RaImage with the Astro version's formats: AVIF only for the
 * page's `priority` image (the Astro RaImage), WebP/JPEG otherwise.
 */
import { RaImage, type RaImageProps } from '@realadvisor/sites-kit-react/components/RaImage';

export function Photo(props: RaImageProps) {
  return <RaImage avif={!!props.priority} {...props} />;
}
