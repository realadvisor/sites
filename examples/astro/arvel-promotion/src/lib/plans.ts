/**
 * Indicative floor plans per unit type (T1 to T5), drawn by the site: the API
 * has no plans yet (fixture only, see BRIEFS.md). One geometry per type in
 * metres, all at the same scale; room areas are scaled to the unit's living
 * surface so the labels add up to what the unit table says.
 *
 * `planTree()` returns a small SVG element tree. The site renders it inline
 * (components/FloorPlan.astro), and scripts/plans.ts writes the same tree as
 * public/plans/t1.svg .. t5.svg (documents, thumbnails). One drawing, two outputs.
 */

export type Node = { t: string; a?: Record<string, string | number>; c?: (Node | string)[] };

type Room = { name: string; short?: string; x: number; y: number; w: number; h: number; kind: 'day' | 'night' | 'wet' | 'service'; /** label centre, metres */ lx?: number; ly?: number };
/** A door in a wall. `dir` h: wall along x at y; v: wall along y at x. `side`: swing to +y/+x (1) or -y/-x (-1). */
type Door = { dir: 'h' | 'v'; x: number; y: number; w: number; side: 1 | -1; entry?: boolean };
/** Wall segment left open (no wall). */
type Open = { dir: 'h' | 'v'; x: number; y: number; w: number };
type Win = { wall: 'n' | 's'; x: number; w: number };
type Fixture = { kind: 'bath' | 'shower' | 'wc' | 'kitchen'; x: number; y: number; w: number; h: number };
export type PlanType = { code: string; width: number; depth: number; rooms: Room[]; doors: Door[]; open: Open[]; windows: Win[]; fixtures: Fixture[] };

const area = (r: Room) => r.w * r.h;

/** Generic layout for T3..T5: living room west, a service strip north, a corridor, bedrooms south. */
function layout(code: string, o: { W: number; D: number; liveW: number; northD: number; north: [string, number, Room['kind'], string?][]; south: [string, number][] }): PlanType {
  const { W, D, liveW, northD } = o;
  const corrY = northD;
  const southY = northD + 1;
  const rooms: Room[] = [{ name: 'Séjour · cuisine', x: 0, y: 0, w: liveW, h: D, kind: 'day' }];
  const doors: Door[] = [];
  const fixtures: Fixture[] = [{ kind: 'kitchen', x: 0.15, y: 0.15, w: Math.min(3.4, liveW - 0.6), h: 0.62 }];
  const windows: Win[] = [
    { wall: 's', x: 0.5, w: liveW / 2 - 0.8 },
    { wall: 's', x: liveW / 2 + 0.3, w: liveW / 2 - 0.8 },
  ];
  let x = liveW;
  for (const [name, w, kind, short] of o.north) {
    const r: Room = { name, short, x, y: 0, w, h: northD, kind };
    rooms.push(r);
    if (name === 'Entrée') doors.push({ dir: 'h', x: x + 0.4, y: 0, w: 0.9, side: 1, entry: true });
    else doors.push({ dir: 'h', x: x + 0.25, y: northD, w: Math.min(0.8, w - 0.4), side: -1 });
    if (kind === 'wet' && name.startsWith('Salle de bains')) fixtures.push({ kind: 'bath', x: x + 0.12, y: 0.12, w: Math.min(1.7, w - 0.24), h: 0.75 });
    if (kind === 'wet' && name.startsWith("Salle d'eau")) fixtures.push({ kind: 'shower', x: x + w - 1.02, y: 0.12, w: 0.9, h: 0.9 });
    if (name === 'WC') fixtures.push({ kind: 'wc', x: x + w / 2 - 0.2, y: 0.15, w: 0.4, h: 0.62 });
    if (kind === 'night') windows.push({ wall: 'n', x: x + 0.5, w: w - 1 });
    x += w;
  }
  rooms.push({ name: 'Dégagement', short: 'Dgt', x: liveW, y: corrY, w: W - liveW, h: 1, kind: 'service' });
  const entree = rooms.find((r) => r.name === 'Entrée')!;
  const open: Open[] = [{ dir: 'h', x: entree.x, y: northD, w: entree.w }];
  doors.push({ dir: 'v', x: liveW, y: 0.7, w: 0.9, side: -1 });
  x = liveW;
  o.south.forEach(([name, w]) => {
    rooms.push({ name, x, y: southY, w, h: D - southY, kind: 'night' });
    doors.push({ dir: 'h', x: x + 0.25, y: southY, w: 0.8, side: 1 });
    windows.push({ wall: 's', x: x + 0.45, w: w - 0.9 });
    x += w;
  });
  return { code, width: W, depth: D, rooms, doors, open, windows, fixtures };
}

export const PLANS: Record<string, PlanType> = {
  T1: {
    code: 'T1',
    width: 7,
    depth: 4,
    rooms: [
      { name: 'Séjour · cuisine', x: 0, y: 0, w: 4.6, h: 4, kind: 'day' },
      { name: 'Entrée', x: 4.6, y: 0, w: 2.4, h: 1.8, kind: 'service' },
      { name: "Salle d'eau", short: 'SdE', x: 4.6, y: 1.8, w: 2.4, h: 2.2, kind: 'wet', lx: 5.55, ly: 2.7 },
    ],
    doors: [
      { dir: 'h', x: 5.6, y: 0, w: 0.9, side: 1, entry: true },
      { dir: 'v', x: 4.6, y: 0.45, w: 0.9, side: -1 },
      { dir: 'h', x: 5.55, y: 1.8, w: 0.75, side: 1 },
    ],
    open: [],
    windows: [{ wall: 's', x: 0.5, w: 3.6 }],
    fixtures: [
      { kind: 'kitchen', x: 0.15, y: 0.15, w: 3.2, h: 0.62 },
      { kind: 'shower', x: 6.0, y: 3.0, w: 0.88, h: 0.88 },
      { kind: 'wc', x: 4.8, y: 3.26, w: 0.4, h: 0.62 },
    ],
  },
  T2: {
    code: 'T2',
    width: 8.5,
    depth: 5.5,
    rooms: [
      { name: 'Séjour · cuisine', x: 0, y: 0, w: 5, h: 5.5, kind: 'day' },
      { name: 'Entrée', x: 5, y: 0, w: 1.6, h: 2.3, kind: 'service' },
      { name: 'Salle de bains', short: 'SdB', x: 6.6, y: 0, w: 1.9, h: 2.3, kind: 'wet' },
      { name: 'Chambre', x: 5, y: 2.3, w: 3.5, h: 3.2, kind: 'night' },
    ],
    doors: [
      { dir: 'h', x: 5.35, y: 0, w: 0.9, side: 1, entry: true },
      { dir: 'v', x: 5, y: 0.9, w: 0.9, side: -1 },
      { dir: 'h', x: 5.3, y: 2.3, w: 0.8, side: 1 },
      { dir: 'h', x: 6.85, y: 2.3, w: 0.7, side: -1 },
    ],
    open: [],
    windows: [
      { wall: 's', x: 0.5, w: 1.7 },
      { wall: 's', x: 2.7, w: 1.8 },
      { wall: 's', x: 5.7, w: 2.1 },
    ],
    fixtures: [
      { kind: 'kitchen', x: 0.15, y: 0.15, w: 3.3, h: 0.62 },
      { kind: 'bath', x: 6.72, y: 0.12, w: 1.66, h: 0.75 },
      { kind: 'wc', x: 7.95, y: 1.55, w: 0.4, h: 0.62 },
    ],
  },
  T3: layout('T3', {
    W: 9.75, D: 7, liveW: 4.6, northD: 2.6,
    north: [['Entrée', 1.7, 'service'], ['Salle de bains', 2.25, 'wet', 'SdB'], ['WC', 1.2, 'wet']],
    south: [['Chambre 1', 2.75], ['Chambre 2', 2.4]],
  }),
  T4: layout('T4', {
    W: 12.5, D: 7, liveW: 5.2, northD: 2.6,
    north: [['Entrée', 1.7, 'service'], ['Salle de bains', 2.3, 'wet', 'SdB'], ['WC', 1.2, 'wet'], ["Salle d'eau", 2.1, 'wet', 'SdE']],
    south: [['Chambre 1', 2.7], ['Chambre 2', 2.3], ['Chambre 3', 2.3]],
  }),
  T5: layout('T5', {
    W: 14, D: 7.6, liveW: 5.6, northD: 2.8,
    north: [['Entrée', 1.8, 'service'], ['Salle de bains', 2.4, 'wet', 'SdB'], ['WC', 1.2, 'wet'], ['Chambre 4', 3, 'night']],
    south: [['Chambre 1', 2.9], ['Chambre 2', 2.7], ['Chambre 3', 2.8]],
  }),
};

export const planFor = (rooms?: number) => (rooms ? PLANS[`T${Math.min(5, Math.max(1, Math.round(rooms)))}`] : undefined);
export const nominalSurface = (p: PlanType) => p.rooms.reduce((s, r) => s + area(r), 0);

/** Rooms of a plan with their areas scaled to the unit's surface (the list under the drawing). */
export const roomAreas = (p: PlanType, surface?: number) => {
  const k = surface ? surface / nominalSurface(p) : 1;
  return p.rooms.map((r) => ({ name: r.name, area: Math.round(area(r) * k * 10) / 10 }));
};

export type PlanOptions = {
  /** Living surface of the unit: room areas are scaled to it. */
  surface?: number;
  /** Outdoor area under the south facade. */
  outdoor?: { label: string; surface: number };
  /** Compass bearing the south facade (bottom of the drawing) faces: 180 = south. */
  facadeBearing?: number;
  title?: string;
  /** Text under the drawing (inside the SVG, for files and documents). */
  caption?: string;
};

const S = 44; // px per metre: every plan at the same scale
const M = 1.3; // margin, metres
const C = { wall: '#0E1A24', room: '#FBF8F3', wet: '#EAEFF1', service: '#F4EFE7', night: '#FBF8F3', day: '#FBF8F3', text: '#0E1A24', muted: '#5A646D', out: '#B48C55', thin: '#9AA3AA' };
const fmt = (n: number) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: n < 10 ? 1 : 0 }).format(n);
const n = (v: number) => Math.round(v * 100) / 100;

export function planTree(p: PlanType, o: PlanOptions = {}): Node {
  const k = o.surface ? o.surface / nominalSurface(p) : 1;
  const outD = o.outdoor ? Math.max(1.3, Math.min(3, o.outdoor.surface / p.width)) : 0;
  const W = p.width + 2 * M;
  const H = p.depth + outD + 2 * M + (o.caption ? 1.3 : 0.9);
  const X = (m: number) => n((m + M) * S);
  const Y = (m: number) => n((m + M) * S);
  const els: Node[] = [];
  const wallT = 0.24;
  els.push({ t: 'rect', a: { x: 0, y: 0, width: n(W * S), height: n(H * S), fill: '#FFFFFF' } });
  // outdoor (balcony / terrace), hatched
  if (o.outdoor && outD) {
    els.push({
      t: 'pattern', a: { id: `h-${p.code}`, width: 10, height: 10, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' },
      c: [{ t: 'line', a: { x1: 0, y1: 0, x2: 0, y2: 10, stroke: C.out, 'stroke-width': 1.2, 'stroke-opacity': 0.55 } }],
    });
    els.push({ t: 'rect', a: { x: X(0), y: Y(p.depth), width: n(p.width * S), height: n(outD * S), fill: `url(#h-${p.code})`, stroke: C.out, 'stroke-width': 1.5 } });
    const label = `${o.outdoor.label} · ${fmt(o.outdoor.surface)} m²`;
    const tw = label.length * 6.6 + 18;
    els.push({ t: 'rect', a: { x: n(X(p.width / 2) - tw / 2), y: n(Y(p.depth + outD / 2) - 11), width: n(tw), height: 22, rx: 11, fill: '#FFFFFF' } });
    els.push({ t: 'text', a: { x: X(p.width / 2), y: n(Y(p.depth + outD / 2) + 4), 'text-anchor': 'middle', 'font-size': 11.5, 'letter-spacing': 0.4, fill: C.text }, c: [label] });
  }
  // rooms (fills, then the thin partition lines)
  for (const r of p.rooms) {
    els.push({ t: 'rect', a: { x: X(r.x), y: Y(r.y), width: n(r.w * S), height: n(r.h * S), fill: C[r.kind], stroke: C.wall, 'stroke-width': 3 } });
  }
  // fixtures
  for (const f of p.fixtures) {
    if (f.kind === 'kitchen') {
      els.push({ t: 'rect', a: { x: X(f.x), y: Y(f.y), width: n(f.w * S), height: n(f.h * S), fill: '#E6DED1', stroke: C.thin, 'stroke-width': 1 } });
      els.push({ t: 'circle', a: { cx: X(f.x + f.w * 0.25), cy: Y(f.y + f.h / 2), r: 6, fill: 'none', stroke: C.thin, 'stroke-width': 1 } });
      els.push({ t: 'circle', a: { cx: X(f.x + f.w * 0.25 + 0.4), cy: Y(f.y + f.h / 2), r: 6, fill: 'none', stroke: C.thin, 'stroke-width': 1 } });
      els.push({ t: 'rect', a: { x: X(f.x + f.w * 0.62), y: Y(f.y + 0.12), width: n(0.6 * S), height: n((f.h - 0.24) * S), rx: 3, fill: 'none', stroke: C.thin, 'stroke-width': 1 } });
    } else if (f.kind === 'bath') {
      els.push({ t: 'rect', a: { x: X(f.x), y: Y(f.y), width: n(f.w * S), height: n(f.h * S), rx: 10, fill: '#FFFFFF', stroke: C.thin, 'stroke-width': 1.2 } });
      els.push({ t: 'rect', a: { x: X(f.x + 0.1), y: Y(f.y + 0.1), width: n((f.w - 0.2) * S), height: n((f.h - 0.2) * S), rx: 8, fill: 'none', stroke: C.thin, 'stroke-width': 1 } });
    } else if (f.kind === 'shower') {
      els.push({ t: 'rect', a: { x: X(f.x), y: Y(f.y), width: n(f.w * S), height: n(f.h * S), fill: '#FFFFFF', stroke: C.thin, 'stroke-width': 1.2 } });
      els.push({ t: 'path', a: { d: `M${X(f.x)} ${Y(f.y)}L${X(f.x + f.w)} ${Y(f.y + f.h)}M${X(f.x + f.w)} ${Y(f.y)}L${X(f.x)} ${Y(f.y + f.h)}`, stroke: C.thin, 'stroke-width': 0.8 } });
    } else if (f.kind === 'wc') {
      els.push({ t: 'rect', a: { x: X(f.x), y: Y(f.y), width: n(f.w * S), height: n(0.18 * S), fill: '#FFFFFF', stroke: C.thin, 'stroke-width': 1.2 } });
      els.push({ t: 'ellipse', a: { cx: X(f.x + f.w / 2), cy: Y(f.y + 0.18 + (f.h - 0.18) / 2), rx: n((f.w / 2) * S), ry: n(((f.h - 0.18) / 2) * S), fill: '#FFFFFF', stroke: C.thin, 'stroke-width': 1.2 } });
    }
  }
  // exterior wall
  els.push({ t: 'rect', a: { x: X(0), y: Y(0), width: n(p.width * S), height: n(p.depth * S), fill: 'none', stroke: C.wall, 'stroke-width': n(wallT * S) } });
  const gap = (dir: 'h' | 'v', x: number, y: number, w: number, thick: number) =>
    dir === 'h'
      ? { t: 'rect', a: { x: X(x), y: n(Y(y) - thick / 2), width: n(w * S), height: n(thick), fill: '#FFFFFF' } }
      : { t: 'rect', a: { x: n(X(x) - thick / 2), y: Y(y), width: n(thick), height: n(w * S), fill: '#FFFFFF' } };
  // open passages (no wall)
  for (const op of p.open) els.push({ ...gap(op.dir, op.x + 0.03, op.y, op.w - 0.06, 5), a: { ...gap(op.dir, op.x + 0.03, op.y, op.w - 0.06, 5).a, fill: C.service } });
  // windows: a gap in the outer wall with a double glazing line
  for (const w of p.windows) {
    const y = w.wall === 's' ? p.depth : 0;
    els.push(gap('h', w.x, y, w.w, wallT * S + 1));
    els.push({ t: 'path', a: { d: `M${X(w.x)} ${n(Y(y) - 3)}H${X(w.x + w.w)}M${X(w.x)} ${n(Y(y) + 3)}H${X(w.x + w.w)}`, stroke: C.wall, 'stroke-width': 1.2 } });
    els.push({ t: 'path', a: { d: `M${X(w.x)} ${n(Y(y) - 5)}V${n(Y(y) + 5)}M${X(w.x + w.w)} ${n(Y(y) - 5)}V${n(Y(y) + 5)}`, stroke: C.wall, 'stroke-width': 1.5 } });
  }
  // doors: gap, leaf and swing
  for (const d of p.doors) {
    const thick = d.entry ? wallT * S + 1 : 5;
    els.push(gap(d.dir, d.x, d.y, d.w, thick));
    const r = n(d.w * S);
    if (d.dir === 'h') {
      const hx = X(d.x), hy = Y(d.y), ey = n(hy + d.side * r);
      els.push({ t: 'path', a: { d: `M${hx} ${hy}V${ey}`, stroke: C.wall, 'stroke-width': 2 } });
      els.push({ t: 'path', a: { d: `M${n(hx + r)} ${hy}A${r} ${r} 0 0 ${d.side === 1 ? 1 : 0} ${hx} ${ey}`, fill: 'none', stroke: C.thin, 'stroke-width': 1, 'stroke-dasharray': '3 3' } });
    } else {
      const hx = X(d.x), hy = Y(d.y), ex = n(hx + d.side * r);
      els.push({ t: 'path', a: { d: `M${hx} ${hy}H${ex}`, stroke: C.wall, 'stroke-width': 2 } });
      els.push({ t: 'path', a: { d: `M${hx} ${n(hy + r)}A${r} ${r} 0 0 ${d.side === 1 ? 0 : 1} ${ex} ${hy}`, fill: 'none', stroke: C.thin, 'stroke-width': 1, 'stroke-dasharray': '3 3' } });
    }
  }
  // labels
  for (const r of p.rooms) {
    const cx = X(r.lx ?? r.x + r.w / 2);
    const cy = Y(r.ly ?? r.y + r.h / 2) + (r.name.startsWith('Séjour') ? 14 : 0);
    const small = r.w < 2.6 || r.h < 1.2;
    const name = small && r.short ? r.short : r.name;
    const a = area(r) * k;
    els.push({ t: 'text', a: { x: cx, y: n(cy - (r.h < 1.2 ? -4 : 3)), 'text-anchor': 'middle', 'font-size': small ? 10.5 : 12, 'letter-spacing': 1, 'font-weight': 600, fill: C.text }, c: [name.toUpperCase()] });
    if (r.h >= 1.2) els.push({ t: 'text', a: { x: cx, y: n(cy + 15), 'text-anchor': 'middle', 'font-size': 13, fill: C.muted }, c: [`${fmt(a)} m²`] });
  }
  // north arrow (rotated so it points to true north for this unit's facade)
  const bearing = o.facadeBearing ?? 180;
  const rot = n(180 - bearing);
  const ax = n((W - 0.75) * S), ay = n(0.75 * S);
  els.push({
    t: 'g', a: { transform: `translate(${ax} ${ay})` },
    c: [
      { t: 'circle', a: { r: 19, fill: '#FFFFFF', stroke: C.wall, 'stroke-width': 1 } },
      { t: 'g', a: { transform: `rotate(${rot})` }, c: [
        { t: 'path', a: { d: 'M0 -14L5 4L0 1L-5 4Z', fill: C.wall } },
        { t: 'text', a: { y: -21, 'text-anchor': 'middle', 'font-size': 10, 'font-weight': 700, fill: C.wall, transform: `rotate(${-rot} 0 -24)` }, c: ['N'] },
      ] },
    ],
  });
  // scale bar: 2 m
  const sx = X(0), sy = n((p.depth + outD + M + 0.75) * S);
  els.push({ t: 'path', a: { d: `M${sx} ${sy}H${n(sx + 2 * S)}M${sx} ${n(sy - 4)}V${n(sy + 4)}M${n(sx + S)} ${n(sy - 3)}V${n(sy + 3)}M${n(sx + 2 * S)} ${n(sy - 4)}V${n(sy + 4)}`, stroke: C.wall, 'stroke-width': 1.2 } });
  els.push({ t: 'text', a: { x: n(sx + 2 * S + 8), y: n(sy + 4), 'font-size': 10.5, fill: C.muted }, c: ['2 m'] });
  if (o.caption) els.push({ t: 'text', a: { x: sx, y: n(sy + 28), 'font-size': 10.5, fill: C.muted }, c: [o.caption] });
  return {
    t: 'svg',
    a: { xmlns: 'http://www.w3.org/2000/svg', viewBox: `0 0 ${n(W * S)} ${n(H * S)}`, width: n(W * S), height: n(H * S), 'font-family': 'Jost, "Helvetica Neue", Arial, sans-serif', role: 'img', 'aria-label': o.title ?? `Plan indicatif ${p.code}` },
    c: [{ t: 'title', c: [o.title ?? `Plan indicatif ${p.code}`] }, ...els],
  };
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
/** The tree as an SVG file (scripts/plans.ts). */
export const toSvg = (node: Node | string): string =>
  typeof node === 'string'
    ? esc(node)
    : `<${node.t}${Object.entries(node.a ?? {}).map(([k, v]) => ` ${k}="${esc(String(v))}"`).join('')}${node.c?.length ? `>${node.c.map(toSvg).join('')}</${node.t}>` : '/>'}`;
