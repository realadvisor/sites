/**
 * Place content the API does not carry: photos of Lugano (RealAdvisor image
 * pool, credits in
 * photo-credits.md) and the written location text, in Italian and German.
 * Site copy, written for this example. Claims stay general and checkable;
 * distances are computed from the development's (rounded) coordinates, as
 * the crow flies, never travel times.
 */
import type { L } from '../lib/routes';

const pool = (id: string) => `https://storage.googleapis.com/img.realadvisor.ch/sites-demo-pexels-${id}.jpg`;
type T = Record<L, string>;
export type PlacePhoto = { url: string; alt: T };

export const PHOTOS = {
  aerial: { url: pool('26925301'), alt: { it: 'Lugano dall’alto: il lungolago di Cassarate e le pendici del Monte Brè', de: 'Lugano von oben: die Seepromenade von Cassarate und die Hänge des Monte Brè' } },
  front: { url: pool('33847172'), alt: { it: 'Il lungolago di Lugano con il Monte Brè alle spalle', de: 'Die Seepromenade von Lugano mit dem Monte Brè im Hintergrund' } },
  fromBre: { url: pool('16816883'), alt: { it: 'Il lago e la città di Lugano visti dal Monte Brè, con il San Salvatore', de: 'See und Stadt Lugano vom Monte Brè aus, mit dem San Salvatore' } },
  oldTown: { url: pool('37910951'), alt: { it: 'Il centro storico di Lugano con il campanile di San Lorenzo', de: 'Die Altstadt von Lugano mit dem Turm von San Lorenzo' } },
  salvatore: { url: pool('10666137'), alt: { it: 'Il lago di Lugano e il Monte San Salvatore', de: 'Der Luganersee und der Monte San Salvatore' } },
  gandria: { url: pool('7938374'), alt: { it: 'Le case di Gandria sul lago di Lugano', de: 'Die Häuser von Gandria am Luganersee' } },
} satisfies Record<string, PlacePhoto>;

/** Straight-line distance in km between two points (haversine). */
export function crowKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const r = (d: number) => (d * Math.PI) / 180;
  const h = Math.sin(r(b.lat - a.lat) / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(r(b.lng - a.lng) / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

/** Public places, approximate public coordinates. */
export const PLACES: { name: T; lat: number; lng: number }[] = [
  { name: { it: 'Piazza della Riforma, centro di Lugano', de: 'Piazza della Riforma, Zentrum Lugano' }, lat: 46.0049, lng: 8.9512 },
  { name: { it: 'Stazione FFS di Lugano', de: 'Bahnhof SBB Lugano' }, lat: 46.0055, lng: 8.9468 },
  { name: { it: 'Gandria, nucleo sul lago', de: 'Gandria, Dorfkern am See' }, lat: 46.0058, lng: 9.0009 },
  { name: { it: 'Aeroporto di Lugano-Agno', de: 'Flughafen Lugano-Agno' }, lat: 45.9993, lng: 8.9106 },
];

export const km = (n: number, l: L) => `${new Intl.NumberFormat(l === 'de' ? 'de-CH' : 'it-CH', { maximumFractionDigits: 1, minimumFractionDigits: 1 }).format(n)} km`;

export type Section = { id: string; title: T; body: Record<L, string[]>; photo: PlacePhoto };

export const SECTIONS: Section[] = [
  {
    id: 'castagnola',
    title: { it: 'Castagnola e il Monte Brè', de: 'Castagnola und der Monte Brè' },
    body: {
      it: [
        'Castagnola è il quartiere di Lugano sul versante del Monte Brè, tra Cassarate e Gandria. Le strade salgono a tornanti tra ville, giardini terrazzati e castagni, con il lago sempre davanti.',
        'La funicolare per la vetta del Monte Brè parte da Cassarate, in basso nel quartiere.',
      ],
      de: [
        'Castagnola ist das Quartier von Lugano am Hang des Monte Brè, zwischen Cassarate und Gandria. Die Strassen führen in Kehren zwischen Villen, Terrassengärten und Kastanien hinauf, der See liegt immer vor einem.',
        'Die Standseilbahn auf den Monte Brè fährt unten im Quartier, in Cassarate, ab.',
      ],
    },
    photo: PHOTOS.aerial,
  },
  {
    id: 'lago',
    title: { it: 'Il lago e Gandria', de: 'Der See und Gandria' },
    body: {
      it: [
        'Sotto la residenza parte il sentiero dell’olivo, che corre a mezza costa fino al nucleo di Gandria. In città, il lungolago porta dal Parco Ciani a Cassarate e al lido.',
        'I battelli della Società Navigazione del Lago di Lugano collegano il centro con Gandria e gli altri paesi del lago.',
      ],
      de: [
        'Unterhalb der Residenz beginnt der Olivenweg, der am Hang entlang bis in den Dorfkern von Gandria führt. In der Stadt führt die Seepromenade vom Parco Ciani nach Cassarate und zum Lido.',
        'Die Kursschiffe auf dem Luganersee verbinden das Zentrum mit Gandria und den anderen Orten am See.',
      ],
    },
    photo: PHOTOS.gandria,
  },
  {
    id: 'citta',
    title: { it: 'La città', de: 'Die Stadt' },
    body: {
      it: [
        'Il centro di Lugano, con il lungolago, la Piazza della Riforma e le vie del centro storico, si raggiunge in una decina di minuti. Scuole, negozi e servizi del quartiere sono tra Castagnola e Cassarate.',
        'Dalla stazione FFS partono i treni per Bellinzona, Zurigo e Milano.',
      ],
      de: [
        'Das Zentrum von Lugano mit Seepromenade, Piazza della Riforma und den Gassen der Altstadt erreicht man in rund zehn Minuten. Schulen, Läden und Dienstleistungen des Quartiers liegen zwischen Castagnola und Cassarate.',
        'Ab dem Bahnhof SBB fahren Züge nach Bellinzona, Zürich und Mailand.',
      ],
    },
    photo: PHOTOS.oldTown,
  },
];
