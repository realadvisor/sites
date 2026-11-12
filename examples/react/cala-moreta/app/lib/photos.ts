/**
 * Place photos (towns, coast, countryside): free Pexels photos (credits in
 * src/content/photo-credits.md) kept in the RealAdvisor image bucket and served
 * by imgproxy on img.realadvisor.ch, through the kit's image helper. Scenery
 * only: never a listing photo (those come from the data, through RaImage).
 *
 * The kit helper has no gravity, so the 3:2 crop of a portrait photo and the
 * 2:3 crop of a landscape one (phone heroes) add a focus point to the imgproxy
 * URL here (`g:fp:x:y`, else smart crop `g:sm`).
 */
import { img } from '@realadvisor/sites-kit-core/image';
import type { Lang } from './i18n';

export interface PlacePhoto {
  /** Pexels id, e.g. `14281559`; the bucket file is `sites-demo-pexels-<id>.jpg`. */
  file: string;
  alt: Record<Lang, string>;
  /** CSS object-position for crops (portrait sources in wide boxes). */
  focus?: string;
}

/** Source size of each bucket photo. */
const DIMS: Record<string, [number, number]> = {'10080995': [2400, 3196], '10224319': [2400, 1600], '10421085': [2400, 1600], '12789181': [2400, 1600], '13156385': [2400, 1600], '13776202': [2400, 1600], '14281559': [2400, 1350], '14339766': [2400, 3600], '20843248': [2400, 3600], '22737753': [2268, 4032], '26923632': [2400, 1800], '30613504': [2400, 3600], '30613506': [2400, 3600], '33208529': [2400, 1349], '34389681': [2400, 3200], '38021376': [2400, 1802], '5358490': [2400, 3600], '7011768': [2400, 1800], '808703': [2400, 1592], '9500327': [2400, 1350], '9769288': [2400, 1350]};
/** Manual crop centres: l = vertical centre of the 3:2 crop of a portrait photo,
 * p = horizontal centre of the 2:3 crop of a landscape one; q = AVIF quality for
 * very detailed photos (pine needles, stone) that would weigh 300 KB as a phone hero. */
const CROPS: Record<string, { l?: number; p?: number; q?: number }> = {'5358490': {'l': 0.6, 'q': 38}, '22737753': {'l': 0.5}, '30613506': {'l': 0.42}, '14281559': {'p': 0.56}, '10080995': {'q': 36}, '26923632': {'q': 34}};

const p = (id: string, es: string, en: string, focus?: string): PlacePhoto => ({ file: id, alt: { es, en }, focus });

export const PHOTOS = {
  home: p('13776202', 'Rocas, pinos y agua clara en una cala de la Costa Brava', 'Rocks, pines and clear water in a Costa Brava cove'),
  begur: p('14281559', 'Sa Tuna, una cala de Begur, con barcas y casas entre pinos', 'Sa Tuna, a Begur cove, with boats and houses among the pines'),
  begur2: p('30613506', 'Un pino sobre las rocas de la costa de Begur', 'A pine over the rocks of the Begur coast', '50% 40%'),
  tamariu: p('7011768', 'La bahía de Tamariu al anochecer, con el paseo iluminado', 'Tamariu bay at nightfall, the waterfront lit up'),
  llafranc: p('33208529', 'Llafranc y su bahía al atardecer, vistos desde el faro', 'Llafranc and its bay at sunset, seen from the lighthouse hill'),
  llafranc2: p('10421085', 'La playa de Llafranc entre colinas de pinos', 'Llafranc beach between pine-covered hills'),
  /** Contact: same photo as Llafranc's second, which has no area page yet (one listing). */
  contact: p('10421085', 'La playa de Llafranc entre colinas de pinos', 'Llafranc beach between pine-covered hills'),
  calella: p('10224319', 'Casas blancas y barcas en la playa de Calella de Palafrugell', 'White houses and fishing boats on the beach at Calella de Palafrugell'),
  calella2: p('34389681', 'Arcos de piedra y agua turquesa en Calella de Palafrugell', 'Stone arches and turquoise water at Calella de Palafrugell', '50% 35%'),
  pals: p('5358490', 'Calle de piedra y arco medieval en Pals', 'A stone street and medieval arch in Pals', '50% 62%'),
  peratallada: p('26923632', 'Casas de piedra de un pueblo medieval del Baix Empordà', 'Stone houses in a medieval Baix Empordà village', '50% 55%'),
  cadaques: p('9500327', 'Cadaqués desde el aire, con la bahía llena de barcas', 'Cadaqués from the air, its bay full of boats'),
  cadaques2: p('20843248', 'El paseo de Cadaqués a la luz de la tarde', 'The Cadaqués waterfront in the evening light', '50% 72%'),
  sagaro: p('10080995', 'Rocas rojizas y pinos sobre el mar junto a S’Agaró', 'Red rocks and pines above the sea near S’Agaró', '50% 55%'),
  about: p('30613504', 'Casas junto al mar en Begur', 'Houses by the sea in Begur', '50% 40%'),
  aboutBand: p('808703', 'Un velero al atardecer frente a la costa de Begur', 'A sailboat at sunset off the Begur coast'),
  sell: p('14339766', 'Una cala con casetas de pescadores entre pinos', 'A cove with fishermen’s huts among the pines', '50% 60%'),
  postWinter: p('22737753', 'Escalera de piedra y casa tradicional en Begur', 'Stone steps and a traditional house in Begur', '50% 55%'),
  postMasia: p('9769288', 'Masías de piedra entre prados verdes', 'Stone farmhouses among green fields'),
  postAbroad: p('12789181', 'Barcos fondeados en una bahía de rocas y pinos', 'Boats at anchor in a bay of rocks and pines'),
  postRent: p('13156385', 'Un pueblo de la costa entre pinos y agua clara', 'A coastal village among pines and clear water'),
  postEnergy: p('38021376', 'Placas solares sobre tejados de teja con chimeneas', 'Solar panels on tiled roofs with chimneys'),
} satisfies Record<string, PlacePhoto>;

export type PhotoKey = keyof typeof PHOTOS;
export const isPhotoKey = (k: string): k is PhotoKey => k in PHOTOS;

const BUCKET = 'https://storage.googleapis.com/img.realadvisor.ch/';
const WIDTHS = [480, 800, 1000, 1200, 1600, 2000];
const AVIF_Q = 45;
const WEBP_Q = 72;
const JPEG_Q = 74;
const FALLBACK = 1200;

type Crop = 'l' | 'p' | undefined;
type Size = { width: number; height: number; widths: number[]; fallback: number; landscape?: { width: number; height: number; widths: number[] }; portrait?: { width: number; height: number; widths: number[] } };

export function photoSize(photo: PlacePhoto): Size {
  const d = DIMS[photo.file];
  if (!d) throw new Error(`Unknown place photo ${photo.file}`);
  const [width, height] = d;
  // Full portrait files are only shown in boxes at most ~600px wide (a column);
  // wide boxes take the landscape crop, which keeps every width.
  const widths = WIDTHS.filter((w) => w <= width && (height <= width || w <= 1200));
  const portraitSrc = height > width;
  const pw = Math.round((height * 2) / 3);
  return {
    width, height, widths, fallback: Math.min(FALLBACK, width),
    ...(portraitSrc ? { landscape: { width, height: Math.round((width * 2) / 3), widths: WIDTHS.filter((w) => w <= width) } } : {}),
    ...(!portraitSrc ? { portrait: { width: pw, height, widths: [480, 800, 1000, 1200].filter((w) => w <= pw) } } : {}),
  };
}

/** imgproxy URL of one width of the photo (or of its 3:2 `l` / 2:3 `p` crop). */
function photoUrl(photo: PlacePhoto, w: number, format: 'avif' | 'webp' | 'jpg', crop: Crop): string {
  const src = `${BUCKET}sites-demo-pexels-${photo.file}.jpg`;
  const c = CROPS[`${photo.file}`];
  const quality = format === 'avif' ? (c?.q ?? AVIF_Q) : format === 'webp' ? WEBP_Q : JPEG_Q;
  if (!crop) return img(src, { w, fit: 'fit', format, quality });
  const url = img(src, { w, h: Math.round(crop === 'l' ? (w * 2) / 3 : (w * 3) / 2), fit: 'fill', format, quality });
  const centre = crop === 'l' ? c?.l : c?.p;
  const gravity = centre == null ? 'g:sm' : crop === 'l' ? `g:fp:0.5:${centre}` : `g:fp:${centre}:0.5`;
  return url.replace(/(\/rs:[^/]+)\//, `$1/${gravity}/`);
}

/** srcset of the photo, or of its 3:2 landscape (`l`) or 2:3 portrait (`p`) crop. */
export const photoSrcset = (photo: PlacePhoto, fmt: 'avif' | 'webp', crop: boolean | 'l' | 'p' = false) => {
  const s = photoSize(photo);
  const c: Crop = crop === true ? 'l' : crop || undefined;
  const widths = (c === 'p' ? s.portrait?.widths : c === 'l' ? s.landscape?.widths : undefined) ?? s.widths;
  return widths.map((w) => `${photoUrl(photo, w, fmt, c)} ${w}w`).join(', ');
};
export const photoFallback = (photo: PlacePhoto) => photoUrl(photo, photoSize(photo).fallback, 'jpg', undefined);
/** Absolute URL for og:image. */
export const photoOg = (photo: PlacePhoto, _site?: URL | string) => photoFallback(photo);
