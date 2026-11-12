/**
 * Site content, not API data: place photos for offices and area pages, from
 * the RealAdvisor image pool,
 * and the short area introductions written for this site. A city without
 * an entry gets its region's photo and no introduction.
 */
import type { L } from '../lib/routes';
import { slugify } from '../lib/routes';
import { img } from '@realadvisor/sites-kit-core/image';

const P = (id: string) => `https://storage.googleapis.com/img.realadvisor.ch/sites-demo-pexels-${id}.jpg`;

/**
 * A pool photo URL, or a pool photo that needs its own framing: `position` is
 * the CSS object-position of the box crop, `mobile` the crop for screens under
 * 768px as [left, top, width, height] fractions of the original (imgproxy
 * `crop`), so a portrait hero shows the town, not the sky.
 */
export type Framed = { url: string; position: string; mobile: [number, number, number, number] };
export type Place = { photo: string | Framed; alt: { fr: string; de: string }; intro?: { fr: string; de: string } };

/** Office photos by the office's city. */
export const OFFICE_PHOTOS: Record<string, Place> = {
  geneve: { photo: P('17190957'), alt: { fr: 'Le jet d’eau et la rade de Genève', de: 'Der Jet d’eau und die Genfer Bucht' } },
  lausanne: { photo: P('12956558'), alt: { fr: 'Les vignes en terrasses de Lavaux au-dessus du Léman', de: 'Die Weinbergterrassen des Lavaux über dem Genfersee' } },
  zurich: { photo: P('36972128'), alt: { fr: 'La Limmat et le Fraumünster à Zurich', de: 'Die Limmat und das Fraumünster in Zürich' } },
};

/** About page photo. */
export const ABOUT_PHOTO: Place = { photo: P('11277767'), alt: { fr: 'Genève et le Léman vus du ciel', de: 'Genf und der Genfersee aus der Luft' } };

/** Area pages by city slug. */
export const AREAS: Record<string, Place> = {
  geneve: {
    photo: P('11277773'),
    alt: { fr: 'Vue aérienne de la rade de Genève', de: 'Luftbild der Genfer Bucht' },
    intro: {
      fr: 'De la Vieille-Ville à Champel, des Eaux-Vives aux quais de la rive droite, Genève offre des appartements bourgeois, des attiques avec vue sur la rade et quelques maisons rares en ville.',
      de: 'Von der Altstadt bis Champel, von Eaux-Vives bis zu den Quais am rechten Ufer: Genf bietet grossbürgerliche Wohnungen, Attikas mit Blick auf die Bucht und einige seltene Stadthäuser.',
    },
  },
  lausanne: {
    photo: { url: P('6318902'), position: '50% 95%', mobile: [0.25, 0.4, 0.5, 0.6] },
    alt: { fr: 'Les toits de Lausanne, le Léman et les Alpes au coucher du soleil', de: 'Die Dächer von Lausanne, der Genfersee und die Alpen bei Sonnenuntergang' },
    intro: {
      fr: 'Entre Ouchy au bord du lac et les quartiers sous-gare, Lausanne se vit en pente : appartements lumineux, vues sur les Alpes de Savoie et transports publics jusqu’aux hauts de la ville.',
      de: 'Zwischen Ouchy am See und den Quartieren unterhalb des Bahnhofs lebt Lausanne am Hang: helle Wohnungen, Blick auf die Savoyer Alpen und öffentlicher Verkehr bis in die oberen Stadtteile.',
    },
  },
  pully: {
    photo: { url: P('28233033'), position: '40% 85%', mobile: [0.2, 0.42, 0.55, 0.58] },
    alt: { fr: 'Toits de tuiles, port de plaisance et Léman à l’est de Lausanne', de: 'Ziegeldächer, Jachthafen und Genfersee östlich von Lausanne' },
    intro: {
      fr: 'Pully est une commune résidentielle juste à l’est de Lausanne, entre les rives du Léman et les premières vignes de Lavaux.',
      de: 'Pully ist eine Wohngemeinde direkt östlich von Lausanne, zwischen dem Seeufer und den ersten Reben des Lavaux.',
    },
  },
  zurich: {
    photo: P('36972127'),
    alt: { fr: 'Les quais de la Limmat et Saint-Pierre à Zurich', de: 'Die Limmatquais und St. Peter in Zürich' },
    intro: {
      fr: 'De l’Enge au Kreis 5, de Wiedikon aux rives du lac, Zurich réunit appartements de ville, lofts dans d’anciens ateliers et attiques avec terrasse.',
      de: 'Von der Enge bis zum Kreis 5, von Wiedikon bis an den See: Zürich vereint Stadtwohnungen, Lofts in ehemaligen Werkstätten und Attikas mit Terrasse.',
    },
  },
};

const REGION_FALLBACK: Record<string, string> = { geneve: 'geneve', lausanne: 'lausanne', zurich: 'zurich' };

/** The photo for an area page, else its office's city photo. */
export function areaPlace(city: string, officeCity: string | undefined): Place | undefined {
  const own = AREAS[slugify(city)];
  if (own) return own;
  const office = officeCity ? REGION_FALLBACK[slugify(officeCity)] : undefined;
  return office ? { ...OFFICE_PHOTOS[office]!, intro: undefined } : undefined;
}

export const officePlace = (city: string | undefined) => (city ? OFFICE_PHOTOS[slugify(city)] : undefined);

/** Open Graph image URL for a place photo. */
export const placeOg = (p: Place, _site?: URL | undefined) =>
  img(typeof p.photo === 'string' ? p.photo : p.photo.url, { w: 1200, h: 630 });

export const placeAlt = (p: Place, l: L) => p.alt[l];
