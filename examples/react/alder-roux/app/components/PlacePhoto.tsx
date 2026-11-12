/**
 * A place photo (app/content/places.ts): the RealAdvisor pool via the kit's
 * RaImage, or a framed pool photo via FramedPhoto. Same props as RaImage.
 */
import { Img } from './Img';
import { FramedPhoto } from './FramedPhoto';
import type { Place } from '../content/places';

type Props = { place: Place; alt: string; width: number; height: number; sizes?: string; priority?: boolean;
  mobile?: { width: number; height: number; sizes?: string }; widths?: number[]; className?: string };

export function PlacePhoto({ place, mobile, widths, ...rest }: Props) {
  return typeof place.photo === 'string'
    ? <Img src={place.photo} mobile={mobile} widths={widths} {...rest} />
    : <FramedPhoto photo={place.photo} mobile={!!mobile} widths={widths} {...rest} />;
}
