/**
 * The kit's RaImage as the Astro kit renders it: AVIF (and so a <picture>)
 * only for the priority image, a plain <img> otherwise. The React kit adds
 * AVIF to every image by default, which wraps each one in a <picture> and
 * changes the layout of the boxes that size the <img> directly.
 */
import { RaImage, type RaImageProps } from '@realadvisor/sites-kit-react/components/RaImage';

export function Photo(props: RaImageProps) {
  return <RaImage avif={!!props.priority} {...props} />;
}
