/**
 * Place content the API does not carry: photos of the region (RealAdvisor
 * image pool, plus one
 * Pexels photo of Lausanne, src/content/photo-credits.md) and the written
 * Situation text. Site copy, written for this example. Claims stay general
 * and checkable; the one distance is computed from the development's
 * (rounded) coordinates, as the crow flies, never a travel time.
 */
const pool = (id: string) => `https://storage.googleapis.com/img.realadvisor.ch/sites-demo-pexels-${id}.jpg`;

export type PlacePhoto = { url: string; alt: string; position?: string };

export const PLACES: { hero: { url: string; alt: string }; photos: PlacePhoto[] } = {
  hero: { url: pool('11556820'), alt: 'Les vignes en terrasses de Lavaux au-dessus du Léman' },
  photos: [
    { url: pool('4423511'), alt: 'Les vignes de Lavaux et le Léman au soleil couchant' },
    { url: pool('4423513'), alt: 'Le Léman et les Alpes depuis les vignes de Lavaux' },
    { url: pool('6318902'), alt: 'Les toits de Lausanne, le Léman et les Alpes au crépuscule', position: '72% 100%' },
  ],
};

/** Straight-line distance in km between two points (haversine). */
export function crowKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const r = (d: number) => (d * Math.PI) / 180;
  const h = Math.sin(r(b.lat - a.lat) / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(r(b.lng - a.lng) / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

/** Lausanne railway station (public coordinates). */
export const LAUSANNE_STATION = { lat: 46.5168, lng: 6.6291 };

export type PlaceSection = { id: string; eyebrow: string; title: string; body: string[] };

export const sections = (dev: { lat?: number | null; lng?: number | null }): PlaceSection[] => {
  const km = dev.lat != null && dev.lng != null ? crowKm({ lat: dev.lat, lng: dev.lng }, LAUSANNE_STATION) : null;
  const toLausanne = km != null ? `La gare de Lausanne est à environ ${String(Math.round(km * 2) / 2).replace('.', ',')} km à vol d’oiseau.` : '';
  return [
    {
      id: 'lavaux',
      eyebrow: 'Lavaux',
      title: 'Le vignoble de Lavaux',
      body: [
        'Lutry est la première commune du vignoble de Lavaux en venant de Lausanne, un paysage de terrasses inscrit au patrimoine mondial de l’UNESCO. Murs de pierre et parchets descendent jusqu’au lac, traversés de chemins pédestres.',
        'Depuis le projet, le bourg médiéval se rejoint à pied.',
      ],
    },
    {
      id: 'lac',
      eyebrow: 'Le lac',
      title: 'Le lac',
      body: [
        'Depuis le coteau, la vue s’ouvre sur le Léman et, sur l’autre rive, les Alpes de Savoie.',
        'Lutry a un port et une plage publique ; les bateaux de la CGN y font escale.',
      ],
    },
    {
      id: 'transports',
      eyebrow: 'Transports',
      title: 'Transports',
      body: [
        `La gare de Lutry est sur la ligne CFF qui longe le lac entre Lausanne et Vevey. ${toLausanne}`.trim(),
        'Des lignes de bus desservent la commune. Par la route, l’autoroute A9 passe au nord du projet. Chaque appartement dispose de deux places de parc.',
      ],
    },
    {
      id: 'ecoles',
      eyebrow: 'Écoles et quotidien',
      title: 'Écoles et commerces',
      body: [
        'La commune a ses propres écoles primaires et secondaires. L’Université de Lausanne et l’EPFL se rejoignent en transports publics.',
        'Les commerces de proximité sont dans le bourg.',
      ],
    },
  ];
};
