/**
 * Units of the development: labels, rents, URLs and filters, in German.
 * SDK units are rentals here (`offer_type: rent`, `price` = net rent per
 * month). Status `sold` on a rental means let ("Vermietet").
 */
import type { DevelopmentWithUnits, Unit } from '@realadvisor/sites-sdk/types';
import { formatFloor, formatRooms } from '@realadvisor/sites-kit/developments';
import { formatAmount, formatSurface } from '@realadvisor/sites-kit/format';
import { extra, type UnitExtra } from './data';

export type Row = { u: Unit; x: UnitExtra };

const slugify = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

export const UNITS_PATH = '/wohnungen';
export const unitSlug = (u: Pick<Unit, 'id' | 'name'>) => `${slugify(u.name)}-${u.id}`;
export const unitUrl = (u: Pick<Unit, 'id' | 'name'>) => `${UNITS_PATH}/${unitSlug(u)}`;
const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const unitIdFromSlug = (s: string) => s.match(UUID_RE)?.[0];

export const STATUS = { available: 'Frei', reserved: 'Reserviert', sold: 'Vermietet' } as const;
export const statusLabel = (u: Pick<Unit, 'status'>) => STATUS[u.status];

/** `3.5 Zimmer` (kit rule: a dot). */
export const rooms = (u: Pick<Unit, 'rooms'>) => formatRooms(u.rooms, 'de');
/** Short floor: `EG`, `2. OG`. */
export const floorShort = (u: Pick<Unit, 'floor' | 'floor_label'>) => formatFloor(u, 'de');
export const surface = formatSurface;
export const chf = (n: number) => formatAmount(n);

/**
 * Net rent shown for a unit: free and reserved units show their rent (usual for
 * Swiss first lettings: a reserved flat can fall back to the market), let units
 * never do. Note: the kit's `unitPrice` hides reserved prices (sales rule).
 */
export const netRent = (u: Unit) => (u.status !== 'sold' && u.price && !u.price_on_request ? u.price : undefined);
/** Net rent of a free unit only: for "ab CHF ..." figures. */
export const freeRent = (u: Unit) => (u.status === 'available' ? netRent(u) : undefined);
/** Rent without "CHF": `1'850`, for tight stacking-plan blocks. */
export const rentShort = (n: number) => formatAmount(n).replace(/^CHF\s*/, '');

const ORIENT: Record<string, string> = { N: 'Nord', NE: 'Nordost', E: 'Ost', SE: 'Südost', S: 'Süd', SW: 'Südwest', W: 'West', NW: 'Nordwest' };
/** ['south', 'west'] -> 'SW', the key of ORIENT (and of the plan files). */
export const orientationCode = (u: Pick<Unit, 'orientation'>) =>
  [u.orientation?.includes('north') ? 'N' : u.orientation?.includes('south') ? 'S' : '', u.orientation?.includes('east') ? 'E' : u.orientation?.includes('west') ? 'W' : ''].join('') || undefined;
export const orientationLabel = (o?: string) => (o ? ORIENT[o] ?? o : '');

const MONTH = new Intl.DateTimeFormat('de-CH', { month: 'long', year: 'numeric' });
const DAY = new Intl.DateTimeFormat('de-CH', { day: 'numeric', month: 'long', year: 'numeric' });
/** `April 2027` */
export const monthYear = (iso?: string) => (iso ? MONTH.format(new Date(`${iso.slice(0, 10)}T12:00:00Z`)) : '');
/** `1. April 2027` */
export const longDate = (iso?: string) => (iso ? DAY.format(new Date(`${iso.slice(0, 10)}T12:00:00Z`)) : '');

/** Plan file of a unit type and orientation (public/plans, drawn by scripts/plans.mjs). */
export const planKey = (r?: number) => (r ? String(r).replace('.', '-') : '');
export function planUrl(u: Pick<Unit, 'rooms'>, orientation?: string) {
  const key = planKey(u.rooms);
  if (!['1-5', '2-5', '3-5', '4-5'].includes(key)) return undefined;
  const o = (orientation ?? 'S').toLowerCase();
  return `/plans/typ-${key}-${['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'].includes(o) ? o : 's'}.svg`;
}

/** Every unit with its fixture-only facts, sorted building, floor, position. */
export function rowsOf(dev: DevelopmentWithUnits): Row[] {
  return dev.units
    .map((u) => ({ u, x: extra(u) }))
    .sort(
      (a, b) =>
        (a.x.building ?? '').localeCompare(b.x.building ?? '') ||
        (a.u.floor ?? 0) - (b.u.floor ?? 0) ||
        (a.x.position ?? 0) - (b.x.position ?? 0) ||
        (a.u.rooms ?? 0) - (b.u.rooms ?? 0),
    );
}

export type BuildingInfo = { key: string; name: string; rows: Row[]; available: number; moveIn?: string; floors: number[] };

/** Buildings in order, with their units, availability and move-in date. */
export function buildings(rows: Row[]): BuildingInfo[] {
  const keys = [...new Set(rows.map((r) => r.x.building).filter((b): b is string => !!b))].sort();
  return keys.map((key) => {
    const rs = rows.filter((r) => r.x.building === key);
    const dates = rs.map((r) => r.u.available_from).filter((d): d is string => !!d).sort();
    return {
      key,
      name: `Haus ${key}`,
      rows: rs,
      available: rs.filter((r) => r.u.status === 'available').length,
      moveIn: dates[0],
      floors: [...new Set(rs.map((r) => r.u.floor ?? 0))].sort((a, b) => b - a),
    };
  });
}

export type TypeInfo = { rooms: number; surface?: number; total: number; available: number; from?: number; plan?: string };

/** Unit types by rooms: counts, smallest surface, lowest available net rent. */
export function types(rows: Row[]): TypeInfo[] {
  const keys = [...new Set(rows.map((r) => r.u.rooms).filter((n): n is number => n != null))].sort((a, b) => a - b);
  return keys.map((n) => {
    const rs = rows.filter((r) => r.u.rooms === n);
    const rents = rs.map((r) => freeRent(r.u)).filter((v): v is number => v != null);
    const surfaces = rs.map((r) => r.u.living_surface).filter((v): v is number => v != null);
    return {
      rooms: n,
      surface: surfaces.length ? Math.min(...surfaces) : undefined,
      total: rs.length,
      available: rs.filter((r) => r.u.status === 'available').length,
      from: rents.length ? Math.min(...rents) : undefined,
      plan: planUrl({ rooms: n }),
    };
  });
}

/** Units table filters, read from the URL (GET, shareable). */
export type Filters = { haus?: string; zimmer?: number; maxMiete?: number; geschoss?: number; bezug?: string; frei: boolean };

export function parseFilters(p: URLSearchParams): Filters {
  const num = (k: string) => {
    const v = Number(p.get(k));
    return p.get(k) && Number.isFinite(v) ? v : undefined;
  };
  return {
    haus: p.get('haus')?.toUpperCase() || undefined,
    zimmer: num('zimmer'),
    maxMiete: num('miete'),
    geschoss: num('geschoss'),
    bezug: p.get('bezug') || undefined,
    frei: p.get('frei') === '1',
  };
}

export const matches = (r: Row, f: Filters) =>
  (!f.haus || r.x.building === f.haus) &&
  (f.zimmer == null || r.u.rooms === f.zimmer) &&
  (f.maxMiete == null || ((netRent(r.u) ?? Infinity) <= f.maxMiete)) &&
  (f.geschoss == null || r.u.floor === f.geschoss) &&
  (!f.bezug || r.u.available_from?.slice(0, 7) === f.bezug) &&
  (!f.frei || r.u.status === 'available');

/** Units a visitor can apply for, for `<EnquiryForm units>`: not let, by building. */
export const unitOptions = (rows: Row[]) =>
  rows
    .filter((r) => r.u.status !== 'sold')
    .map((r) => ({
      value: r.u.id,
      label: [unitTitle(r), r.u.reference, r.u.status === 'reserved' ? STATUS.reserved : ''].filter(Boolean).join(' · '),
    }));

/**
 * Display name "Haus A, 3.5 Zimmer, 2. OG": built from the facts so rooms use
 * the kit's dot (the CRM name says "3,5 Zimmer"). Falls back to the name.
 */
export const unitTitle = (r: Row) =>
  r.x.building ? [`Haus ${r.x.building}`, rooms(r.u), floorShort(r.u)].filter(Boolean).join(', ') : r.u.name;

/** "Haus A · 2. OG · 3.5 Zimmer": for alts and short labels. */
export const shortName = (r: Row) => [r.x.building ? `Haus ${r.x.building}` : '', floorShort(r.u), rooms(r.u)].filter(Boolean).join(' · ');
