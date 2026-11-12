/**
 * New-build developments on an agency site: URLs, unit labels and counts in
 * the site language. Pages: src/pages/developments/ (index + one page per
 * development); a one-development site builds its own pages from the same
 * helpers (AGENTS.md, One-development site).
 */
import site from 'virtual:sites-kit/site';
import type { Development, DevelopmentWithUnits, Unit } from '@realadvisor/sites-sdk/types';
import { formatAmount } from './format';
import { lang, t, type Lang, type StringKey } from './i18n';

export type { Development, DevelopmentWithUnits, Unit };

/**
 * Base path of the development pages (site.json `developmentsPath`). To use
 * another path, rename src/pages/developments/ (e.g. to src/pages/projects/)
 * and set it to "/projects"; every link and the sitemap follow.
 */
export const DEVELOPMENTS_PATH = site.developmentsPath;
export const developmentUrl = (d: Pick<Development, 'slug'>) => `${DEVELOPMENTS_PATH}/${d.slug}`;

/** The listing page of a unit that is also a public listing, else null. */
export const unitListingUrl = (u: Pick<Unit, 'listing_slug'>) => (u.listing_slug ? `/listings/${u.listing_slug}` : null);

const ROOMS: Record<Lang, [string, string]> = {
  de: ['Zimmer', 'Zimmer'],
  fr: ['pièce', 'pièces'],
  it: ['locale', 'locali'],
  es: ['habitación', 'habitaciones'],
  en: ['room', 'rooms'],
};
/** `4.5 pièces` (Swiss style: a dot, never "4,5"); '' when unknown. */
export function formatRooms(r: number | undefined | null, l: Lang = lang()): string {
  if (r == null) return '';
  return `${String(r)} ${ROOMS[l][r <= 1 ? 0 : 1]}`;
}

/** `Rez` / `2e étage` / `EG` / `2. OG` ... from `unit.floor`; the CRM label as fallback. */
export function formatFloor(u: Pick<Unit, 'floor' | 'floor_label'>, l: Lang = lang()): string {
  const f = u.floor;
  // The CRM names an attique by its title, not its number: keep it, as the
  // explorer's floor rows do ("3.5 pièces · Attique", never "4e étage").
  if (u.floor_label && /^attique$/i.test(u.floor_label)) {
    return { de: 'Attika', fr: 'Attique', it: 'Attico', es: 'Ático', en: 'Penthouse' }[l];
  }
  if (f == null) return u.floor_label ?? '';
  if (f < 0) return { de: `${-f}. UG`, fr: `Sous-sol ${-f}`, it: `Piano -${-f}`, es: `Sótano ${-f}`, en: `Basement ${-f}` }[l];
  if (f === 0) return { de: 'EG', fr: 'Rez', it: 'Piano terra', es: 'Planta baja', en: 'Ground floor' }[l];
  const en = f === 1 ? '1st' : f === 2 ? '2nd' : f === 3 ? '3rd' : `${f}th`;
  return { de: `${f}. OG`, fr: f === 1 ? '1er étage' : `${f}e étage`, it: `${f}° piano`, es: `${f}ª planta`, en: `${en} floor` }[l];
}

export const unitStatusLabel = (u: Pick<Unit, 'status'>, l: Lang = lang()) => t(u.status as StringKey, {}, l);

/** Price for a unit table: sold and reserved units never show a price. */
export function unitPrice(u: Pick<Unit, 'status' | 'price' | 'price_on_request'>, l: Lang = lang()): string {
  if (u.status !== 'available') return unitStatusLabel(u, l);
  if (u.price_on_request || !u.price) return t('priceOnRequest', {}, l);
  return formatAmount(u.price);
}

/** CRM development status (planning, construction, ...) in the site language, '' when unknown. */
export function developmentStatus(d: Pick<Development, 'status'>, l: Lang = lang()): string {
  const key = `devStatus_${d.status ?? ''}`;
  return ['devStatus_planning', 'devStatus_construction', 'devStatus_marketing', 'devStatus_delivered'].includes(key)
    ? t(key as StringKey, {}, l)
    : '';
}

/** "dès CHF 1'445'000" from the development's price range, '' without public prices. */
export function priceFrom(d: Pick<Development, 'stats'>, l: Lang = lang()): string {
  const min = d.stats.price?.min;
  return min && min > 0 ? t('priceFrom', { price: formatAmount(min) }, l) : '';
}

/** Units sorted for a table: floor, then rooms. */
export const sortUnits = (units: Unit[]) =>
  [...units].sort((a, b) => (a.floor ?? 0) - (b.floor ?? 0) || (a.rooms ?? 0) - (b.rooms ?? 0));

/** "4.5 pièces · 2e étage": a unit in a sentence or a select; '' parts dropped. */
export const unitLabel = (u: Pick<Unit, 'rooms' | 'floor' | 'floor_label'>, l: Lang = lang()) =>
  [formatRooms(u.rooms, l) || t('unit', {}, l), formatFloor(u, l)].filter(Boolean).join(' · ');

/**
 * Units a visitor can ask about, for `<EnquiryForm developmentId units>`:
 * every unit not sold, in table order, labelled with rooms, floor and status.
 */
export const unitOptions = (units: Unit[], l: Lang = lang()) =>
  sortUnits(units)
    .filter((u) => u.status !== 'sold')
    .map((u) => ({ value: u.id, label: `${unitLabel(u, l)}${u.status === 'reserved' ? ` (${unitStatusLabel(u, l)})` : ''}` }));

/**
 * Link of a unit row to the development's enquiry form with that unit chosen
 * (the page reads `?lot=` and passes it as `selectedUnit`).
 */
export const unitEnquiryUrl = (d: Pick<Development, 'slug'>, u: Pick<Unit, 'id'>, anchor = 'contact') =>
  `${developmentUrl(d)}?lot=${encodeURIComponent(u.id)}#${anchor}`;
