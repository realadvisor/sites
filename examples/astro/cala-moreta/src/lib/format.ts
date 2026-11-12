/** Prices, surfaces and facts in the page language, through the kit's formatters (Spanish conventions: 1.250.000 €, 145 m²). */
import { formatAmount, formatSurface } from '@realadvisor/sites-kit/format';
import { propertyTypeLabel } from '@realadvisor/sites-kit/i18n';
import type { Listing } from '@realadvisor/sites-sdk/types';
import { LOCALE_OF, UI, type Lang } from './i18n';

export function price(l: Pick<Listing, 'price' | 'price_on_request' | 'offer_type' | 'status'>, lang: Lang): string {
  if (l.status === 'sold') return UI[lang].sold;
  if (l.price_on_request || l.price == null || l.price <= 0) return UI[lang].onRequest;
  const amount = formatAmount(l.price);
  return l.offer_type === 'rent' ? `${amount} / ${UI[lang].perMonth}` : amount;
}

export const surface = (m2?: number | null) => (m2 ? formatSurface(m2) : '');
// The kit knows `house_farm` (Masía / Farmhouse) but not the CRM's `house_farmhouse`.
const TYPE_ALIAS: Record<string, string> = { house_farmhouse: 'house_farm' };
export const typeLabel = (l: Pick<Listing, 'property_type'>, lang: Lang) => propertyTypeLabel(TYPE_ALIAS[l.property_type] ?? l.property_type, LOCALE_OF[lang]);

/** Key/value rows for a spec table; rows without data are left out. */
export function specRows(l: Listing, lang: Lang, opts: { price?: boolean; town?: boolean; land?: boolean } = {}) {
  const t = UI[lang];
  const rows: [string, string][] = [];
  if (opts.town && l.address.city) rows.push([t.town, l.address.city]);
  if (opts.price !== false) rows.push([l.offer_type === 'rent' ? t.rent : t.price, price(l, lang)]);
  if (l.bedrooms) rows.push([t.bedrooms, String(l.bedrooms)]);
  if (l.living_surface) rows.push([t.living, surface(l.living_surface)]);
  if (opts.land !== false && l.land_surface) rows.push([t.land, surface(l.land_surface)]);
  return rows;
}


/** Language names an agent speaks, in the page language. */
export const languageList = (codes: string[] | undefined, lang: Lang) => {
  const names = (codes ?? []).map((c) => UI[lang].languages[c] ?? c).filter(Boolean);
  return new Intl.ListFormat(lang === 'en' ? 'en' : 'es', { type: 'conjunction' }).format(names);
};

export const formatDate = (d: Date, lang: Lang) => new Intl.DateTimeFormat(LOCALE_OF[lang], { day: 'numeric', month: 'long', year: 'numeric' }).format(d);
