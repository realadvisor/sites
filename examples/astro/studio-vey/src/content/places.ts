/**
 * Place photos (towns, lake) and area copy: site content, not API data.
 * Photos from the RealAdvisor image pool,
 * always rendered through RaImage. Copy is descriptive only: no figures, no claims.
 */
import { cropImg, type Crop } from '../lib/photo';

const P = 'https://storage.googleapis.com/img.realadvisor.ch/sites-demo-pexels';

export const PHOTOS = {
  limmat: { url: `${P}-36972127.jpg`, alt: 'Die Limmat und die Altstadt von Zürich' },
  fraumuenster: { url: `${P}-36972128.jpg`, alt: 'Brücke über die Limmat mit dem Fraumünster' },
  promenade: { url: `${P}-38039446.jpg`, alt: 'Schiffsanlegestelle am Ufer des Zürichsees' },
  limmatquai: { url: `${P}-38040375.jpg`, alt: 'Häuserzeile am Limmatquai in Zürich' },
  riverside: { url: `${P}-38040438.jpg`, alt: 'Häuser am Ufer der Limmat in Zürich' },
  lakeAlps: { url: `${P}-28656755.jpg`, alt: 'Der Zürichsee mit den Alpen im Hintergrund' },
  lakeAbove: { url: `${P}-31528911.jpg`, alt: 'Blick von oben auf den Zürichsee und die Ufergemeinden' },
} as const;

// Portrait original (2268 x 4032): keep Alps, lake and the houses on the slope (square).
const KUESNACHT: PlacePhoto = {
  url: `${P}-36803753.jpg`,
  alt: 'Häuser am Hang des rechten Seeufers, Blick über den Zürichsee zu den Alpen',
  crop: { left: 0, top: 0.24, width: 0, height: 0.5625 },
  position: '50% 58%',
};

/** Bucket photo (RaImage), or with `crop` a cropped square of its original (CroppedPhoto). */
export type PlacePhoto = { url: string; alt: string; crop?: Crop; position?: string };
export type AreaCopy = { lede: string; body: string[]; photo: PlacePhoto };

/** Absolute-path URL of a place photo for og:image. */
export const placePhotoOg = (p: PlacePhoto, img: (u: string, o: { w: number; h: number }) => string) =>
  p.crop ? cropImg(p.url, p.crop, { w: 1200, h: 1200, format: 'jpg' }) : img(p.url, { w: 1200, h: 630 });

/** Area page copy by city slug. A city with an area page but no entry here gets a short default. */
export const AREAS: Record<string, AreaCopy> = {
  zuerich: {
    lede: 'Von der Altstadt an der Limmat bis zu den Quartieren am Seebecken: Unsere Objekte in Zürich liegen meist im Seefeld, in Hottingen und in der Altstadt.',
    body: [
      'Wir kennen die Stadt aus der Nähe: Unser Büro liegt im Seefeld, wenige Schritte vom Ufer. Viele unserer Mandate liegen in den Quartieren rund um das Seebecken, in Hottingen und in der Altstadt, ebenso Lofts in den ehemaligen Industriequartieren im Westen der Stadt.',
      'Ob Altbauwohnung mit Stuck, Attika mit Dachgarten oder ein kleines Studio in der Altstadt: Bei Altbauten klären wir vor der Ausschreibung, was im Grundbuch steht und welche Renovationen anstehen.',
    ],
    photo: PHOTOS.limmat,
  },
  kuesnacht: {
    lede: 'Küsnacht liegt am rechten Ufer des Zürichsees, zwischen Rebhängen und Wasser. Vom Bahnhof Küsnacht fährt die S-Bahn direkt nach Stadelhofen.',
    body: [
      'Das rechte Seeufer verbindet die Ruhe eines Dorfes mit der Nähe zur Stadt. Viele Liegenschaften stehen am Hang und haben Sicht über den See; im Dorfkern liegen Bahnhof, Läden und Schulen nah beieinander.',
      'Wir begleiten in Küsnacht Villen, Häuser und Attikawohnungen. Wer diskret verkaufen möchte, kann sein Objekt zuerst ausgewählten Interessenten zeigen, bevor es online geht.',
    ],
    // Local Pexels photo: houses on the right-shore slope above the lake (CREDITS.md).
    photo: KUESNACHT,
  },
};

export const defaultArea = (city: string): AreaCopy => ({
  lede: `Unsere aktuellen und vermittelten Objekte in ${city}.`,
  body: [],
  photo: PHOTOS.lakeAlps,
});
