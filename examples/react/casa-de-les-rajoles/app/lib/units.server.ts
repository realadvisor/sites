/**
 * Unit helpers in this site's own words. Rules as in the kit:
 * sold and reserved units never show a price.
 *
 * The API has no building per unit. This development's two wings are told
 * apart by the unit title the developer writes in the CRM: titles of the new
 * wing end in "ala nueva" (the convention given in the site brief). The
 * street numbers of the two wings come from the brief too (src/content/site.ts).
 */
import type { DevelopmentWithUnits, Unit } from '@realadvisor/sites-sdk/types';
import { formatAmount, formatSurface } from '@realadvisor/sites-kit/format';
import { unitExtra } from './data.server';
import { type Lang, href, tr } from './i18n';

export { formatAmount, formatSurface };

export type Wing = '1908' | 'nueva';
export const WINGS: readonly Wing[] = ['1908', 'nueva'];

export const wingOf = (u: Pick<Unit, 'name'>): Wing => (/ala nueva\s*$/i.test(u.name.trim()) ? 'nueva' : '1908');

/** Typology: studio, 1 to 4 bedrooms, penthouse. */
export type Kind = 'estudio' | '1d' | '2d' | '3d' | '4d' | 'atico';
export const KINDS: readonly Kind[] = ['estudio', '1d', '2d', '3d', '4d', 'atico'];

export function kindOf(u: Pick<Unit, 'property_type' | 'bedrooms' | 'rooms'>): Kind {
  if (u.property_type.startsWith('apartment_penthouse')) return 'atico';
  if (u.property_type === 'apartment_studio' || u.bedrooms === 0) return 'estudio';
  const b = Math.min(4, Math.max(1, u.bedrooms ?? Math.max(1, (u.rooms ?? 2) - 1)));
  return `${b}d` as Kind;
}

/**
 * The drawn plan a unit uses (public/plans/<key>.svg): one per wing and
 * typology, plus the ground-floor studio with its patio and the two
 * penthouse sizes. Units of one key share their layout.
 */
export function planKey(u: Unit): string {
  const w = wingOf(u);
  const k = kindOf(u);
  if (k === 'atico') return `${w}-atico-${u.bedrooms ?? 2}d`;
  if (k === 'estudio' && u.floor === 0) return `${w}-estudio-patio`;
  return `${w}-${k}`;
}
export const planSrc = (key: string, l: Lang, fit = false) => `/plans/${l}/${key}${fit ? '-fit' : ''}.svg`;

/** "3.2" (fixture only: unit number), else ''. */
export const unitNumber = (u: Pick<Unit, 'id'>) => unitExtra(u).unit_number ?? ''; // fixture only: unit number

/** Floor name: the CRM label in Spanish, else from the number. */
export function floorName(u: Pick<Unit, 'floor' | 'floor_label'>, l: Lang): string {
  if (l === 'es' && u.floor_label) return u.floor_label;
  return floorOf(u.floor ?? 0, l);
}
export const floorOf = (f: number, l: Lang) => (f === 0 ? tr(l).ground : `${tr(l).floor} ${f}`);

export const kindLabel = (k: Kind, l: Lang, n = 1) => {
  const s = tr(l).kinds[k];
  return n === 1 ? s[0] : s[1];
};

/** Unit title: the CRM title in Spanish; in English, built from the same facts. */
export function unitTitle(u: Unit, l: Lang): string {
  if (l === 'es') return u.name;
  const t = tr(l);
  const k = kindOf(u);
  const what = k === 'atico' ? `${t.kinds.atico[0]}, ${u.bedrooms} ${t.bedroomsShort}` : kindLabel(k, l);
  return [what, floorName(u, l).toLowerCase(), wingOf(u) === 'nueva' ? t.wings.nueva.toLowerCase() : ''].filter(Boolean).join(', ');
}

/** "Vivienda 3.2" / "Home 3.2" (fixture only: number), else the title. */
export const unitShort = (u: Unit, l: Lang) => (unitNumber(u) ? `${tr(l).unit} ${unitNumber(u)}` : unitTitle(u, l));

export const statusLabel = (u: Pick<Unit, 'status'>, l: Lang) => tr(l).status[u.status];

/** Price cell: only available units with a public price show an amount. */
export function unitPrice(u: Pick<Unit, 'status' | 'price' | 'price_on_request'>, l: Lang): string {
  if (u.status !== 'available') return statusLabel(u, l);
  if (u.price_on_request || !u.price) return tr(l).onRequest;
  return formatAmount(u.price);
}

export type Outdoor = { kind: 'patio' | 'terrace' | 'balcony'; m2: number };

/** Outdoor space: the fixture's terrace or patio (fixture only), else the API's balcony surface. */
export function outdoor(u: Unit): Outdoor | null {
  const x = unitExtra(u);
  if (x.terrace_surface) return { kind: u.floor === 0 ? 'patio' : 'terrace', m2: x.terrace_surface }; // fixture only: terrace surface
  if (u.balcony_surface) return { kind: 'balcony', m2: u.balcony_surface };
  return null;
}
export const outdoorLabel = (o: Outdoor | null, l: Lang) => (o ? tr(l).outdoor[o.kind] : tr(l).outdoor.none);

/** fixture only: orientation, in words. */
export const orientation = (u: Pick<Unit, 'id'>, l: Lang) => {
  const o = unitExtra(u).orientation; // fixture only: orientation
  return o ? (tr(l).orient[o as keyof ReturnType<typeof tr>['orient']] ?? o) : '';
};

/** fixture only: position on the floor, for the floor plate and ordering. */
export const positionOf = (u: Pick<Unit, 'id'>) => unitExtra(u).position; // fixture only: position

/** Floor, then position on the floor (fixture only), then size. */
export const sortUnits = (units: Unit[]) =>
  [...units].sort(
    (a, b) =>
      (a.floor ?? 0) - (b.floor ?? 0) ||
      (positionOf(a) ?? 99) - (positionOf(b) ?? 99) ||
      (a.living_surface ?? 0) - (b.living_surface ?? 0),
  );

const slugify = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/** "<title-slug>-<id>": readable, resolved by the id at its end. */
export const unitSlug = (u: Unit) => `${slugify(u.name)}-${u.id}`;

const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const unitFromSlug = (dev: DevelopmentWithUnits, slug: string) => {
  const id = slug.match(UUID_RE)?.[0];
  return (id && dev.units.find((u) => u.id === id)) || null;
};

/** Unit options for EnquiryForm: every unit not sold, with its number when known. */
export const unitOptions = (units: Unit[], l: Lang) =>
  sortUnits(units)
    .filter((u) => u.status !== 'sold')
    .map((u) => ({
      value: u.id,
      label:
        [unitNumber(u) && `${tr(l).unit} ${unitNumber(u)}`, unitTitle(u, l)].filter(Boolean).join(' · ') +
        (u.status === 'reserved' ? ` (${statusLabel(u, l)})` : ''),
    }));

export type Range = { min: number; max: number };
export const range = (xs: number[]): Range | null => (xs.length ? { min: Math.min(...xs), max: Math.max(...xs) } : null);
export const fmtRange = (r: Range | null, f: (n: number) => string = String, sep = '–') =>
  !r ? '' : r.min === r.max ? f(r.min) : `${f(r.min)}${sep}${f(r.max)}`;
export const m2 = (n: number) => `${n} m²`;
export const m2Range = (r: Range | null) => (r ? `${fmtRange(r, String)} m²` : '');

/** Lowest public price of the available units, or null. */
export const fromPrice = (units: Unit[]) =>
  range(units.filter((u) => u.status === 'available' && u.price && !u.price_on_request).map((u) => u.price!))?.min ?? null;

/** Floors of one wing, top first. */
export const floorsOf = (units: Unit[], w: Wing) =>
  [...new Set(units.filter((u) => wingOf(u) === w).map((u) => u.floor ?? 0))].sort((a, b) => b - a);

/** "septiembre de 2027" / "September 2027" */
export const deliveryLabel = (dev: Pick<DevelopmentWithUnits, 'delivery_date'>, l: Lang) =>
  dev.delivery_date
    ? new Intl.DateTimeFormat(l === 'es' ? 'es-ES' : 'en-GB', { month: 'long', year: 'numeric' }).format(new Date(dev.delivery_date))
    : '';

/** Plan variants in display order, with the units drawn on each. */
export function planVariants(units: Unit[]) {
  const map = new Map<string, Unit[]>();
  for (const u of sortUnits(units)) map.set(planKey(u), [...(map.get(planKey(u)) ?? []), u]);
  // Typology tab first, then the wing, then size within the tab.
  const order = (k: string) => {
    const u = map.get(k)![0]!;
    return KINDS.indexOf(kindOf(u)) * 100 + (wingOf(u) === 'nueva' ? 10 : 0) + (u.bedrooms ?? 0) + (k.includes('patio') ? -1 : 0);
  };
  return [...map.keys()].sort((a, b) => order(a) - order(b)).map((key) => {
    const us = map.get(key)!;
    const outs = us.map(outdoor).filter((o): o is Outdoor => !!o);
    return {
      key,
      kind: kindOf(us[0]!),
      wing: wingOf(us[0]!),
      units: us,
      interior: range(us.flatMap((u) => (u.living_surface ? [u.living_surface] : []))),
      outdoor: range(outs.map((o) => o.m2)),
      outdoorKind: outs[0]?.kind ?? null,
      bedrooms: us[0]!.bedrooms ?? 0,
      bathrooms: range(us.flatMap((u) => (u.bathrooms ? [u.bathrooms] : []))),
      available: us.filter((u) => u.status === 'available'),
      priceFrom: fromPrice(us),
    };
  });
}
export type PlanVariant = ReturnType<typeof planVariants>[number];

/**
 * One unit as the pages render it (React port): every label in the page's
 * language, computed on the server so components never read fixture extras.
 */
export function unitRow(u: Unit, l: Lang) {
  const t = tr(l);
  const o = outdoor(u);
  const k = kindOf(u);
  return {
    id: u.id,
    status: u.status,
    href: hrefUnit(u, l),
    number: unitNumber(u),
    title: unitTitle(u, l),
    statusLabel: statusLabel(u, l),
    price: unitPrice(u, l),
    living: u.living_surface ?? null,
    bedrooms: u.bedrooms ?? null,
    floor: u.floor ?? 0,
    floorOf: floorOf(u.floor ?? 0, l),
    floorName: floorName(u, l),
    wing: wingOf(u),
    kind: k,
    outdoor: o,
    outdoorLabel: outdoorLabel(o, l),
    orientation: orientation(u, l),
    /** Units list: "Ático, 2 dormitorios" / "2 dormitorios". */
    what: k === 'atico' ? `${t.kinds.atico[0]}, ${kindLabel(`${Math.min(4, u.bedrooms ?? 1)}d` as Kind, l)}` : kindLabel(k, l),
    /** Floor plate label: "Estudio", "2 dorm.", "Ático, 2 dorm.". */
    short: plateShort(u, l),
  };
}
export type UnitRow = ReturnType<typeof unitRow>;

const hrefUnit = (u: Unit, l: Lang) => href('units', l, unitSlug(u));

function plateShort(u: Unit, l: Lang) {
  const kd = kindOf(u);
  if (kd === 'estudio') return l === 'es' ? 'Estudio' : 'Studio';
  const b = l === 'es' ? `${u.bedrooms} dorm.` : `${u.bedrooms} bed`;
  return kd === 'atico' ? `${tr(l).kinds.atico[0]}, ${b}` : b;
}
