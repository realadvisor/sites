/**
 * Development helpers: unit groups for "Preise und Verfügbarkeit", plan
 * types, ordering and labels. Groups and types come from the data (rooms,
 * attic or not, garden level), so a live development with other units gets
 * its own; a type without a drawn plan shows no plan.
 *
 * The fixture-only position on the floor arrives as `ux` (data.server unitExtras(): {} on live data).
 */
import type { DevelopmentWithUnits, Unit } from '@realadvisor/sites-sdk/types';
import { href, unitSlug, type L } from './routes';
import { floor, floorShort, formatAmount, rooms } from './format';
import { tx } from './copy';

export type UnitExtra = { position?: number };
/** Fixture-only unit fields by unit id. */
export type UnitExtras = Record<string, UnitExtra>;

export const isAttic = (u: Pick<Unit, 'property_type'>) => /attic|penthouse/.test(u.property_type);

/** Plans drawn for this site (scripts/make-plans.mjs in the Astro version), by type key. */
const PLANS = new Set(['2-5', '3-5', '4-5', '3-5-eg', '4-5-eg', '3-5-attika', '4-5-attika']);

/** Plan type: rooms, plus the garden-level or attic variant. */
export const planKey = (u: Pick<Unit, 'rooms' | 'property_type' | 'floor'>) =>
  `${String(u.rooms ?? 'x').replace('.', '-')}${isAttic(u) ? '-attika' : u.floor === 0 ? '-eg' : ''}`;
export const planUrl = (u: Pick<Unit, 'rooms' | 'property_type' | 'floor'>, l: L) => {
  const k = planKey(u);
  return PLANS.has(k) ? `/plans/${l}/${k}.svg` : undefined;
};

/** One line of "Preise und Verfügbarkeit": rooms (and attic) with its units. */
export type Group = { key: string; label: string; attic: boolean; rooms?: number; units: Unit[]; available: Unit[]; reserved: Unit[]; from?: number };

export function groups(units: Unit[], l: L, ux: UnitExtras): Group[] {
  const by = new Map<string, Unit[]>();
  for (const u of units) {
    const k = `${isAttic(u) ? 'b' : 'a'}${String(u.rooms ?? 0).padStart(4, '0')}`;
    by.set(k, [...(by.get(k) ?? []), u]);
  }
  return [...by.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, us]) => {
      const attic = isAttic(us[0]!);
      const available = us.filter((u) => u.status === 'available');
      const priced = available.filter((u) => u.price && !u.price_on_request).map((u) => u.price!);
      const r = us[0]!.rooms;
      return {
        key,
        attic,
        rooms: r,
        label: attic ? `${floor(7, l, true)}, ${rooms(r, l)}` : rooms(r, l),
        units: sortUnits(us, ux),
        available,
        reserved: us.filter((u) => u.status === 'reserved'),
        from: priced.length ? Math.min(...priced) : undefined,
      };
    });
}

/** "ab CHF 805'000 · 3 verfügbar" / "ausverkauft" / "alle reserviert". */
export function groupLine(g: Group, l: L): { price?: string; status: string } {
  const t = tx(l);
  if (!g.available.length) return { status: g.reserved.length ? t('reservedOnly') : t('soldOut') };
  const parts = [g.available.length === 1 ? t('nAvailable1') : t('nAvailable', { n: g.available.length })];
  if (g.reserved.length) parts.push(g.reserved.length === 1 ? t('nReserved1') : t('nReserved', { n: g.reserved.length }));
  return { price: g.from ? t('priceFrom', { p: formatAmount(g.from) }) : undefined, status: parts.join(' · ') };
}

/** Floor, then the position on the floor (fixture only), else the surface. */
export function sortUnits(units: Unit[], ux: UnitExtras) {
  // fixture only: position on the floor
  const pos = (u: Unit) => ux[u.id]?.position ?? 0;
  return [...units].sort((a, b) => (a.floor ?? 0) - (b.floor ?? 0) || pos(a) - pos(b) || (a.living_surface ?? 0) - (b.living_surface ?? 0));
}

export const unitNo = (u: Unit) => u.reference;

/** "3,5 Zimmer · 1. Obergeschoss". */
export const unitLine = (u: Unit, l: L) => [rooms(u.rooms, l), floor(u.floor, l, isAttic(u))].filter(Boolean).join(' · ');
export const unitLineShort = (u: Unit, l: L) => [rooms(u.rooms, l), floorShort(u.floor, l, isAttic(u))].filter(Boolean).join(' · ');

/** Heading: "Wohnung 1.1" when the fixture has a number, else rooms and floor. */
export function unitTitle(u: Unit, l: L) {
  const no = unitNo(u);
  return no ? tx(l)('unitN', { n: no }) : unitLine(u, l);
}

export const statusLabel = (s: Unit['status'], l: L) => tx(l)(s === 'available' ? 'available' : s === 'reserved' ? 'reserved' : 'sold');

export const unitHref = (d: Pick<DevelopmentWithUnits, 'slug'>, u: Unit, l: L) => href('developments', l, d.slug, unitSlug(u));

/** Enquiry select options in the page language: every unit not sold. */
export const unitSelect = (units: Unit[], l: L, ux: UnitExtras) =>
  sortUnits(units, ux)
    .filter((u) => u.status !== 'sold')
    .map((u) => {
      const no = unitNo(u);
      const line = unitLineShort(u, l);
      return { value: u.id, label: `${no ? `${no} · ` : ''}${line}${u.status === 'reserved' ? ` (${statusLabel('reserved', l)})` : ''}` };
    });

/** Outdoor space: garden or terrace, else the balcony. */
export function outdoor(u: Unit, l: L): { label: string; m2: number } | undefined {
  const t = tx(l);
  const terrace = u.terrace_surface;
  const garden = u.garden_surface;
  if (garden != null) return { label: t('garden'), m2: garden };
  if (terrace != null) return { label: t('terrace'), m2: terrace };
  if (u.balcony_surface != null) return { label: t('loggia'), m2: u.balcony_surface };
  return undefined;
}

/** Unit price: only available units show one (reserved and sold never do). */
export const unitPrice = (u: Unit, l: L) =>
  u.status === 'available' ? (u.price && !u.price_on_request ? formatAmount(u.price) : { de: 'Preis auf Anfrage', fr: 'Prix sur demande', en: 'Price on request' }[l]) : '';
