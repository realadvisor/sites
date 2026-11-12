/**
 * Unit filters, shared by the server (GET form, works without JS) and the
 * bundled script (same rules, URL kept in sync with replaceState).
 * Params: rooms=2.5, house=A, floor=0|1|2|top, max=1500000, avail=1.
 */
export type Filters = { rooms: string; house: string; floor: string; max: string; avail: boolean };
export type UnitFacts = { rooms: string; house: string; floor: string; top: boolean; price: number | null; status: string };

export const parseFilters = (q: URLSearchParams): Filters => ({
  rooms: /^\d+(\.5)?$/.test(q.get('rooms') ?? '') ? q.get('rooms')! : '',
  house: /^[A-Z]$/.test(q.get('house') ?? '') ? q.get('house')! : '',
  floor: /^(\d+|top)$/.test(q.get('floor') ?? '') ? q.get('floor')! : '',
  max: /^\d+$/.test(q.get('max') ?? '') ? q.get('max')! : '',
  avail: q.get('avail') === '1',
});

export const matches = (f: Filters, u: UnitFacts) =>
  (!f.rooms || u.rooms === f.rooms) &&
  (!f.house || u.house === f.house) &&
  (!f.floor || (f.floor === 'top' ? u.top : !u.top && u.floor === f.floor)) &&
  (!f.max || (u.price != null && u.price <= Number(f.max))) &&
  (!f.avail || u.status === 'available');

export const isActive = (f: Filters) => !!(f.rooms || f.house || f.floor || f.max || f.avail);

export const toQuery = (f: Filters) => {
  const q = new URLSearchParams();
  if (f.rooms) q.set('rooms', f.rooms);
  if (f.house) q.set('house', f.house);
  if (f.floor) q.set('floor', f.floor);
  if (f.max) q.set('max', f.max);
  if (f.avail) q.set('avail', '1');
  return q.toString();
};
