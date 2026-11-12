/**
 * The neighbourhood page: places near the development, written for this site
 * (not API data). Coordinates are public landmarks; distances on the page are
 * computed from them and the development's (rounded) coordinates, straight
 * line, never typed in. Photos: src/content/photo-credits.md.
 */
const B = 'https://storage.googleapis.com/img.realadvisor.ch/sites-demo-pexels-';

export type Place = {
  id: string;
  lat: number;
  lng: number;
  photo?: string;
  name: { es: string; en: string };
  text: { es: string; en: string };
  alt?: { es: string; en: string };
};

export const PLACES: Place[] = [
  {
    id: 'mercat',
    lat: 39.4622,
    lng: -0.3727,
    photo: `${B}8559246.jpg`,
    name: { es: 'Mercado de Russafa', en: 'Russafa market' },
    text: {
      es: 'El mercado del barrio, de lunes a sábado por la mañana. Fruta de la huerta, pescado del puerto y bares en los bajos de alrededor.',
      en: 'The neighbourhood market, Monday to Saturday mornings. Produce from the huerta, fish from the port and bars in the streets around it.',
    },
    alt: { es: 'Fachada del Mercado de Russafa con una farola', en: 'Russafa market façade with a street lamp' },
  },
  {
    id: 'nord',
    lat: 39.4659,
    lng: -0.3772,
    name: { es: 'Estació del Nord', en: 'Estació del Nord' },
    text: {
      es: 'Trenes de cercanías y regionales; la estación Joaquín Sorolla, con el AVE a Madrid y Barcelona, está a continuación.',
      en: 'Commuter and regional trains; Joaquín Sorolla station, with high-speed trains to Madrid and Barcelona, is just beyond it.',
    },
  },
  {
    id: 'central',
    lat: 39.459,
    lng: -0.3795,
    name: { es: 'Parque Central', en: 'Parque Central' },
    text: {
      es: 'El parque nuevo sobre las antiguas vías, con zonas de juego y naves del siglo XIX rehabilitadas.',
      en: 'The new park on the former railway land, with playgrounds and restored nineteenth-century sheds.',
    },
  },
  {
    id: 'ayuntamiento',
    lat: 39.4699,
    lng: -0.3763,
    name: { es: 'Plaza del Ayuntamiento', en: 'Plaza del Ayuntamiento' },
    text: {
      es: 'El centro de la ciudad: metro, autobuses y la calle Colón.',
      en: 'The city centre: metro, buses and the shops of Calle Colón.',
    },
  },
  {
    id: 'carmen',
    lat: 39.4763,
    lng: -0.3752,
    photo: `${B}21287083.jpg`,
    name: { es: 'El Carmen y la Plaza de la Virgen', en: 'El Carmen and Plaza de la Virgen' },
    text: {
      es: 'El casco antiguo, la catedral y la basílica de los Desamparados.',
      en: 'The old town, the cathedral and the Basílica de los Desamparados.',
    },
    alt: { es: 'Calle de El Carmen hacia la basílica de los Desamparados', en: 'Street in El Carmen towards the Basílica de los Desamparados' },
  },
  {
    id: 'turia',
    lat: 39.4627,
    lng: -0.3605,
    photo: `${B}34815911.jpg`,
    name: { es: 'Jardín del Turia', en: 'Turia gardens' },
    text: {
      es: 'El antiguo cauce del río, nueve kilómetros de parque con carril bici hasta el mar.',
      en: 'The old riverbed: nine kilometres of park with a cycle path down to the sea.',
    },
    alt: { es: 'Estanque y pérgola en el jardín del Turia', en: 'Pond and pergola in the Turia gardens' },
  },
  {
    id: 'cac',
    lat: 39.4549,
    lng: -0.3507,
    photo: `${B}6237137.jpg`,
    name: { es: 'Ciutat de les Arts i les Ciències', en: 'City of Arts and Sciences' },
    text: {
      es: 'El Hemisfèric, el museo de las ciencias y el Palau de les Arts, al final del Turia.',
      en: 'The Hemisfèric, the science museum and the opera house at the end of the Turia.',
    },
    alt: { es: 'El Hemisfèric reflejado en el estanque al anochecer', en: 'The Hemisfèric reflected in the pool at dusk' },
  },
  {
    id: 'playa',
    lat: 39.479,
    lng: -0.324,
    photo: `${B}21982747.jpg`,
    name: { es: 'Playa de la Malvarrosa', en: 'Malvarrosa beach' },
    text: {
      es: 'La playa de la ciudad, con el paseo marítimo y los restaurantes de arroz.',
      en: 'The city beach, with its promenade and rice restaurants.',
    },
    alt: { es: 'Playa de la Malvarrosa con palmeras y restaurantes', en: 'Malvarrosa beach with palm trees and restaurants' },
  },
];

/** Aerial of the Turia park and the City of Arts and Sciences, for the page head. */
export const AERIAL = `${B}11223103.jpg`;

/** Straight-line distance in km between two points (haversine). */
export function km(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const r = (d: number) => (d * Math.PI) / 180;
  const dLat = r(b.lat - a.lat);
  const dLng = r(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
