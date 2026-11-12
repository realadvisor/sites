#!/usr/bin/env node
/**
 * Draws the indicative floor plans in public/plans/{es,en}/ (the API has no
 * plans). One drawing per plan key (wing + typology, see planKey() in
 * src/lib/units.ts), sized from the largest unit of that key in the fixture,
 * all on one canvas and one scale (1 SVG unit = 1 m), so a studio looks
 * smaller than a penthouse, as it is. Walls, doors with their swing, windows,
 * room names with m², outdoor space tinted, a 5 m scale bar and a north arrow.
 * `<key>-fit.svg` hugs the drawing for the type cards.
 * Run: pnpm plans
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const fx = JSON.parse(readFileSync('src/data/fixture.json', 'utf8'));
const dev = fx.developments[0];
const ux = (u) => fx.fixture_only.units[u.id] ?? {}; // fixture only: terrace surface

// Same rules as src/lib/units.ts.
const wingOf = (u) => (/ala nueva\s*$/i.test(u.name.trim()) ? 'nueva' : '1908');
const kindOf = (u) => (u.property_type.startsWith('apartment_penthouse') ? 'atico' : u.property_type === 'apartment_studio' || u.bedrooms === 0 ? 'estudio' : `${Math.min(4, u.bedrooms)}d`);
const planKey = (u) => {
  const w = wingOf(u);
  const k = kindOf(u);
  if (k === 'atico') return `${w}-atico-${u.bedrooms}d`;
  if (k === 'estudio' && u.floor === 0) return `${w}-estudio-patio`;
  return `${w}-${k}`;
};
const outdoorOf = (u) => (ux(u).terrace_surface ? { kind: u.floor === 0 ? 'patio' : 'terrace', m2: ux(u).terrace_surface } : u.balcony_surface ? { kind: 'balcony', m2: u.balcony_surface } : null);

const variants = new Map();
for (const u of dev.units) {
  const k = planKey(u);
  const v = variants.get(k) ?? { key: k, wing: wingOf(u), kind: kindOf(u), bedrooms: u.bedrooms ?? 0, area: 0, out: null, baths: 1, duplex: false };
  v.area = Math.max(v.area, u.living_surface ?? 0);
  v.baths = Math.max(v.baths, u.bathrooms ?? 1);
  const o = outdoorOf(u);
  if (o && (!v.out || o.m2 > v.out.m2)) v.out = o;
  if (/d[uú]plex/i.test(u.name)) v.duplex = true;
  variants.set(k, v);
}

const L = {
  es: {
    bed: (i) => `Dormitorio ${i}`, bed1: 'Dormitorio', bath: (i) => (i ? `Baño ${i}` : 'Baño'), wc: 'Aseo', hall: 'Recibidor', living: 'Salón-comedor', room: 'Estancia', kitchen: 'Cocina',
    patio: 'Patio', terrace: 'Terraza', balcony: 'Balcón', entry: 'Entrada', stairs: 'Escalera', lower: 'Nivel inferior', upper: 'Nivel superior',
    note: 'Plano indicativo, no contractual', title: (v) => `Plano indicativo: ${kindName.es(v)}, ${v.wing === 'nueva' ? 'ala nueva' : 'edificio 1908'}`,
  },
  en: {
    bed: (i) => `Bedroom ${i}`, bed1: 'Bedroom', bath: (i) => (i ? `Bathroom ${i}` : 'Bathroom'), wc: 'WC', hall: 'Hall', living: 'Living-dining', room: 'Living', kitchen: 'Kitchen',
    patio: 'Patio', terrace: 'Terrace', balcony: 'Balcony', entry: 'Entrance', stairs: 'Stairs', lower: 'Lower level', upper: 'Upper level',
    note: 'Indicative plan, not contractual', title: (v) => `Indicative plan: ${kindName.en(v)}, ${v.wing === 'nueva' ? 'new wing' : '1908 building'}`,
  },
};
const kindName = {
  es: (v) => (v.kind === 'estudio' ? 'estudio' : v.kind === 'atico' ? `ático de ${v.bedrooms} dormitorios` : `${v.bedrooms} dormitorio${v.bedrooms > 1 ? 's' : ''}`),
  en: (v) => (v.kind === 'estudio' ? 'studio' : v.kind === 'atico' ? `${v.bedrooms}-bedroom penthouse` : `${v.bedrooms} bedroom${v.bedrooms > 1 ? 's' : ''}`),
};

/**
 * Layout templates in fractions of the footprint: [label, x, y, w, h, door, windows, entry].
 * Top edge = landing side (entrance), bottom edge = façade (street for the
 * 1908 building, courtyard for the new wing). door: [side, fraction along the wall].
 */
const TPL = {
  0: (t) => [
    [t.bath(0), 0, 0, 0.3, 0.44, ['b', 0.72], ''],
    [t.hall, 0.3, 0, 0.28, 0.44, ['b', 0.75], '', ['t', 0.3]],
    [t.kitchen, 0.58, 0, 0.42, 0.44, null, 'tr'],
    [t.room, 0, 0.44, 1, 0.56, null, 'blr'],
  ],
  1: (t) => [
    [t.bed1, 0, 0, 0.4, 0.5, ['r', 0.75], 'tl'],
    [t.bath(0), 0.4, 0, 0.22, 0.5, ['b', 0.5], ''],
    [t.hall, 0.62, 0, 0.38, 0.5, ['b', 0.3], 'r', ['t', 0.55]],
    [t.living, 0, 0.5, 0.62, 0.5, null, 'bl'],
    [t.kitchen, 0.62, 0.5, 0.38, 0.5, null, 'br'],
  ],
  2: (t) => [
    [t.bed(1), 0, 0, 0.3, 0.46, ['b', 0.75], 'tl'],
    [t.bath(1), 0.3, 0, 0.16, 0.46, ['b', 0.5], ''],
    [t.hall, 0.46, 0, 0.2, 0.46, ['b', 0.5], '', ['t', 0.5]],
    [t.bath(2), 0.66, 0, 0.12, 0.46, ['b', 0.5], ''],
    [t.bed(2), 0.78, 0, 0.22, 0.46, ['b', 0.3], 'tr'],
    [t.living, 0, 0.46, 0.64, 0.54, null, 'bl'],
    [t.kitchen, 0.64, 0.46, 0.36, 0.54, null, 'br'],
  ],
  3: (t) => [
    [t.bed(1), 0, 0, 0.27, 0.42, ['b', 0.75], 'tl'],
    [t.bath(1), 0.27, 0, 0.14, 0.42, ['b', 0.5], ''],
    [t.hall, 0.41, 0, 0.18, 0.42, ['b', 0.5], '', ['t', 0.5]],
    [t.bath(2), 0.59, 0, 0.12, 0.42, ['b', 0.5], ''],
    [t.bed(2), 0.71, 0, 0.29, 0.42, ['b', 0.25], 'tr'],
    [t.bed(3), 0, 0.42, 0.26, 0.58, ['r', 0.2], 'bl'],
    [t.living, 0.26, 0.42, 0.48, 0.58, null, 'b'],
    [t.kitchen, 0.74, 0.42, 0.26, 0.58, null, 'br'],
  ],
  4: (t) => [
    [t.bed(1), 0, 0, 0.24, 0.4, ['b', 0.75], 'tl'],
    [t.bath(1), 0.24, 0, 0.12, 0.4, ['b', 0.5], ''],
    [t.hall, 0.36, 0, 0.16, 0.4, ['b', 0.5], '', ['t', 0.5]],
    [t.bath(2), 0.52, 0, 0.11, 0.4, ['b', 0.5], ''],
    [t.bed(2), 0.63, 0, 0.18, 0.4, ['b', 0.3], 't'],
    [t.bed(3), 0.81, 0, 0.19, 0.4, ['b', 0.3], 'tr'],
    [t.bed(4), 0, 0.4, 0.22, 0.6, ['r', 0.2], 'bl'],
    [t.living, 0.22, 0.4, 0.52, 0.6, null, 'b'],
    [t.kitchen, 0.74, 0.4, 0.26, 0.6, null, 'br'],
  ],
  // Duplex, lower level: living, kitchen, WC, stairs; upper level: bedrooms.
  lower: (t) => [
    [t.wc, 0, 0, 0.22, 0.38, ['b', 0.5], ''],
    [t.hall, 0.22, 0, 0.3, 0.38, ['b', 0.5], '', ['t', 0.5]],
    [t.stairs, 0.52, 0, 0.2, 0.38, ['b', 0.5], ''],
    [t.kitchen, 0.72, 0, 0.28, 0.38, ['b', 0.3], 'tr'],
    [t.living, 0, 0.38, 1, 0.62, null, 'blr'],
  ],
  upper: (t) => [
    [t.bed(1), 0, 0, 0.34, 0.5, ['b', 0.75], 'tl'],
    [t.bath(1), 0.34, 0, 0.18, 0.5, ['b', 0.5], ''],
    [t.stairs, 0.52, 0, 0.2, 0.5, ['b', 0.5], ''],
    [t.bed(2), 0.72, 0, 0.28, 0.5, ['b', 0.3], 'tr'],
    [t.bed(3), 0, 0.5, 0.4, 0.5, ['t', 0.6], 'bl'],
    [t.bath(2), 0.4, 0.5, 0.2, 0.5, ['t', 0.5], ''],
    [t.hall, 0.6, 0.5, 0.4, 0.5, ['t', 0.25], 'br'],
  ],
};

const CANVAS = { w: 24, h: 17.5 };
const INK = '#2b2420';
const SOFT = '#6b6058';
const ROOM = '#fffdf8';
const EXT = 0.28;
const INT = 0.1;
const DOOR = 0.82;
const f = (n) => Math.round(n * 1000) / 1000;
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const fmtM2 = (n, lang) => `${lang === 'es' ? String(Math.round(n * 10) / 10).replace('.', ',') : Math.round(n * 10) / 10} m²`;

/** One level: footprint W x H at (ox, oy) with its rooms and doors. */
function level(parts, rooms, W, H, ox, oy, lang) {
  const P = (x, y) => [f(ox + x), f(oy + y)];
  const abs = rooms.map(([name, x, y, w, h, door, win, entry]) => ({ name, x: x * W, y: y * H, w: w * W, h: h * H, door, win, entry }));
  for (const r of abs) parts.push(`<rect x="${f(ox + r.x)}" y="${f(oy + r.y)}" width="${f(r.w)}" height="${f(r.h)}" fill="${ROOM}" stroke="${INK}" stroke-width="${INT}"/>`);
  parts.push(`<rect x="${f(ox)}" y="${f(oy)}" width="${f(W)}" height="${f(H)}" fill="none" stroke="${INK}" stroke-width="${EXT}"/>`);
  const win = (x1, y1, x2, y2) => {
    parts.push(`<line x1="${f(ox + x1)}" y1="${f(oy + y1)}" x2="${f(ox + x2)}" y2="${f(oy + y2)}" stroke="${ROOM}" stroke-width="${EXT - 0.05}"/>`);
    const h = y1 === y2;
    for (const s of [-1, 1]) parts.push(`<line x1="${f(ox + x1 + (h ? 0 : s * 0.07))}" y1="${f(oy + y1 + (h ? s * 0.07 : 0))}" x2="${f(ox + x2 + (h ? 0 : s * 0.07))}" y2="${f(oy + y2 + (h ? s * 0.07 : 0))}" stroke="${INK}" stroke-width="0.035"/>`);
  };
  const eps = 0.01;
  for (const r of abs) {
    if (!r.win) continue;
    const big = r.w > 3.5;
    const span = (len) => Math.max(0.6, Math.min(len - 0.7, big ? len * 0.6 : 1.4));
    if (r.win.includes('t') && r.y < eps) { const s = span(r.w); win(r.x + (r.w - s) / 2, 0, r.x + (r.w + s) / 2, 0); }
    if (r.win.includes('b') && Math.abs(r.y + r.h - H) < eps) {
      // Tall French windows on the façade: two per wide room.
      if (big) { const s = Math.min(1.3, r.w / 4); for (const c of [0.28, 0.72]) win(r.x + r.w * c - s / 2, H, r.x + r.w * c + s / 2, H); }
      else { const s = span(r.w); win(r.x + (r.w - s) / 2, H, r.x + (r.w + s) / 2, H); }
    }
    if (r.win.includes('l') && r.x < eps) { const s = Math.min(r.h - 0.8, 1.4); win(0, r.y + (r.h - s) / 2, 0, r.y + (r.h + s) / 2); }
    if (r.win.includes('r') && Math.abs(r.x + r.w - W) < eps) { const s = Math.min(r.h - 0.8, 1.4); win(W, r.y + (r.h - s) / 2, W, r.y + (r.h + s) / 2); }
  }
  const door = ([side, frac], r, entry) => {
    const wall = entry ? EXT : INT;
    const d = Math.min(DOOR, (side === 'b' || side === 't' ? r.w : r.h) - 0.3);
    let a, b, leaf, arc;
    if (side === 'b' || side === 't') {
      const wy = side === 'b' ? r.y + r.h : r.y;
      const dir = side === 'b' ? -1 : 1;
      const x0 = Math.max(r.x + 0.15, Math.min(r.x + r.w - d - 0.15, r.x + r.w * frac - d / 2));
      a = P(x0, wy); b = P(x0 + d, wy); leaf = P(x0, wy + dir * d);
      arc = `M${leaf.join(',')} A${f(d)},${f(d)} 0 0 ${side === 'b' ? 1 : 0} ${b.join(',')}`;
    } else {
      const wx = side === 'r' ? r.x + r.w : r.x;
      const dir = side === 'r' ? -1 : 1;
      const y0 = Math.max(r.y + 0.15, Math.min(r.y + r.h - d - 0.15, r.y + r.h * frac - d / 2));
      a = P(wx, y0); b = P(wx, y0 + d); leaf = P(wx + dir * d, y0);
      arc = `M${leaf.join(',')} A${f(d)},${f(d)} 0 0 ${side === 'r' ? 0 : 1} ${b.join(',')}`;
    }
    parts.push(`<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="${ROOM}" stroke-width="${wall + 0.05}"/>`);
    parts.push(`<line x1="${a[0]}" y1="${a[1]}" x2="${leaf[0]}" y2="${leaf[1]}" stroke="${INK}" stroke-width="0.05"/>`);
    parts.push(`<path d="${arc}" fill="none" stroke="${SOFT}" stroke-width="0.03" stroke-dasharray="0.12 0.08"/>`);
    return a;
  };
  let entryAt = null;
  for (const r of abs) {
    if (r.door) door(r.door, r, false);
    if (r.entry) entryAt = door(r.entry, r, true);
  }
  // Stairs: treads.
  for (const r of abs) {
    if (r.name !== L[lang].stairs) continue;
    for (let i = 1; i < 8; i++) parts.push(`<line x1="${f(ox + r.x + 0.15)}" y1="${f(oy + r.y + (r.h * i) / 8)}" x2="${f(ox + r.x + r.w - 0.15)}" y2="${f(oy + r.y + (r.h * i) / 8)}" stroke="${SOFT}" stroke-width="0.03"/>`);
  }
  return { abs, entryAt };
}

function labels(parts, abs, ox, oy, k, lang) {
  for (const r of abs) {
    const cx = f(ox + r.x + r.w / 2);
    // Keep the label clear of the door swing.
    const side = r.door?.[0] ?? r.entry?.[0];
    const cy = f(oy + r.y + r.h / 2 + (side === 'b' ? -0.17 * r.h : side === 't' ? 0.17 * r.h : 0));
    const small = r.w < 2.1 || r.h < 2;
    parts.push(`<text x="${cx}" y="${f(cy - 0.04)}" class="${small ? 'n sm' : 'n'}">${esc(r.name)}</text>`);
    parts.push(`<text x="${cx}" y="${f(cy + (small ? 0.38 : 0.5) * k)}" class="${small ? 'a sm' : 'a'}">${fmtM2(r.w * r.h, lang)}</text>`);
  }
}

/** Outdoor space in front of the façade (bottom edge). */
function outdoorShape(v, W, H) {
  if (!v.out) return [];
  const m2 = v.out.m2;
  if (v.out.kind === 'balcony') {
    if (v.wing === '1908') {
      // Wrought-iron balconies, one per pair of French windows, 0.7 m deep.
      const n = Math.max(1, Math.min(3, Math.round(m2 / 2)));
      const depth = 0.7;
      const w = m2 / n / depth;
      const gap = (W - n * w) / (n + 1);
      return Array.from({ length: n }, (_, i) => [gap + i * (w + gap), H, w, depth]);
    }
    const depth = 1.6;
    const w = Math.min(W - 1, m2 / depth);
    return [[(W - w) / 2, H, w, depth]];
  }
  // Patio or terrace: full width, then wrapping the right side if deep.
  const depth = m2 / W;
  if (depth <= 3.6) return [[0, H, W, depth]];
  const d1 = 3.4;
  const rest = m2 - W * d1;
  const side = rest / (H + d1);
  return [[0, H, W, d1], [W, 0, side, H + d1]];
}

function draw(v, lang, fit) {
  const t = L[lang];
  const parts = [];
  const aspect = v.wing === '1908' ? 1.45 : 1.25;
  const levels = v.duplex ? [{ tpl: TPL.lower(t), area: v.area * 0.52, label: t.lower }, { tpl: TPL.upper(t), area: v.area * 0.48, label: t.upper, out: true }] : [{ tpl: TPL[Math.min(4, v.bedrooms)](t), area: v.area, out: true }];
  // Footprints and placement (levels side by side, 1.6 m apart).
  const fps = levels.map((l) => { const W = Math.sqrt(l.area * aspect); return { ...l, W, H: l.area / W }; });
  const outs = fps.map((l) => (l.out ? outdoorShape(v, l.W, l.H) : []));
  const right = (i) => Math.max(fps[i].W, ...outs[i].map(([x, , w]) => x + w));
  const bottom = (i) => Math.max(fps[i].H, ...outs[i].map(([, y, , h]) => y + h));
  const GAP = 1.6;
  const totalW = fps.reduce((s, _, i) => s + right(i), 0) + GAP * (fps.length - 1);
  const totalH = Math.max(...fps.map((_, i) => bottom(i)));
  const top = v.duplex ? 2.2 : 1.7;
  const ox0 = (CANVAS.w - totalW) / 2;
  const oy = top + (CANVAS.h - top - 1.7 - totalH) / 2;
  const k = fit ? Math.min(1.45, Math.max(1.1, totalW / 12)) : 1;
  let ox = ox0;
  fps.forEach((l, i) => {
    for (const [x, y, w, h] of outs[i]) parts.push(`<rect x="${f(ox + x)}" y="${f(oy + y)}" width="${f(w)}" height="${f(h)}" fill="url(#deck)" stroke="${SOFT}" stroke-width="0.04"/>`);
    if (outs[i][0]) {
      const [x, y, w, h] = outs[i][0];
      const label = t[v.out.kind];
      if (v.out.kind === 'balcony' && v.wing === '1908') parts.push(`<text x="${f(ox + l.W / 2)}" y="${f(oy + l.H + 1.3)}" class="o">${esc(label)} · ${fmtM2(v.out.m2, lang)}</text>`);
      else parts.push(`<text x="${f(ox + x + w / 2)}" y="${f(oy + y + h / 2 + 0.14)}" class="o">${esc(label)} · ${fmtM2(v.out.m2, lang)}</text>`);
    }
    const { abs, entryAt } = level(parts, l.tpl, l.W, l.H, ox, oy, lang);
    labels(parts, abs, ox, oy, k, lang);
    if (entryAt) {
      parts.push(`<path d="M${f(entryAt[0] + DOOR / 2)},${f(oy - 1.0)} l0,0.55 m-0.22,-0.24 l0.22,0.24 l0.22,-0.24" fill="none" stroke="${INK}" stroke-width="0.05"/>`);
      parts.push(`<text x="${f(entryAt[0] + DOOR / 2)}" y="${f(oy - 1.15)}" class="s">${esc(t.entry)}</text>`);
    }
    if (l.label) parts.push(`<text x="${f(ox + l.W / 2)}" y="${f(oy - (entryAt ? 1.75 : 0.6))}" class="lv">${esc(l.label)}</text>`);
    ox += right(i) + GAP;
  });

  const box = fit
    ? { x: f(ox0 - 0.6), y: f(oy - (v.duplex ? 2.35 : 1.75)), w: f(totalW + 1.2), h: f(totalH + (v.duplex ? 2.35 : 1.75) + (v.out?.kind === 'balcony' && v.wing === '1908' ? 1.6 : 0.6)) }
    : { x: 0, y: 0, w: CANVAS.w, h: CANVAS.h };
  const nx = fit ? box.x + box.w - 0.7 : CANVAS.w - 1.2;
  const ny = fit ? box.y + 0.95 : 1.4;
  parts.push(`<g transform="translate(${f(nx)},${f(ny)}) scale(${fit ? 0.75 : 1})"><circle r="0.6" fill="none" stroke="${SOFT}" stroke-width="0.04"/><path d="M0,-0.48 L0.23,0.3 L0,0.17 L-0.23,0.3 Z" fill="${INK}"/><text y="-0.75" class="s">N</text></g>`);
  if (!fit) {
    const sy = CANVAS.h - 0.8;
    parts.push(`<g><path d="M0.8,${sy} h5" stroke="${INK}" stroke-width="0.06"/>${[0, 1, 2, 3, 4, 5].map((i) => `<path d="M${0.8 + i},${f(sy - (i % 5 ? 0.12 : 0.2))} v${i % 5 ? 0.24 : 0.4}" stroke="${INK}" stroke-width="0.04"/>`).join('')}<text x="0.8" y="${f(sy + 0.6)}" class="s st">0</text><text x="5.8" y="${f(sy + 0.6)}" class="s">5 m</text></g>`);
    parts.push(`<text x="${CANVAS.w - 0.8}" y="${f(sy + 0.6)}" class="s en">${esc(t.note)}</text>`);
  }
  const title = t.title(v);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${box.x} ${box.y} ${box.w} ${box.h}" width="${Math.round(box.w * 40)}" height="${Math.round(box.h * 40)}" role="img" aria-label="${esc(title)}">
<title>${esc(title)}</title>
<defs>
<pattern id="deck" width="0.3" height="0.3" patternUnits="userSpaceOnUse"><rect width="0.3" height="0.3" fill="#f3e3d6"/><path d="M0,0.3 h0.3" stroke="#e2c6b2" stroke-width="0.03"/></pattern>
<style>text{font-family:Helvetica,Arial,sans-serif;fill:${INK};text-anchor:middle}.n{font-size:${f(0.34 * k)}px;font-weight:600}.a{font-size:${f(0.28 * k)}px;fill:${SOFT}}.o{font-size:${f(0.32 * k)}px;font-style:italic;fill:#8a4130}.s{font-size:${f(0.28 * k)}px;fill:${SOFT}}.lv{font-size:${f(0.36 * k)}px;font-weight:600;letter-spacing:0.04em}.st{text-anchor:start}.en{text-anchor:end}.sm.n{font-size:${f(0.25 * k)}px}.sm.a{font-size:${f(0.22 * k)}px}</style>
</defs>
<rect x="${box.x}" y="${box.y}" width="${box.w}" height="${box.h}" fill="#ffffff"/>
${parts.join('\n')}
</svg>
`;
}

const sizes = {};
const dims = (svg) => svg.match(/width="(\d+)" height="(\d+)"/).slice(1).map(Number);
for (const lang of ['es', 'en']) {
  mkdirSync(`public/plans/${lang}`, { recursive: true });
  for (const v of variants.values()) {
    const full = draw(v, lang, false);
    const fit = draw(v, lang, true);
    writeFileSync(`public/plans/${lang}/${v.key}.svg`, full);
    writeFileSync(`public/plans/${lang}/${v.key}-fit.svg`, fit);
    sizes[v.key] = { full: dims(full), fit: dims(fit) };
  }
}
// Intrinsic sizes for <img width height> (no layout shift).
writeFileSync('src/content/plans.json', `${JSON.stringify(sizes, null, 1)}\n`);
console.log(`${variants.size} plans x 2 languages written to public/plans/: ${[...variants.keys()].join(', ')}`);
