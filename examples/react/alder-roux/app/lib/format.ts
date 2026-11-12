/**
 * Numbers in the page language. The kit's formatPrice / formatRooms read the
 * site's default locale only, so a German page would say "/ mois": these take
 * the page language. Amounts and surfaces still come from the kit
 * (`formatAmount`, `formatSurface`: CHF 1'250'000, 145 m²).
 */
import { formatAmount, formatSurface } from '@realadvisor/sites-kit/format';
import { propertyTypeLabel } from '@realadvisor/sites-kit/i18n';
import type { L } from './routes';
import { LOCALE } from './routes';

export { formatAmount, formatSurface };

const ON_REQUEST = { fr: 'Prix sur demande', de: 'Preis auf Anfrage' };
const MONTH = { fr: 'mois', de: 'Monat' };
const SOLD = { fr: 'Vendu', de: 'Verkauft' };

type Priced = { price?: number; price_on_request?: boolean; offer_type: 'buy' | 'rent'; status?: string };

/** `CHF 2'350'000`, `CHF 4'200 / mois`, "Prix sur demande"; sold listings never show a price. */
export function price(x: Priced, l: L): string {
  if (x.status === 'sold') return SOLD[l];
  if (x.price_on_request || x.price == null || x.price <= 0) return ON_REQUEST[l];
  const a = formatAmount(x.price);
  return x.offer_type === 'rent' ? `${a} / ${MONTH[l]}` : a;
}

/** `4.5 pièces` / `4.5 Zimmer`: a dot, never rounded. */
export function rooms(n: number | undefined, l: L): string {
  if (n == null) return '';
  return l === 'de' ? `${n} Zimmer` : `${n} ${n <= 1 ? 'pièce' : 'pièces'}`;
}
export function bedrooms(n: number | undefined, l: L): string {
  if (n == null) return '';
  return l === 'de' ? `${n} ${n === 1 ? 'Schlafzimmer' : 'Schlafzimmer'}` : `${n} ${n <= 1 ? 'chambre' : 'chambres'}`;
}
export function bathrooms(n: number | undefined, l: L): string {
  if (n == null) return '';
  return l === 'de' ? `${n} ${n === 1 ? 'Bad' : 'Bäder'}` : `${n} ${n <= 1 ? 'salle d’eau' : 'salles d’eau'}`;
}

/** "Rez" / "2e étage" / "EG" / "2. OG". */
export function floor(n: number | undefined, l: L): string {
  if (n == null) return '';
  if (n === 0) return l === 'de' ? 'Erdgeschoss' : 'Rez-de-chaussée';
  if (n < 0) return l === 'de' ? `${-n}. UG` : `Sous-sol ${-n}`;
  return l === 'de' ? `${n}. Obergeschoss` : n === 1 ? '1er étage' : `${n}e étage`;
}
export function floorShort(n: number | undefined, l: L): string {
  if (n == null) return '';
  if (n === 0) return l === 'de' ? 'EG' : 'Rez';
  return l === 'de' ? `${n}. OG` : n === 1 ? '1er' : `${n}e`;
}

const ORIENT: Record<string, { fr: string; de: string }> = {
  N: { fr: 'Nord', de: 'Nord' },
  NE: { fr: 'Nord-est', de: 'Nordost' },
  E: { fr: 'Est', de: 'Ost' },
  SE: { fr: 'Sud-est', de: 'Südost' },
  S: { fr: 'Sud', de: 'Süd' },
  SW: { fr: 'Sud-ouest', de: 'Südwest' },
  W: { fr: 'Ouest', de: 'West' },
  NW: { fr: 'Nord-ouest', de: 'Nordwest' },
};
export const orientation = (code: string | undefined, l: L) => (code ? (ORIENT[code.toUpperCase()]?.[l] ?? '') : '');

export const typeLabel = (code: string, l: L) => propertyTypeLabel(code, LOCALE[l]);

export const monthYear = (iso: string | undefined, l: L) =>
  iso ? new Intl.DateTimeFormat(LOCALE[l], { month: 'long', year: 'numeric' }).format(new Date(iso)) : '';

/** Plain integer with Swiss grouping (1'250). */
export const int = (n: number) => new Intl.NumberFormat('de-CH', { maximumFractionDigits: 0 }).format(n);

/** "4 – 6" or "4" for a min/max range. */
export const range = (r: { min: number; max: number } | undefined, f: (n: number) => string) =>
  r ? (r.min === r.max ? f(r.min) : `${f(r.min)} – ${f(r.max)}`) : '';

/** "3 – 6 Zimmer" / "3 à 6 pièces": the unit once. */
export const roomsRange = (r: { min: number; max: number } | undefined, l: L) =>
  !r ? '' : r.min === r.max ? rooms(r.min, l) : l === 'de' ? `${r.min} – ${r.max} Zimmer` : `${r.min} à ${r.max} pièces`;

/** `tel:` target from a display phone. */
export const tel = (p: string) => `tel:${p.replace(/[^\d+]/g, '')}`;

/** Initials for the agent monogram. */
export const initials = (first: string, last: string) => `${first.trim().charAt(0)}${last.trim().charAt(0)}`.toUpperCase();
