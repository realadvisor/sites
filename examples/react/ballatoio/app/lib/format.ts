/** Prices, surfaces and facts in the page language, through the kit's formatters (Italian conventions: 1.250.000 €, 145 m²). */
import { formatAmount, formatSurface } from '@realadvisor/sites-kit-core/format';
import { featureLabel, propertyTypeLabel } from '@realadvisor/sites-kit-core/i18n';
import type { Listing } from '@realadvisor/sites-sdk/types';
import { LOCALE_OF, UI, fill, type Lang } from './i18n';

export function price(l: Pick<Listing, 'price' | 'price_on_request' | 'offer_type' | 'status'>, lang: Lang): string {
  if (l.status === 'sold') return l.offer_type === 'rent' ? UI[lang].rented : UI[lang].sold;
  if (l.price_on_request || l.price == null || l.price <= 0) return UI[lang].onRequest;
  const amount = formatAmount(l.price);
  return l.offer_type === 'rent' ? `${amount} / ${UI[lang].perMonth}` : amount;
}

export const surface = (m2?: number | null) => (m2 ? formatSurface(m2) : '');
export const typeLabel = (l: Pick<Listing, 'property_type'>, lang: Lang) => propertyTypeLabel(l.property_type, LOCALE_OF[lang]);
export const rooms = (n: number | undefined, lang: Lang) => (!n ? '' : n === 1 ? UI[lang].roomsOne : fill(UI[lang].roomsN, { n: String(n).replace('.', lang === 'it' ? ',' : '.') }));
export const baths = (n: number | undefined, lang: Lang) => (!n ? '' : n === 1 ? UI[lang].bathsOne : fill(UI[lang].bathsN, { n }));

/** "4 locali · 145 m²": the short line under a card title. */
export const factLine = (l: Listing, lang: Lang) => [rooms(l.rooms, lang), surface(l.living_surface)].filter(Boolean).join(' · ');

/** Every fact the listing has, as key / value rows; rows without data are left out. */
export function factRows(l: Listing, lang: Lang, place: string): [string, string][] {
  const t = UI[lang];
  const rows: [string, string | undefined][] = [
    [l.offer_type === 'rent' ? t.rentL : t.price, price(l, lang)],
    [t.where, place || undefined],
    [t.type, typeLabel(l, lang)],
    [t.living, surface(l.living_surface) || undefined],
    [t.rooms, l.rooms ? String(l.rooms) : undefined],
    [t.bedrooms, l.bedrooms ? String(l.bedrooms) : undefined],
    [t.bathrooms, l.bathrooms ? String(l.bathrooms) : undefined],
    [t.floor, l.floor == null ? undefined : l.floor === 0 ? t.groundFloor : String(l.floor)],
    [t.terrace, l.terrace_surface ? surface(l.terrace_surface) : undefined],
    [t.balcony, l.balcony_surface ? surface(l.balcony_surface) : undefined],
    [t.land, surface(l.land_surface) || undefined],
    [t.year, l.construction_year ? String(l.construction_year) : undefined],
    [t.charges, l.charges ? fill(t.chargesValue, { amount: formatAmount(l.charges) }) : undefined],
    [t.energy, l.energy_class],
    [t.features, l.features.length ? l.features.map((f) => featureLabel(f, LOCALE_OF[lang])).join(', ') : undefined],
  ];
  return rows.filter((r): r is [string, string] => !!r[1]);
}

/** Language names an agent speaks, in the page language. */
export const languageList = (codes: string[] | undefined, lang: Lang) => {
  const names = (codes ?? []).map((c) => UI[lang].languages[c] ?? c).filter(Boolean);
  return new Intl.ListFormat(lang, { type: 'conjunction' }).format(names);
};

export const formatDate = (d: Date, lang: Lang) => new Intl.DateTimeFormat(LOCALE_OF[lang], { day: 'numeric', month: 'long', year: 'numeric' }).format(d);

/** `+39 02 000 000 01` → `tel:+3902000000001`. */
export const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, '')}`;

/**
 * Splits a listing description (sanitized HTML from the SDK) into its
 * top-level blocks, so the listing page can set photos between paragraphs.
 * Each block is rendered again through sanitizeHtml.
 */
export function blocks(html: string | undefined): string[] {
  if (!html) return [];
  return html
    .split(/(?<=<\/(?:p|ul|ol|h3|h4)>)/i)
    .map((b) => b.trim())
    .filter((b) => b.replace(/<[^>]*>/g, '').trim().length > 0);
}
