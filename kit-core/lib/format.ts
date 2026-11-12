/**
 * Number, price and URL helpers. Rules match DESIGN.md section 5.
 * COUNTRY and LOCALE come from the site's site.json (`country`, `locale`).
 */
import site from 'virtual:sites-kit/site';
import type { Listing } from '@realadvisor/sites-sdk/types';

export type { Country } from '../site-config.mjs';
export const COUNTRY = site.country;
/** Site language: fr-CH, de-CH, it-CH, fr-FR, es-ES or it-IT (site.json `locale`). */
export const LOCALE = site.locale;

const lang = () => LOCALE.slice(0, 2) as 'fr' | 'de' | 'it' | 'es' | 'en';
const T = {
  onRequest: { fr: 'Prix sur demande', de: 'Preis auf Anfrage', it: 'Prezzo su richiesta', es: 'Precio a consultar', en: 'Price on request' },
  month: { fr: 'mois', de: 'Monat', it: 'mese', es: 'mes', en: 'month' },
};

/** How to write an amount: the listing's currency, the page language (words, and the number form of a foreign currency). */
export type AmountOptions = {
  /** ISO code (`listing.currency`). Default: the country's (CHF in CH, else EUR). */
  currency?: string | null;
  /** Page locale (`fr-CH`, `en-IT`). Default: the site's LOCALE. */
  locale?: string;
  country?: typeof COUNTRY;
};

const ownCurrency = (country: typeof COUNTRY) => (country === 'CH' ? 'CHF' : 'EUR');
/** Number form of a currency that is not the country's: the page language's home form (en: en-GB). */
const foreignLocale = (locale: string) => {
  const l = locale.slice(0, 2);
  return l === 'en' ? 'en-GB' : `${l}-${l.toUpperCase()}`;
};

/**
 * `CHF 1'250'000`, `1 250 000 €`, `1.250.000 €`. Never cents. Non-breaking space: prices never wrap.
 * The country's own currency keeps the country's form (as before); another
 * currency (`{ currency: 'EUR' }` on a Swiss site) is written in the page
 * language: `€1,250,000` (en), `1 250 000 €` (fr).
 */
export function formatAmount(n: number, opts: typeof COUNTRY | AmountOptions = COUNTRY): string {
  const o: AmountOptions = typeof opts === 'string' ? { country: opts } : opts;
  const country = o.country ?? COUNTRY;
  const currency = (o.currency || ownCurrency(country)).toUpperCase();
  if (currency === 'CHF') {
    return 'CHF\u00a0' + new Intl.NumberFormat('de-CH', { maximumFractionDigits: 0 }).format(n);
  }
  const locale = currency === ownCurrency(country) ? { CH: 'de-CH', FR: 'fr-FR', ES: 'es-ES', IT: 'it-IT' }[country] : foreignLocale(o.locale ?? LOCALE);
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
    useGrouping: 'always',
  } as Intl.NumberFormatOptions).format(n);
}

/**
 * Listing price with rent period and "price on request", in the listing's
 * currency (`currency`, when the record has one) and the page language
 * (`{ locale }`, default the site's LOCALE).
 */
export function formatPrice(
  l: Pick<Listing, 'price' | 'price_on_request' | 'offer_type'> & { currency?: string | null },
  opts: { locale?: string } = {},
): string {
  const lg = (opts.locale ?? LOCALE).slice(0, 2) as ReturnType<typeof lang>;
  const w = (k: keyof typeof T) => T[k][lg] ?? T[k][lang()];
  if (l.price_on_request || l.price == null || l.price <= 0) return w('onRequest');
  const amount = formatAmount(l.price, { currency: l.currency, locale: opts.locale });
  return l.offer_type === 'rent' ? `${amount} / ${w('month')}` : amount;
}

/** `145 m²` with a non-breaking space. */
export function formatSurface(m2: number | undefined | null): string {
  if (m2 == null) return '';
  const locale = COUNTRY === 'CH' ? 'de-CH' : LOCALE;
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(m2)} m²`;
}

export const listingUrl = (l: Pick<Listing, 'slug'>) => `/listings/${l.slug}`;
