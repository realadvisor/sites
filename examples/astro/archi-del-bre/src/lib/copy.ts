/**
 * Site copy in Italian and German (the kit's i18n carries only the kit
 * parts' own strings). Written for this example; no claims beyond the data.
 */
import type { L } from './routes';

const C = {
  skip: { it: 'Vai al contenuto', de: 'Zum Inhalt' },
  menu: { it: 'Menu', de: 'Menü' },
  close: { it: 'Chiudi', de: 'Schliessen' },
  mainNav: { it: 'Navigazione principale', de: 'Hauptnavigation' },
  quick: { it: 'Azioni rapide', de: 'Schnellzugriff' },
  units: { it: 'Appartamenti', de: 'Wohnungen' },
  location: { it: 'Posizione', de: 'Lage' },
  gallery: { it: 'Galleria', de: 'Galerie' },
  documents: { it: 'Documenti', de: 'Dokumente' },
  contact: { it: 'Contatti', de: 'Kontakt' },
  brochure: { it: 'Brochure', de: 'Broschüre' },
  brochurePdf: { it: 'Scarica la brochure (PDF)', de: 'Broschüre herunterladen (PDF)' },
  writeUs: { it: 'Richiedi informazioni', de: 'Informationen anfordern' },
  language: { it: 'Lingua', de: 'Sprache' },
  favourites: { it: 'Preferiti', de: 'Merkliste' },
  addFav: { it: 'Aggiungi ai preferiti', de: 'Auf die Merkliste' },
  removeFav: { it: 'Togli dai preferiti', de: 'Von der Merkliste nehmen' },
  favFull: { it: 'Al massimo 3 preferiti', de: 'Höchstens 3 Wohnungen' },
  compare: { it: 'Confronta', de: 'Vergleichen' },
  clear: { it: 'Svuota', de: 'Leeren' },
  available: { it: 'disponibili', de: 'verfügbar' },
  of: { it: 'di', de: 'von' },
  from: { it: 'da', de: 'ab' },
  delivery: { it: 'Consegna', de: 'Bezug' },
  deliveryPlanned: { it: 'Consegna prevista', de: 'Bezug geplant' },
  livingArea: { it: 'Superficie abitabile', de: 'Wohnfläche' },
  outdoor: { it: 'Esterno', de: 'Aussen' },
  floor: { it: 'Piano', de: 'Etage' },
  house: { it: 'Casa', de: 'Haus' },
  rooms: { it: 'Locali', de: 'Zimmer' },
  price: { it: 'Prezzo', de: 'Preis' },
  status: { it: 'Stato', de: 'Status' },
  unitNo: { it: 'N.', de: 'Nr.' },
  bedrooms: { it: 'Camere', de: 'Schlafzimmer' },
  bathrooms: { it: 'Bagni', de: 'Bäder' },
  orientation: { it: 'Orientamento', de: 'Ausrichtung' },
  all: { it: 'Tutti', de: 'Alle' },
  allF: { it: 'Tutte', de: 'Alle' },
  onlyAvailable: { it: 'Solo disponibili', de: 'Nur verfügbare' },
  maxPrice: { it: 'Prezzo massimo', de: 'Preis bis' },
  filter: { it: 'Filtra', de: 'Filtern' },
  reset: { it: 'Azzera i filtri', de: 'Filter zurücksetzen' },
  penthouse: { it: 'Attico', de: 'Attika' },
  indicativePlan: { it: 'Pianta indicativa, non vincolante', de: 'Indikativer Grundriss, unverbindlich' },
  legend: { it: 'Legenda', de: 'Legende' },
  developer: { it: 'Committente', de: 'Bauherrschaft' },
  architect: { it: 'Architettura', de: 'Architektur' },
  contractor: { it: 'Impresa generale', de: 'Generalunternehmung' },
  salesOffice: { it: 'Ufficio vendite', de: 'Verkaufsbüro' },
  languages: { it: 'Lingue', de: 'Sprachen' },
  phone: { it: 'Telefono', de: 'Telefon' },
  email: { it: 'E-mail', de: 'E-Mail' },
  openMap: { it: 'Apri la mappa', de: 'Karte öffnen' },
  mapContrib: { it: 'contributori OpenStreetMap', de: 'OpenStreetMap-Mitwirkende' },
  map: { it: 'Mappa', de: 'Karte' },
  photo: { it: 'foto', de: 'Foto' },
  prev: { it: 'Precedente', de: 'Vorheriges' },
  next: { it: 'Successivo', de: 'Nächstes' },
  allPhotos: { it: 'Tutte le foto', de: 'Alle Fotos' },
  site: { it: 'Cantiere', de: 'Baustelle' },
} as const;

export type CopyKey = keyof typeof C;
export const c = (key: CopyKey, l: L): string => C[key][l];

const LANG_NAMES: Record<L, Record<string, string>> = {
  it: { it: 'italiano', de: 'tedesco', en: 'inglese', fr: 'francese', es: 'spagnolo' },
  de: { it: 'Italienisch', de: 'Deutsch', en: 'Englisch', fr: 'Französisch', es: 'Spanisch' },
};
/** "italiano, inglese" from ISO codes. */
export const languageNames = (codes: string[] | undefined, l: L) =>
  (codes ?? []).map((x) => LANG_NAMES[l][x] ?? x.toUpperCase()).join(', ');
