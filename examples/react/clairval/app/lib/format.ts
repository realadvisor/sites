/**
 * Numbers in the page language and in the listing's own currency.
 * Kit gap: the kit's formatAmount / formatPrice format every amount in the
 * site country's currency (a Saint-Tropez villa in EUR would read "CHF"), and
 * read the site's default locale only. These take the currency and the page
 * language: CHF keeps the Swiss form (CHF 1'250'000) in both languages, EUR
 * reads €1,250,000 in English and 1 250 000 € in French.
 */
import { formatSurface } from '@realadvisor/sites-kit-core/format';
import { propertyTypeLabel } from '@realadvisor/sites-kit-core/i18n';
import type { L } from './routes';
import { LOCALE } from './routes';

export { formatSurface };

const ON_REQUEST = { en: 'Price on request', fr: 'Prix sur demande' };
const MONTH = { en: 'month', fr: 'mois' };
const SOLD = { en: 'Sold', fr: 'Vendu' };

/** One amount in its currency, never cents, never wrapping. */
export function money(n: number, currency: string, l: L): string {
  if (currency === 'CHF') return `CHF ${new Intl.NumberFormat('de-CH', { maximumFractionDigits: 0 }).format(n)}`;
  const s = new Intl.NumberFormat(l === 'fr' ? 'fr-FR' : 'en-GB', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(n);
  return s.replace(/\s/g, ' ');
}

type Priced = { price?: number; price_on_request?: boolean; offer_type: 'buy' | 'rent'; status?: string; currency: string };

/** Listing price with rent period; "on request" only when the data has no price; sold listings show none. */
export function price(x: Priced, l: L): string {
  if (x.status === 'sold') return SOLD[l];
  if (x.price_on_request || x.price == null || x.price <= 0) return ON_REQUEST[l];
  const a = money(x.price, x.currency, l);
  return x.offer_type === 'rent' ? `${a} / ${MONTH[l]}` : a;
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
export const bedrooms = (n: number | undefined, l: L) =>
  n == null ? '' : l === 'fr' ? plural(n, 'chambre', 'chambres') : plural(n, 'bedroom', 'bedrooms');
export const bathrooms = (n: number | undefined, l: L) =>
  n == null ? '' : l === 'fr' ? plural(n, 'salle de bains', 'salles de bains') : plural(n, 'bathroom', 'bathrooms');
/** Swiss room count with a dot: `4.5 rooms` / `4.5 pièces`. */
export const rooms = (n: number | undefined, l: L) =>
  n == null ? '' : l === 'fr' ? `${n} ${n <= 1 ? 'pièce' : 'pièces'}` : `${n} ${n === 1 ? 'room' : 'rooms'}`;

export const typeLabel = (code: string, l: L) => propertyTypeLabel(code, LOCALE[l]);

export const dateLong = (iso: string, l: L) =>
  new Intl.DateTimeFormat(l === 'fr' ? 'fr-CH' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso));

/** `tel:` target from a display phone. */
export const tel = (p: string) => `tel:${p.replace(/[^\d+]/g, '')}`;

/** "€3,400,000 – €19,500,000" or one amount. */
export const moneyRange = (min: number, max: number, currency: string, l: L) =>
  min === max ? money(min, currency, l) : `${money(min, currency, l)} – ${money(max, currency, l)}`;
