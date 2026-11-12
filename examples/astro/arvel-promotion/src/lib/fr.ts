/**
 * French labels, URLs and figures of the site. Prices and surfaces through the
 * kit's `format` (1 250 000 €, 68 m²). No figure here is invented: each one is
 * computed from the data passed in.
 */
import type { Development, DevelopmentWithUnits, Unit, UnitStatus } from '@realadvisor/sites-sdk/types';
import { formatAmount, formatSurface } from '@realadvisor/sites-kit-core/format';

export { formatAmount, formatSurface };

export const PROGRAMMES_PATH = '/programmes';
export const programmeUrl = (d: Pick<Development, 'slug'>, sub = '') => `${PROGRAMMES_PATH}/${d.slug}${sub ? `/${sub}` : ''}`;

const slugify = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
/** `/programmes/<slug>/logements/t3-2e-etage-<uuid>`: readable, and the id is the key. */
export const unitPath = (u: Pick<Unit, 'id' | 'name'>) => `${slugify(u.name)}-${u.id}`;
export const unitUrl = (d: Pick<Development, 'slug'>, u: Pick<Unit, 'id' | 'name'>) => programmeUrl(d, `logements/${unitPath(u)}`);
const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const unitIdFromPath = (p: string) => p.match(UUID)?.[0] ?? null;

/** French new-build type: T1 (studio) to T5, from the number of rooms. */
export const typeCode = (u: Pick<Unit, 'rooms'>) => (u.rooms ? `T${Math.round(u.rooms)}` : '');
export const typeName = (u: Pick<Unit, 'rooms'>) => (u.rooms === 1 ? 'Studio' : u.rooms ? `${u.rooms} pièces` : 'Logement');

export const plural = (n: number, one: string, many: string) => `${n} ${n > 1 ? many : one}`;
export const roomsText = (u: Pick<Unit, 'rooms'>) => (u.rooms ? plural(u.rooms, 'pièce', 'pièces') : '');
export const bedroomsText = (u: Pick<Unit, 'bedrooms'>) => (u.bedrooms ? plural(u.bedrooms, 'chambre', 'chambres') : '');

export function floorName(u: Pick<Unit, 'floor' | 'floor_label'>): string {
  if (u.floor_label) return u.floor_label;
  if (u.floor == null) return '';
  if (u.floor === 0) return 'Rez-de-chaussée';
  if (u.floor < 0) return `Sous-sol ${-u.floor}`;
  return u.floor === 1 ? '1er étage' : `${u.floor}e étage`;
}
/** Short floor for tight places: RDC, 1er, 2e. */
export const floorShort = (f: number | undefined) => (f == null ? '' : f === 0 ? 'RDC' : f === 1 ? '1er' : `${f}e`);

const STATUS: Record<UnitStatus, string> = { available: 'Disponible', reserved: 'Réservé', sold: 'Vendu' };
export const statusLabel = (u: Pick<Unit, 'status'>) => STATUS[u.status] ?? '';

/** Sold and reserved units never show a price. */
export function unitPrice(u: Pick<Unit, 'status' | 'price' | 'price_on_request'>): string {
  if (u.status !== 'available') return statusLabel(u);
  if (u.price_on_request || !u.price) return 'Prix sur demande';
  return formatAmount(u.price);
}

const DEV_STATUS: Record<string, string> = {
  planning: 'En projet',
  marketing: 'En commercialisation',
  construction: 'En travaux',
  delivered: 'Livré',
};
export const programmeStatus = (d: Pick<Development, 'status'>) => DEV_STATUS[d.status ?? ''] ?? '';

const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const QUARTER = ['1er trimestre', '2e trimestre', '3e trimestre', '4e trimestre'];
/** "Livraison 1er trimestre 2028", or "Livré en juin 2026"; '' without a date. */
export function deliveryText(d: Pick<Development, 'delivery_date' | 'status'>): string {
  if (!d.delivery_date) return '';
  const [y, m] = d.delivery_date.split('-').map(Number) as [number, number];
  if (d.status === 'delivered') return `Livré en ${MONTHS[m - 1]} ${y}`;
  return `Livraison ${QUARTER[Math.floor((m - 1) / 3)]} ${y}`;
}
/** Just the date part: "1er trim. 2028" / "Juin 2026". */
export function deliveryShort(d: Pick<Development, 'delivery_date' | 'status'>): string {
  if (!d.delivery_date) return '';
  const [y, m] = d.delivery_date.split('-').map(Number) as [number, number];
  if (d.status === 'delivered') return `${MONTHS[m - 1]![0]!.toUpperCase()}${MONTHS[m - 1]!.slice(1)} ${y}`;
  return `${QUARTER[Math.floor((m - 1) / 3)]!.replace('trimestre', 'trim.')} ${y}`;
}

export const priceFrom = (d: Pick<Development, 'stats'>) => {
  const min = d.stats.price?.min;
  return min && min > 0 ? `dès ${formatAmount(min)}` : '';
};

const ORIENT: Record<string, string> = {
  N: 'Nord', NE: 'Nord-est', E: 'Est', SE: 'Sud-est', S: 'Sud', SW: 'Sud-ouest', W: 'Ouest', NW: 'Nord-ouest',
};
const BEARING: Record<string, number> = { N: 0, NE: 45, E: 90, SE: 135, S: 180, SW: 225, W: 270, NW: 315 };
export const orientationLabel = (o?: string) => (o ? (ORIENT[o] ?? '') : '');
export const orientationBearing = (o?: string) => (o && o in BEARING ? BEARING[o]! : 180);

/** Range "28 à 109 m²", or one value. */
export const surfaceRange = (r?: { min: number; max: number }) =>
  !r ? '' : r.min === r.max ? formatSurface(r.min) : `${r.min} à ${formatSurface(r.max)}`;
export const typeRange = (r?: { min: number; max: number }) =>
  !r ? '' : r.min === r.max ? `T${r.min}` : `T${r.min} à T${r.max}`;

/** Unit types of a programme with their counts, T1..T5 in order. */
export function typeMix(d: DevelopmentWithUnits) {
  const by = new Map<string, { code: string; rooms: number; total: number; available: number; minPrice?: number; minSurface?: number; maxSurface?: number }>();
  for (const u of d.units) {
    const code = typeCode(u);
    if (!code) continue;
    const t = by.get(code) ?? { code, rooms: u.rooms!, total: 0, available: 0 };
    t.total++;
    if (u.status === 'available') {
      t.available++;
      if (u.price && !u.price_on_request) t.minPrice = Math.min(t.minPrice ?? Infinity, u.price);
    }
    if (u.living_surface) {
      t.minSurface = Math.min(t.minSurface ?? Infinity, u.living_surface);
      t.maxSurface = Math.max(t.maxSurface ?? 0, u.living_surface);
    }
    by.set(code, t);
  }
  return [...by.values()].sort((a, b) => a.rooms - b.rooms);
}

/** "Chemin des Balcons 2, 74600 Annecy". */
export const addressLine = (a: { street?: string; postcode?: string; city?: string }) =>
  [a.street, [a.postcode, a.city].filter(Boolean).join(' ')].filter(Boolean).join(', ');

export const telHref = (p: string) => `tel:${p.replace(/[^\d+]/g, '')}`;

/** "T3 · 2e étage · 68 m²": a unit in a sentence or a select. */
export const unitLabel = (u: Pick<Unit, 'rooms' | 'floor' | 'floor_label' | 'living_surface'>) =>
  [typeCode(u) || 'Logement', floorName(u), u.living_surface ? formatSurface(u.living_surface) : ''].filter(Boolean).join(' · ');

/** Units a visitor can ask about, for `<EnquiryForm developmentId units>`: every unit not sold. */
export const unitOptions = (units: Unit[]) =>
  units
    .filter((u) => u.status !== 'sold')
    .sort((a, b) => (a.rooms ?? 0) - (b.rooms ?? 0) || (a.floor ?? 0) - (b.floor ?? 0))
    .map((u) => ({ value: u.id, label: `${unitLabel(u)}${u.status === 'reserved' ? ' (réservé)' : ''}` }));

/** "Mon intérêt pour …" message prefilled in the enquiry form. */
export const enquiryMessage = (d: Pick<Development, 'title'>, u?: Pick<Unit, 'rooms' | 'floor' | 'floor_label' | 'living_surface'>) =>
  u
    ? `Bonjour, je souhaite recevoir des informations sur le ${unitLabel(u)} de ${d.title}.`
    : `Bonjour, je souhaite recevoir des informations sur ${d.title}.`;

export type { DevelopmentWithUnits };

const LANGUAGES: Record<string, string> = { fr: 'français', en: 'anglais', de: 'allemand', it: 'italien', es: 'espagnol', pt: 'portugais', ar: 'arabe' };
/** ['fr', 'en'] → "Parle français et anglais". */
export function languageList(codes: string[]): string {
  const names = codes.map((c) => LANGUAGES[c] ?? c);
  if (!names.length) return '';
  const list = names.length > 1 ? `${names.slice(0, -1).join(', ')} et ${names.at(-1)}` : names[0];
  return `Parle ${list}`;
}
