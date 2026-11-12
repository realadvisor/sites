/**
 * Photos of places (districts, Milan streets, Lake Como) from the RealAdvisor
 * bucket (app/data/places.json), with alt texts in both languages. Rendered
 * through RaImage like every other photo.
 */
import places from '../data/places.json';
import type { Lang } from './i18n';

export type PlaceKey = keyof typeof places.places;
export type PlacePhoto = { url: string; alt: string };

// What each photo shows (from the fixture's photo notes), keyed by its Pexels id.
const ALT: Record<string, { it: string; en: string }> = {
  '32953088': { it: 'Palazzi storici a Milano', en: 'Historic apartment buildings in Milan' },
  '15437517': { it: 'Facciata ocra con persiane a Milano', en: 'Ochre facade with shutters in Milan' },
  '17366888': { it: 'Balconi Liberty con edera a Milano', en: 'Liberty balconies with ivy in Milan' },
  '33091784': { it: 'Facciata gialla con balconi a Milano', en: 'Yellow facade with balconies in Milan' },
  '36407545': { it: 'Palazzi d’angolo nel centro di Milano', en: 'Historic corner buildings in central Milan' },
  '28295552': { it: 'Condominio anni Cinquanta con balconi a Milano', en: '1950s apartment block with balconies in Milan' },
  '16142575': { it: 'Palazzo rosso in Brera', en: 'Red apartment building in Brera' },
  '17355546': { it: 'Cortile del Palazzo di Brera', en: 'Courtyard of the Palazzo di Brera' },
  '16142560': { it: 'Una via stretta di Brera', en: 'A narrow street in Brera' },
  '34415561': { it: 'Il Naviglio Grande al tramonto', en: 'The Naviglio Grande at dusk' },
  '35619151': { it: 'Il Naviglio Grande al calar del sole', en: 'The Naviglio Grande at sunset' },
  '34504989': { it: 'Il canale dei Navigli', en: 'The Navigli canal' },
  '29841152': { it: 'Case sul Naviglio Grande', en: 'Houses on the Naviglio Grande' },
  '37241087': { it: 'L’alzaia del Naviglio', en: 'The towpath along the Naviglio' },
  '36372239': { it: 'Una via dei Navigli', en: 'A street in the Navigli' },
  '36614157': { it: 'Il Bosco Verticale e l’Isola dall’alto', en: 'Bosco Verticale and Isola from above' },
  '36871171': { it: 'Lo skyline di Porta Nuova sopra l’Isola', en: 'The Porta Nuova skyline over Isola' },
  '37132656': { it: 'Le torri residenziali di Porta Nuova', en: 'Residential towers at Porta Nuova' },
  '20412791': { it: 'Villa Erba a Cernobbio', en: 'Villa Erba, Cernobbio' },
  '19085371': { it: 'Il campanile di Cernobbio visto dal lago', en: 'Cernobbio bell tower seen from the lake' },
  '38303147': { it: 'Un porticciolo sul Lago di Como', en: 'A marina on Lake Como' },
  '38303164': { it: 'Barche sulla riva del Lago di Como', en: 'Boats on the shore of Lake Como' },
  '19749514': { it: 'Il lungolago di Bellagio', en: 'The Bellagio waterfront' },
  '37736425': { it: 'La riva di Bellagio', en: 'The Bellagio shoreline' },
  '29968304': { it: 'Il Lago di Como visto da Bellagio', en: 'Lake Como seen from Bellagio' },
  '14875484': { it: 'Bellagio vista dal lago', en: 'Bellagio seen from the lake' },
  '36585422': { it: 'Vista da un balcone di Bellagio al tramonto', en: 'View from a balcony in Bellagio at sunset' },
  '38856373': { it: 'La passeggiata a lago di Bellagio', en: 'The lakefront promenade in Bellagio' },
};

const idOf = (url: string) => url.match(/pexels-(\d+)/)?.[1] ?? '';

export function placePhotos(key: PlaceKey | undefined, lang: Lang): PlacePhoto[] {
  if (!key) return [];
  return (places.places[key] ?? []).map((url) => ({ url, alt: ALT[idOf(url)]?.[lang] ?? '' })).filter((p) => p.alt);
}
export const placePhoto = (key: PlaceKey, lang: Lang, i = 0): PlacePhoto | undefined => placePhotos(key, lang)[i];
export const isPlaceKey = (k: string): k is PlaceKey => k in places.places;
