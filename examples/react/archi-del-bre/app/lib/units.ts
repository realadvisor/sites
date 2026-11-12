/**
 * Unit helpers in this site's own words. Same rules as the kit's: sold and
 * reserved units never show a price, rooms with a dot ("2.5 locali").
 * Building and position on the floor are fixture only (read through
 * unitExtra()).
 */
import type { DevelopmentWithUnits, Unit } from '@realadvisor/sites-sdk/types';
import { formatAmount, formatSurface } from '@realadvisor/sites-kit-core/format';
import { formatRooms as kitRooms } from '@realadvisor/sites-kit-core/developments';
import { t, type StringKey } from '@realadvisor/sites-kit-core/i18n';
import { unitExtra } from './extras';
import { href, slugify, type L } from './routes';

export { formatSurface, formatAmount };

export const formatRooms = (r: number | undefined | null, l: L) => kitRooms(r, l);
export const statusLabel = (u: Pick<Unit, 'status'>, l: L) => t(u.status as StringKey, {}, l);

/** fixture only: the building letter ("A"), '' when unknown. */
export const building = (u: Pick<Unit, 'id'>) => unitExtra(u).building ?? ''; // fixture only: building
export const buildingName = (b: string, l: L) => (b ? (l === 'de' ? `Haus ${b}` : `Casa ${b}`) : '');

/** "A1.2" */
export const unitNumber = (u: Pick<Unit, 'reference'>) => u.reference ?? '';

/** The top floor of the unit's building (its penthouses). */
const topFloor = (u: Unit, all: Unit[]) =>
  Math.max(...all.filter((x) => building(x) === building(u)).map((x) => x.floor ?? 0));
export const isPenthouse = (u: Unit, all: Unit[]) => (u.floor ?? 0) > 0 && u.floor === topFloor(u, all);

/** "Piano terra" / "2° piano" / "Attico"; German "Erdgeschoss" / "2. Obergeschoss" / "Attika". */
export function floorName(u: Unit, l: L, all?: Unit[]): string {
  if (all && isPenthouse(u, all)) return l === 'de' ? 'Attika' : 'Attico';
  const f = u.floor;
  if (f == null) return l === 'it' ? (u.floor_label ?? '') : '';
  if (l === 'it') return u.floor_label ?? (f === 0 ? 'Piano terra' : `${f}° piano`);
  return f === 0 ? 'Erdgeschoss' : `${f}. Obergeschoss`;
}
/** Short floor for tables: "PT" / "1°" ; "EG" / "1. OG". */
export function floorShort(u: Unit, l: L): string {
  const f = u.floor ?? 0;
  if (l === 'it') return f === 0 ? 'PT' : `${f}°`;
  return f === 0 ? 'EG' : `${f}. OG`;
}

/** Price cell: only available units with a public price show an amount. */
export function unitPrice(u: Pick<Unit, 'status' | 'price' | 'price_on_request'>, l: L): string {
  if (u.status !== 'available') return statusLabel(u, l);
  if (u.price_on_request || !u.price) return t('priceOnRequest', {}, l);
  return formatAmount(u.price);
}
export const hasPrice = (u: Unit) => u.status === 'available' && !u.price_on_request && !!u.price;

/** "2.5 locali, piano terra, Casa A" */
export const unitLabel = (u: Unit, l: L, all?: Unit[]) =>
  [formatRooms(u.rooms, l) || t('unit', {}, l), l === 'it' ? floorName(u, l, all).toLowerCase() : floorName(u, l, all), buildingName(building(u), l)]
    .filter(Boolean)
    .join(', ');

/** "A0.1 · 2.5 locali, piano terra, Casa A" */
export const unitTitle = (u: Unit, l: L, all?: Unit[]) => [unitNumber(u), unitLabel(u, l, all)].filter(Boolean).join(' · ');

/** /appartamenti/a0-1-2-5-locali-027573e3: readable, resolved by the id prefix at its end. */
export const unitSlug = (u: Unit, l: L) =>
  `${slugify(`${unitNumber(u) || floorShort(u, l)} ${formatRooms(u.rooms, l)}`)}-${u.id.slice(0, 8)}`;
export const unitPath = (u: Unit, l: L) => href('units', l, unitSlug(u, l));
export const shortId = (u: Pick<Unit, 'id'>) => u.id.slice(0, 8);

export const unitFromSlug = (dev: DevelopmentWithUnits, slug: string) => {
  const id = slug.match(/([0-9a-f]{8})$/i)?.[1]?.toLowerCase();
  return (id && dev.units.find((u) => u.id.startsWith(id))) || null;
};
/** Units from "027573e3,9b1c2d3e" (shortlist URLs), at most `max`, unknown ids dropped. */
export const unitsFromIds = (dev: DevelopmentWithUnits, raw: string | null, max = 3) =>
  [...new Set((raw ?? '').toLowerCase().split(/[,\s]+/).filter((s) => /^[0-9a-f]{8}$/.test(s)))]
    .map((id) => dev.units.find((u) => u.id.startsWith(id)))
    .filter((u): u is Unit => !!u)
    .slice(0, max);

/** Table order: building, floor from the top, position on the floor (fixture only). */
export const sortUnits = (units: Unit[]) =>
  [...units].sort(
    (a, b) =>
      building(a).localeCompare(building(b)) ||
      (a.floor ?? 0) - (b.floor ?? 0) ||
      (unitExtra(a).position ?? 99) - (unitExtra(b).position ?? 99) || // fixture only: position on the floor
      (a.rooms ?? 0) - (b.rooms ?? 0),
  );

export type Outdoor = { kind: 'garden' | 'terrace' | 'loggia'; m2: number };
const OUT_LABEL: Record<L, Record<Outdoor['kind'], string>> = {
  it: { garden: 'Giardino privato', terrace: 'Terrazza', loggia: 'Loggia' },
  de: { garden: 'Privatgarten', terrace: 'Terrasse', loggia: 'Loggia' },
};
export const outdoorLabel = (o: Outdoor, l: L) => OUT_LABEL[l][o.kind];

/** Outdoor spaces: garden, the roof terrace or the balcony surface as loggia / covered terrace. */
export function outdoors(u: Unit): Outdoor[] {
  const out: Outdoor[] = [];
  if (u.garden_surface) out.push({ kind: 'garden', m2: u.garden_surface });
  if (u.terrace_surface && !u.garden_surface) out.push({ kind: 'terrace', m2: u.terrace_surface });
  else if (u.balcony_surface) out.push({ kind: u.garden_surface ? 'terrace' : 'loggia', m2: u.balcony_surface });
  return out;
}
/** The main outdoor space for a table cell. */
export const mainOutdoor = (u: Unit) => outdoors(u)[0] ?? null;

const ORIENT: Record<L, Record<string, string>> = {
  it: { N: 'Nord', S: 'Sud', E: 'Est', W: 'Ovest', NE: 'Nord-est', NW: 'Nord-ovest', SE: 'Sud-est', SW: 'Sud-ovest' },
  de: { N: 'Nord', S: 'Süd', E: 'Ost', W: 'West', NE: 'Nordost', NW: 'Nordwest', SE: 'Südost', SW: 'Südwest' },
};
/** The orientation as a compass code: ['south', 'west'] -> "SW". */
const orientationCode = (u: Pick<Unit, 'orientation'>) => (u.orientation ?? []).map((d) => d[0]!.toUpperCase()).join('');
/** The orientation, in words. */
export const orientation = (u: Unit, l: L) => {
  const o = orientationCode(u);
  return o ? (ORIENT[l][o] ?? o) : '';
};

/** Unit options for EnquiryForm (every unit not sold), labelled with the unit number when known. */
export const unitOptions = (units: Unit[], l: L) =>
  sortUnits(units)
    .filter((u) => u.status !== 'sold')
    .map((u) => ({
      value: u.id,
      label: unitTitle(u, l, units) + (u.status === 'reserved' ? ` (${statusLabel(u, l)})` : ''),
    }));

/** "giugno 2028" / "Juni 2028" */
export const deliveryLabel = (dev: Pick<DevelopmentWithUnits, 'delivery_date'>, l: L) =>
  dev.delivery_date
    ? new Intl.DateTimeFormat(l === 'de' ? 'de-CH' : 'it-CH', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(dev.delivery_date))
    : '';

export type UnitType = {
  key: string;
  rooms: number;
  penthouse: boolean;
  units: Unit[];
  available: Unit[];
  surface: { min: number; max: number } | null;
  priceFrom: number | null;
};

/** One entry per room count, the penthouses apart: for the type list and the filters. */
export function unitTypes(units: Unit[]): UnitType[] {
  const by = new Map<string, Unit[]>();
  for (const u of units) {
    if (u.rooms == null) continue;
    const k = `${u.rooms}${isPenthouse(u, units) ? '-attico' : ''}`;
    by.set(k, [...(by.get(k) ?? []), u]);
  }
  return [...by.entries()]
    .map(([key, us]) => {
      const available = us.filter((u) => u.status === 'available');
      const prices = available.filter(hasPrice).map((u) => u.price!);
      const s = us.flatMap((u) => (u.living_surface ? [u.living_surface] : []));
      return {
        key,
        rooms: us[0]!.rooms!,
        penthouse: key.endsWith('-attico'),
        units: us,
        available,
        surface: s.length ? { min: Math.min(...s), max: Math.max(...s) } : null,
        priceFrom: prices.length ? Math.min(...prices) : null,
      };
    })
    .sort((a, b) => Number(a.penthouse) - Number(b.penthouse) || a.rooms - b.rooms);
}

/**
 * The drawn plan of a unit (public/plans/, our own indicative drawings: the
 * API has no floor plans). One plan per room count, a garden variant on the
 * ground floor, the penthouse plans on the top floor.
 */
export function planKey(u: Unit, all: Unit[]): string | null {
  const r = u.rooms;
  if (r == null) return null;
  const k = String(r).replace('.', '');
  if (isPenthouse(u, all)) return ['45', '55'].includes(k) ? `attico-${k}` : null;
  if (!['25', '35', '45'].includes(k)) return null;
  return u.floor === 0 ? `${k}-giardino` : k;
}
export const planSrc = (key: string | null, l: L, fit = false) => (key ? `/plans/${l}/plan-${key}${fit ? '-fit' : ''}.svg` : null);

export const range = (xs: number[]) => (xs.length ? { min: Math.min(...xs), max: Math.max(...xs) } : null);
