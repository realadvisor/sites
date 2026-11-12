/**
 * Site content per programme, written by the site (the API does not carry it):
 * art direction (which photo leads), the
 * neighbourhood text and a few landmarks for straight-line distances.
 * Keyed by development slug. A programme the API adds later and that is not
 * here still gets every page, with its first photo and no neighbourhood text.
 * Everything here is fictional, like the developer.
 */
import places from './places.json';

export type Landmark = { name: string; lat: number; lng: number };
export type ProgrammeContent = {
  /** Index in `development.photos` of the hero photo. */
  hero?: number;
  /** Key in places.json for the location photos. */
  place?: 'annecy' | 'lyon';
  /** Index in that place's photos of the lead photo (two programmes share Lyon). */
  placeLead?: number;
  placeName?: string;
  /** Town the place photos show, when it is not the programme's own (Écully → Lyon). */
  placePhotosOf?: string;
  /** Neighbourhood text (Situation page), one string per paragraph. */
  situation?: string[];
  landmarks?: Landmark[];
};

export const PROGRAMME_CONTENT: Record<string, ProgrammeContent> = {
  'les-balcons-du-semnoz': {
    hero: 1,
    place: 'annecy',
    placeName: 'Annecy',
    situation: [
      'La résidence s’installe sur les premières pentes du Semnoz, au sud-ouest d’Annecy : assez haut pour ouvrir les balcons sur le lac et les montagnes, assez près pour descendre en ville à vélo.',
      'Le centre ancien, ses canaux et le Pâquier sont à quelques minutes. Les sentiers du Semnoz partent presque du pied de l’immeuble, et le lac reste le grand jardin de tous les habitants, été comme hiver.',
    ],
    landmarks: [
      { name: 'Gare d’Annecy', lat: 45.9017, lng: 6.1219 },
      { name: 'Vieille ville, Palais de l’Isle', lat: 45.8986, lng: 6.128 },
      { name: 'Le Pâquier, bord du lac', lat: 45.9006, lng: 6.1335 },
    ],
  },
  'quai-des-tanneurs': {
    hero: 3,
    place: 'lyon',
    placeName: 'Lyon',
    situation: [
      'Gerland, au sud du 7e arrondissement, est un quartier qui s’est réinventé autour du fleuve : berges aménagées, grands parcs et vie de quartier, à quelques stations du cœur de Lyon.',
      'Depuis Quai des Tanneurs, on rejoint le parc de Gerland à pied et la presqu’île en métro. Les loggias regardent le Rhône et les couchers de soleil sur la colline de Fourvière.',
    ],
    landmarks: [
      { name: 'Parc de Gerland', lat: 45.729, lng: 4.832 },
      { name: 'Place Bellecour', lat: 45.7578, lng: 4.832 },
      { name: 'Gare de Lyon Part-Dieu', lat: 45.7606, lng: 4.8594 },
    ],
  },
  'le-clos-des-tilleuls': {
    hero: 0,
    place: 'lyon',
    placeLead: 2,
    placePhotosOf: 'Lyon',
    placeName: 'Écully, aux portes de Lyon',
    situation: [
      'Écully, à l’ouest de Lyon, garde l’allure d’une petite ville verte : grandes propriétés, parcs et écoles, avec le centre de Lyon à une vingtaine de minutes.',
      'Le Clos des Tilleuls est niché dans un parc arboré, à l’écart des grands axes. Le centre du village, ses commerces et le marché se rejoignent à pied.',
    ],
    landmarks: [
      { name: 'Centre d’Écully', lat: 45.7745, lng: 4.7775 },
      { name: 'Gare de Lyon-Vaise', lat: 45.7806, lng: 4.8044 },
      { name: 'Place Bellecour', lat: 45.7578, lng: 4.832 },
    ],
  },
};

export const contentFor = (slug: string): ProgrammeContent => PROGRAMME_CONTENT[slug] ?? {};

/** Place photos of a programme's town (generic image pool). */
export const placePhotos = (c: ProgrammeContent): string[] => {
  const all = c.place ? (((places as Record<string, unknown>)[c.place] as string[]) ?? []) : [];
  const k = c.placeLead ?? 0;
  return [...all.slice(k), ...all.slice(0, k)];
};

/** Straight-line distance in km, from the programme's (rounded) coordinates. */
export function crowFlies(a: { lat?: number; lng?: number }, b: Landmark): number | null {
  if (a.lat == null || a.lng == null) return null;
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * Home hero (art direction): a site photo (Pexels, src/content/photo-credits.md),
 * a contemporary house lit at dusk. It illustrates the developer's work in
 * general, not one programme. The share image stays the first programme's hero.
 */
export const HOME_HERO = {
  local: { name: 'maison-crepuscule', position: '38% 60%' },
  alt: 'Maison contemporaine en briques et verre, éclairée au crépuscule',
} as const;
