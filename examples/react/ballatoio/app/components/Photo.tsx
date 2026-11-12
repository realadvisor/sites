/**
 * The kit's RaImage with the Astro version's formats: an AVIF source only
 * on the page's priority image (the Astro kit adds none to lazy photos).
 */
import { RaImage, type RaImageProps } from '@realadvisor/sites-kit-react/components/RaImage';

export function Photo(props: RaImageProps) {
  return <RaImage avif={!!props.priority} {...props} />;
}
