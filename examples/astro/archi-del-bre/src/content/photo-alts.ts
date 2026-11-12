/**
 * Descriptive alt texts for the development's photos, in both languages,
 * keyed by the bucket file (Pexels).
 * The API's alt ("…, photo 2") is the fallback for any other photo.
 */
import type { L } from '../lib/routes';

const ALTS: Record<string, Record<L, string>> = {
  '26925316': { it: 'La palazzina sul pendio verde, con parapetti in vetro e giardino', de: 'Das Haus am grünen Hang, mit Glasbrüstungen und Garten' },
  '26925305': { it: 'Terrazza con salotto all’aperto e vista sul lago di Lugano', de: 'Terrasse mit Lounge und Blick auf den Luganersee' },
  '26925304': { it: 'Terrazza lunga con poltrona sospesa, lago e montagne', de: 'Lange Terrasse mit Hängesessel, See und Berge' },
  '26747981': { it: 'Grande terrazza dell’attico con ombrellone e vista sulle montagne', de: 'Grosse Attikaterrasse mit Sonnenschirm und Bergblick' },
  '26925314': { it: 'Soggiorno con pavimento in legno chiaro, cucina aperta e uscita sulla terrazza', de: 'Wohnraum mit hellem Holzboden, offener Küche und Ausgang zur Terrasse' },
  '26747979': { it: 'Soggiorno d’angolo con vetrate a tutta altezza e terrazza', de: 'Eckwohnraum mit raumhohen Fenstern und Terrasse' },
  '26925315': { it: 'Camera da letto con grande finestra sul balcone', de: 'Schlafzimmer mit grossem Fenster zum Balkon' },
  '26925302': { it: 'Dettaglio della terrazza: tavolo in legno, cuscini e lanterne', de: 'Detail der Terrasse: Holztisch, Kissen und Laternen' },
  '26925317': { it: 'Camera da letto in toni neutri con un quadro', de: 'Schlafzimmer in neutralen Tönen mit Bild' },
  '26747983': { it: 'Camera o studio con armadio bianco e pavimento in rovere', de: 'Zimmer oder Büro mit weissem Schrank und Eichenboden' },
  '26747982': { it: 'Terrazza dell’attico con tavolo da pranzo', de: 'Attikaterrasse mit Esstisch' },
  '26747984': { it: 'Camera con pavimento in rovere e parete vetrata', de: 'Zimmer mit Eichenboden und Glasfront' },
  '26747980': { it: 'Bagno con piastrelle effetto marmo e doccia a filo pavimento', de: 'Bad mit Platten in Marmoroptik und bodenebener Dusche' },
  '26925303': { it: 'Bagno luminoso con doccia', de: 'Helles Bad mit Dusche' },
};

export const photoAlt = (url: string, l: L, fallback: string) => ALTS[url.match(/pexels-(\d+)\./)?.[1] ?? '']?.[l] ?? fallback;
