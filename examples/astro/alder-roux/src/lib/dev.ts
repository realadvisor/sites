/**
 * Development helpers: unit types, plans, ordering, labels. Types come from
 * the data (rooms, attic or not), so a live development with other units
 * gets its own types; a type without a drawn plan shows no plan.
 */
import type { DevelopmentWithUnits, Unit } from '@realadvisor/sites-sdk/types';
import { extraNum, extraStr } from './data';
import { href, unitSlug, type L } from './routes';
import { floor, rooms } from './format';
import { tx } from './copy';

/** Plans drawn for this site (scripts/make-plans.mjs), by type key. */
const PLANS = new Set(['3', '4', '5', '5-attique', '6-attique']);
/** Garden-level variants (ground floor): same plan, terrace and garden outside. */
const REZ = new Set(['3', '4', '5']);

export const typeKey = (u: Pick<Unit, 'rooms' | 'property_type'>) =>
  `${u.rooms ?? 'x'}${/attic|penthouse/.test(u.property_type) ? '-attique' : ''}`;

export type UnitType = { key: string; letter: string; units: Unit[]; plan?: (l: L, u?: Pick<Unit, 'floor'>) => string };

/** Types in the development, lettered A, B, C … by size. */
export function unitTypes(units: Unit[]): UnitType[] {
  const by = new Map<string, Unit[]>();
  for (const u of units) by.set(typeKey(u), [...(by.get(typeKey(u)) ?? []), u]);
  const avg = (us: Unit[]) => us.reduce((a, u) => a + (u.living_surface ?? 0), 0) / us.length;
  return [...by.entries()]
    .sort((a, b) => avg(a[1]) - avg(b[1]))
    .map(([key, us], i) => ({
      key,
      letter: String.fromCharCode(65 + i),
      units: sortUnits(us),
      plan: PLANS.has(key) ? (l: L, u?: Pick<Unit, 'floor'>) => `/plans/${l}/${key}${u?.floor === 0 && REZ.has(key) ? '-rez' : ''}.svg` : undefined,
    }));
}

export const typeOf = (types: UnitType[], u: Unit) => types.find((t) => t.key === typeKey(u));

/** Floor, then the position on the floor (fixture only), else the surface. */
export function sortUnits(units: Unit[]) {
  // fixture only: position on the floor
  const pos = (u: Unit) => extraNum('units', u.id, 'position') ?? 0;
  return [...units].sort((a, b) => (a.floor ?? 0) - (b.floor ?? 0) || pos(a) - pos(b) || (a.living_surface ?? 0) - (b.living_surface ?? 0));
}

/** Unit name for headings: "Lot 2.1" when the fixture has a number, else rooms and floor. */
export function unitTitle(u: Unit, l: L) {
  const t = tx(l);
  // fixture only: unit number
  const no = extraStr('units', u.id, 'unit_number');
  return no ? `${t('unit')} ${no}` : [rooms(u.rooms, l), floor(u.floor, l)].filter(Boolean).join(' · ');
}

/** Unit as named in a sentence: "0.1 (4 pièces · Rez-de-chaussée)", or rooms and floor. */
export function unitInSentence(u: Unit, l: L) {
  // fixture only: unit number
  const no = extraStr('units', u.id, 'unit_number');
  return no ? `${no} (${unitLine(u, l)})` : unitLine(u, l);
}

/** "4 pièces · 1er étage" for selects and subtitles. */
export const unitLine = (u: Unit, l: L) => [rooms(u.rooms, l), floor(u.floor, l)].filter(Boolean).join(' · ');

export const statusLabel = (s: Unit['status'], l: L) => tx(l)(s === 'available' ? 'available' : s === 'reserved' ? 'reserved' : 'sold');

export const unitHref = (d: Pick<DevelopmentWithUnits, 'slug'>, u: Unit, l: L) => href('developments', l, d.slug, unitSlug(u));

/** Enquiry select options in the page language: every unit not sold. */
export const unitSelect = (units: Unit[], l: L) =>
  sortUnits(units)
    .filter((u) => u.status !== 'sold')
    .map((u) => {
      const name = unitTitle(u, l);
      const line = unitLine(u, l);
      return { value: u.id, label: `${name === line ? line : `${name} · ${line}`}${u.status === 'reserved' ? ` (${statusLabel('reserved', l)})` : ''}` };
    });

/** Outdoor surface: terrace (fixture only) else the balcony from the data. */
export const outdoor = (u: Unit) => extraNum('units', u.id, 'terrace_surface') ?? u.balcony_surface;
