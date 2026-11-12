/**
 * Unit helpers in this site's own words. Same rules as the kit's: sold and
 * reserved units never show a price, rooms with a dot ("4.5 pièces").
 *
 * Pure (no data import), so components can use them: the fixture-only unit
 * fields arrive from the loader as `Extras` (unit id -> UnitExtra) and are
 * passed in explicitly, never merged into the SDK units.
 */
import type { DevelopmentWithUnits, Unit } from '@realadvisor/sites-sdk/types';
import { formatAmount, formatSurface, LOCALE } from '@realadvisor/sites-kit/format';
import { formatRooms } from '@realadvisor/sites-kit/developments';
import { t, type StringKey } from '@realadvisor/sites-kit/i18n';

export type UnitExtra = {
  unit_number?: string;
  position?: number;
  orientation?: string;
  garden_surface?: number;
  terrace_surface?: number;
};
/** fixture only: unit number, position on the floor, orientation, garden or terrace surface, by unit id. */
export type Extras = Record<string, UnitExtra>;
export const unitExtra = (ex: Extras, u: Pick<Unit, 'id'>): UnitExtra => ex[u.id] ?? {};

export { formatRooms, formatSurface, formatAmount };

export const statusLabel = (u: Pick<Unit, 'status'>) => t(u.status as StringKey);

/** "1er étage" / "Rez-de-chaussée": the CRM label, else from the number. */
export function floorName(u: Pick<Unit, 'floor' | 'floor_label'>): string {
  if (u.floor_label) return u.floor_label;
  if (u.floor == null) return '';
  if (u.floor === 0) return 'Rez-de-chaussée';
  return u.floor === 1 ? '1er étage' : `${u.floor}e étage`;
}

/** Price cell: only available units with a public price show an amount. */
export function unitPrice(u: Pick<Unit, 'status' | 'price' | 'price_on_request'>): string {
  if (u.status !== 'available') return statusLabel(u);
  if (u.price_on_request || !u.price) return t('priceOnRequest');
  return formatAmount(u.price);
}

/** "4.5 pièces · 2e étage" */
export const unitLabel = (u: Unit) => [formatRooms(u.rooms) || t('unit'), floorName(u)].filter(Boolean).join(' · ');

/** "Lot 2.3" when the fixture has a number (fixture only), else ''. */
export const unitNumber = (u: Unit, ex: Extras) => {
  const n = unitExtra(ex, u).unit_number; // fixture only: unit number
  return n ? `Lot ${n}` : '';
};

const slugify = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/** /appartements/4-5-pieces-2e-etage-<id>: readable, resolved by the id at its end. */
export const unitPath = (u: Unit) => `/appartements/${slugify(`${String(u.rooms ?? '').replace('.', '-')} pieces ${floorName(u)}`)}-${u.id}`;

const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const unitFromSlug = (dev: DevelopmentWithUnits, slug: string) => {
  const id = slug.match(UUID_RE)?.[0];
  return (id && dev.units.find((u) => u.id === id)) || null;
};

/** Units in table order: floor, then position on the floor (fixture only), then rooms. */
export const sortUnits = (units: Unit[], ex: Extras) =>
  [...units].sort(
    (a, b) =>
      (a.floor ?? 0) - (b.floor ?? 0) ||
      (unitExtra(ex, a).position ?? 99) - (unitExtra(ex, b).position ?? 99) || // fixture only: position on the floor
      (a.rooms ?? 0) - (b.rooms ?? 0),
  );

export type Outdoor = { kind: 'garden' | 'terrace' | 'balcony'; label: string; m2: number };

/** Outdoor space: the API's balcony surface, else the fixture's garden or terrace. */
export function outdoor(u: Unit, ex: Extras): Outdoor | null {
  const x = unitExtra(ex, u);
  if (x.garden_surface) return { kind: 'garden', label: 'Jardin privatif', m2: x.garden_surface }; // fixture only: garden surface
  if (u.balcony_surface) return { kind: 'terrace', label: 'Terrasse', m2: u.balcony_surface };
  if (x.terrace_surface) return { kind: 'terrace', label: 'Terrasse', m2: x.terrace_surface }; // fixture only: terrace surface
  return null;
}

const ORIENT: Record<string, string> = {
  N: 'Nord', S: 'Sud', E: 'Est', W: 'Ouest', NE: 'Nord-est', NW: 'Nord-ouest', SE: 'Sud-est', SW: 'Sud-ouest',
};
/** fixture only: orientation, in words. */
export const orientation = (u: Unit, ex: Extras) => {
  const o = unitExtra(ex, u).orientation; // fixture only: orientation
  return o ? (ORIENT[o] ?? o) : '';
};

/** Unit options for EnquiryForm (every unit not sold), labelled with its number when known. */
export const unitOptions = (units: Unit[], ex: Extras) =>
  sortUnits(units, ex)
    .filter((u) => u.status !== 'sold')
    .map((u) => ({
      value: u.id,
      label: [unitNumber(u, ex), unitLabel(u)].filter(Boolean).join(' — ') + (u.status === 'reserved' ? ` (${statusLabel(u)})` : ''),
    }));

const range = (xs: number[]) => (xs.length ? { min: Math.min(...xs), max: Math.max(...xs) } : null);
const fmtRange = (r: { min: number; max: number } | null, f: (n: number) => string, sep = ' à ') =>
  !r ? '' : r.min === r.max ? f(r.min) : `${f(r.min)}${sep}${f(r.max)}`;

/** Key figures, computed from the units themselves (never typed in). */
export function keyFigures(dev: DevelopmentWithUnits) {
  const units = dev.units;
  const rooms = range(units.flatMap((u) => (u.rooms != null ? [u.rooms] : [])));
  const surf = range(units.flatMap((u) => (u.living_surface ? [u.living_surface] : [])));
  const available = units.filter((u) => u.status === 'available');
  const prices = range(available.flatMap((u) => (u.price && !u.price_on_request ? [u.price] : [])));
  const floors = new Set(units.map((u) => u.floor ?? 0)).size;
  return {
    units: units.length,
    available: available.length,
    floors,
    rooms: fmtRange(rooms, (n) => String(n)),
    roomsUnit: rooms && rooms.max > 1 ? 'pièces' : 'pièce',
    surfaces: fmtRange(surf, (n) => String(n)),
    priceFrom: prices ? formatAmount(prices.min) : '',
    delivery: deliveryLabel(dev),
  };
}

/** "décembre 2027" */
export const deliveryLabel = (dev: Pick<DevelopmentWithUnits, 'delivery_date'>) =>
  dev.delivery_date ? new Intl.DateTimeFormat(LOCALE, { month: 'long', year: 'numeric' }).format(new Date(dev.delivery_date)) : '';

export type UnitType = {
  rooms: number;
  label: string;
  units: Unit[];
  available: Unit[];
  surfaces: string;
  priceFrom: string;
  plan: string | null;
};

/** One entry per room count, for the unit-type strip and the filters. */
export function unitTypes(units: Unit[]): UnitType[] {
  const by = new Map<number, Unit[]>();
  for (const u of units) if (u.rooms != null) by.set(u.rooms, [...(by.get(u.rooms) ?? []), u]);
  return [...by.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([rooms, us]) => {
      const available = us.filter((u) => u.status === 'available');
      const prices = available.flatMap((u) => (u.price && !u.price_on_request ? [u.price] : []));
      const sample = available[0] ?? us[0]!;
      return {
        rooms,
        label: formatRooms(rooms),
        units: us,
        available,
        surfaces: fmtRange(range(us.flatMap((u) => (u.living_surface ? [u.living_surface] : []))), (n) => String(n), '–') + ' m²',
        priceFrom: prices.length ? formatAmount(Math.min(...prices)) : '',
        plan: planFor(sample, units),
      };
    });
}

/**
 * The drawn plan of a unit (public/plans/, our own indicative drawings: the
 * API has no floor plans). One plan per room count, a garden variant on the
 * ground floor and the attique plans on the top floor.
 */
export function planFor(u: Unit, all: Unit[]): string | null {
  const top = Math.max(...all.map((x) => x.floor ?? 0));
  const r = u.rooms;
  if (r == null) return null;
  const key = String(r).replace('.', '');
  if (u.floor === top && top > 0 && (r === 5.5 || r === 6.5)) return `/plans/plan-${key}-attique.svg`;
  if (!['25', '35', '45', '55'].includes(key)) return null;
  return u.floor === 0 ? `/plans/plan-${key}-jardin.svg` : `/plans/plan-${key}.svg`;
}
