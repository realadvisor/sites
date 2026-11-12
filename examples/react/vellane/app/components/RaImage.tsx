/**
 * The kit's RaImage with the Astro kit's default: an AVIF <source> (and so a
 * <picture>) only for the priority image. Same markup as the Astro site, so
 * selectors like `.about__photos img:nth-child(2)` match the same elements.
 */
import { RaImage as KitRaImage, type RaImageProps } from '@realadvisor/sites-kit-react/components/RaImage';

export function RaImage(props: RaImageProps) {
  return <KitRaImage avif={!!props.priority} {...props} />;
}
