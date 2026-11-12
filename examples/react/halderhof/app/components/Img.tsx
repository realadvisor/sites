/**
 * The kit's RaImage as the Astro kit renders it: an AVIF <source> only on
 * the page's priority image (the other photos are a plain <img>, or a
 * <picture> when they have a phone crop), so boxes that size the <img> keep
 * their layout.
 */
import { RaImage, type RaImageProps } from '@realadvisor/sites-kit-react/components/RaImage';

export function Img(props: RaImageProps) {
  return <RaImage {...props} avif={props.priority ?? false} />;
}
