/**
 * Numbers and labels in the page language. The kit's formatPrice / formatRooms
 * read the site's default locale only (a French page would say "/ Monat"):
 * these take the page language. Amounts and surfaces come from the kit
 * (`formatAmount`, `formatSurface`: CHF 1'250'000, 145 m²).
 *
 * Rooms follow the decimal sign of the page language, decided once for the
 * whole site: "4,5 Zimmer" and "4,5 pièces" as the data writes its titles,
 * "4.5 rooms" in English. Never rounded.
 */
import { formatAmount, formatSurface } from '@realadvisor/sites-kit/format';
import { propertyTypeLabel } from '@realadvisor/sites-kit/i18n';
import { LOCALE, type L } from './routes';

export { formatAmount, formatSurface };

const ON_REQUEST: Record<L, string> = { de: 'Preis auf Anfrage', fr: 'Prix sur demande', en: 'Price on request' };
const MONTH: Record<L, string> = { de: 'Monat', fr: 'mois', en: 'month' };
const SOLD: Record<L, string> = { de: 'Verkauft', fr: 'Vendu', en: 'Sold' };

type Priced = { price?: number; price_on_request?: boolean; offer_type: 'buy' | 'rent'; status?: string };

/** `CHF 2'350'000`, `CHF 4'200 / Monat`, "Preis auf Anfrage"; sold listings never show a price. */
export function price(x: Priced, l: L): string {
  if (x.status === 'sold') return SOLD[l];
  if (x.price_on_request || x.price == null || x.price <= 0) return ON_REQUEST[l];
  const a = formatAmount(x.price);
  return x.offer_type === 'rent' ? `${a} / ${MONTH[l]}` : a;
}
export const perMonth = (l: L) => `/ ${MONTH[l]}`;

/** 4.5 -> "4,5" (de, fr) or "4.5" (en). */
export const dec = (n: number, l: L) => (l === 'en' ? String(n) : String(n).replace('.', ','));

/** "4,5 Zimmer" / "4,5 pièces" / "4.5 rooms". */
export function rooms(n: number | undefined, l: L): string {
  if (n == null) return '';
  if (l === 'de') return `${dec(n, l)} Zimmer`;
  if (l === 'fr') return `${dec(n, l)} ${n <= 1 ? 'pièce' : 'pièces'}`;
  return `${dec(n, l)} ${n === 1 ? 'room' : 'rooms'}`;
}
/** "2,5 bis 4,5 Zimmer" with the unit once. */
export function roomsRange(r: { min: number; max: number } | undefined, l: L): string {
  if (!r) return '';
  if (r.min === r.max) return rooms(r.min, l);
  const to = { de: 'bis', fr: 'à', en: 'to' }[l];
  const unit = { de: 'Zimmer', fr: 'pièces', en: 'rooms' }[l];
  return `${dec(r.min, l)} ${to} ${dec(r.max, l)} ${unit}`;
}
export function bedrooms(n: number | undefined, l: L): string {
  if (n == null) return '';
  if (l === 'de') return `${n} Schlafzimmer`;
  if (l === 'fr') return `${n} ${n <= 1 ? 'chambre' : 'chambres'}`;
  return `${n} ${n === 1 ? 'bedroom' : 'bedrooms'}`;
}

/** "Erdgeschoss" / "3. Obergeschoss" / "Attika". */
export function floor(n: number | undefined, l: L, attic = false): string {
  if (n == null) return '';
  if (attic) return { de: 'Attika', fr: 'Attique', en: 'Penthouse floor' }[l];
  if (n === 0) return { de: 'Erdgeschoss', fr: 'Rez-de-chaussée', en: 'Ground floor' }[l];
  if (n < 0) return { de: `${-n}. Untergeschoss`, fr: `Sous-sol ${-n}`, en: `Basement ${-n}` }[l];
  if (l === 'de') return `${n}. Obergeschoss`;
  if (l === 'fr') return n === 1 ? '1er étage' : `${n}e étage`;
  return `${ordinal(n)} floor`;
}
/** Short form for tables: "EG" / "3. OG" / "Attika". */
export function floorShort(n: number | undefined, l: L, attic = false): string {
  if (n == null) return '';
  if (attic) return { de: 'Attika', fr: 'Attique', en: 'Penthouse' }[l];
  if (n === 0) return { de: 'EG', fr: 'Rez', en: 'Ground' }[l];
  if (l === 'de') return `${n}. OG`;
  if (l === 'fr') return n === 1 ? '1er' : `${n}e`;
  return ordinal(n);
}
const ordinal = (n: number) => `${n}${n % 10 === 1 && n % 100 !== 11 ? 'st' : n % 10 === 2 && n % 100 !== 12 ? 'nd' : n % 10 === 3 && n % 100 !== 13 ? 'rd' : 'th'}`;

const ORIENT: Record<string, Record<L, string>> = {
  N: { de: 'Nord', fr: 'Nord', en: 'North' },
  NE: { de: 'Nordost', fr: 'Nord-est', en: 'North-east' },
  E: { de: 'Ost', fr: 'Est', en: 'East' },
  SE: { de: 'Südost', fr: 'Sud-est', en: 'South-east' },
  S: { de: 'Süd', fr: 'Sud', en: 'South' },
  SW: { de: 'Südwest', fr: 'Sud-ouest', en: 'South-west' },
  W: { de: 'West', fr: 'Ouest', en: 'West' },
  NW: { de: 'Nordwest', fr: 'Nord-ouest', en: 'North-west' },
};
export const orientation = (code: string | undefined, l: L) => (code ? (ORIENT[code.toUpperCase()]?.[l] ?? '') : '');

export const typeLabel = (code: string, l: L) => propertyTypeLabel(code, LOCALE[l]);

export const monthYear = (iso: string | undefined, l: L) =>
  iso ? new Intl.DateTimeFormat(LOCALE[l], { month: 'long', year: 'numeric' }).format(new Date(iso)) : '';
export const dayMonthYear = (iso: string | undefined, l: L) =>
  iso ? new Intl.DateTimeFormat(LOCALE[l], { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso)) : '';

/** Plain integer with Swiss grouping (1'250). */
export const int = (n: number) => new Intl.NumberFormat('de-CH', { maximumFractionDigits: 0 }).format(n);

/** `tel:` target from a display phone. */
export const tel = (p: string) => `tel:${p.replace(/[^\d+]/g, '')}`;
