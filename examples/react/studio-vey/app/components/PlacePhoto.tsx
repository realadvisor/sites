/** A place photo through RaImage (imgproxy); with `crop`, a square of its original and AVIF/WebP/JPEG sources. */
import { RaImage } from '@realadvisor/sites-kit-react/components/RaImage';
import type { PlacePhoto as Photo } from '../content/places';

type Props = { photo: Photo; width: number; height: number; sizes?: string; priority?: boolean; mobile?: { width: number; height: number } };

export function PlacePhoto({ photo, width, height, sizes, priority, mobile }: Props) {
  return photo.crop ? (
    <RaImage src={photo.url} alt={photo.alt} crop={photo.crop} width={1200} height={1200} position={photo.position} sizes={sizes ?? '100vw'} priority={priority} widths={[480, 800, 1200, 1600]} quality={70} />
  ) : (
    <RaImage src={photo.url} alt={photo.alt} width={width} height={height} sizes={sizes} priority={priority} mobile={mobile} />
  );
}
