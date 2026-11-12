#!/usr/bin/env node
/**
 * Draws the indicative floor plans in public/plans/ (the API has no plans).
 * One drawing per unit type, all on the same canvas and the same scale
 * (1 SVG unit = 1 m), so a 2.5 looks smaller than a penthouse, as it is.
 * Walls, doors (leaf + swing), windows, room names with m², the outdoor
 * space tinted, a scale bar and a north arrow. Run: pnpm plans
 */
import { mkdirSync, writeFileSync } from 'node:fs';

const CANVAS = { w: 24, h: 21.5 };
const INK = '#2e2922';
const SOFT = '#6f6558';
const ROOM = '#fffdf9';
const OUT = '#eee6d7';
const EXT = 0.28;
const INT = 0.12;
const DOOR = 0.85;

/**
 * Room: [key, x, y, w, h, door?, windows, entry?] in metres from the
 * footprint's top-left (north up, south = lake side = bottom). door: [side,
 * offset]; side t|b|l|r, offset from the wall start; `entry` marks the
 * apartment door. windows: sides with windows (exterior walls only).
 * Room sizes add up to the unit's living area (fixture), give or take walls.
 */
const T = {
  '25': {
    W: 10.2, H: 7.2,
    rooms: [
      ['bed', 0, 0, 4, 3.4, ['b', 2.8], 'tl'],
      ['bath', 4, 0, 2.4, 3.4, ['b', 0.8], ''],
      ['hall', 6.4, 0, 3.8, 3.4, ['b', 0.4], 'r', ['t', 1.6]],
      ['living', 0, 3.4, 6.4, 3.8, null, 'bl'],
      ['kitchen', 6.4, 3.4, 3.8, 3.8, null, 'br'],
    ],
  },
  '35': {
    W: 12.6, H: 8.4,
    rooms: [
      ['bed1', 0, 0, 4.2, 3.4, ['b', 3.0], 'tl'],
      ['bath', 4.2, 0, 2.4, 3.4, ['b', 0.8], ''],
      ['hall', 6.6, 0, 2.4, 3.4, ['b', 0.7], '', ['t', 0.8]],
      ['bed2', 9, 0, 3.6, 3.4, ['b', 0.3], 'tr'],
      ['living', 0, 3.4, 8, 5, null, 'bl'],
      ['kitchen', 8, 3.4, 4.6, 5, null, 'br'],
    ],
  },
  '45': {
    W: 14.4, H: 9.3,
    rooms: [
      ['bed1', 0, 0, 4, 3.6, ['b', 2.9], 'tl'],
      ['bath', 4, 0, 2.4, 3.6, ['b', 0.8], ''],
      ['hall', 6.4, 0, 2.2, 3.6, ['b', 0.6], '', ['t', 0.7]],
      ['shower', 8.6, 0, 1.8, 3.6, ['b', 0.5], ''],
      ['bed2', 10.4, 0, 4, 3.6, ['b', 0.3], 'tr'],
      ['bed3', 0, 3.6, 3.6, 5.7, ['r', 0.4], 'bl'],
      ['living', 3.6, 3.6, 7, 5.7, null, 'b'],
      ['kitchen', 10.6, 3.6, 3.8, 5.7, null, 'br'],
    ],
  },
  'attico-45': {
    W: 16, H: 9.9,
    rooms: [
      ['suite', 0, 0, 4.6, 4, ['b', 3.5], 'tl'],
      ['bath', 4.6, 0, 2.6, 4, ['b', 0.9], ''],
      ['hall', 7.2, 0, 2.4, 4, ['b', 0.8], '', ['t', 0.8]],
      ['shower', 9.6, 0, 1.8, 4, ['b', 0.5], ''],
      ['bed2', 11.4, 0, 4.6, 4, ['b', 0.4], 'tr'],
      ['bed3', 0, 4, 3.8, 5.9, ['r', 0.4], 'bl'],
      ['living', 3.8, 4, 8, 5.9, null, 'b'],
      ['kitchen', 11.8, 4, 4.2, 5.9, null, 'br'],
    ],
  },
  'attico-55': {
    W: 18.4, H: 10.65,
    rooms: [
      ['suite', 0, 0, 5, 4, ['b', 3.9], 'tl'],
      ['bathSuite', 5, 0, 2.4, 4, ['l', 0.4], ''],
      ['hall', 7.4, 0, 2.6, 4, ['b', 0.9], '', ['t', 0.9]],
      ['bath', 10, 0, 2.4, 4, ['b', 0.8], ''],
      ['shower', 12.4, 0, 1.6, 4, ['b', 0.4], ''],
      ['bed2', 14, 0, 4.4, 4, ['b', 0.4], 'tr'],
      ['bed3', 0, 4, 4, 3.4, ['r', 0.4], 'l'],
      ['bed4', 0, 7.4, 4, 3.25, ['r', 0.3], 'bl'],
      ['living', 4, 4, 9, 6.65, null, 'b'],
      ['kitchen', 13, 4, 5.4, 6.65, null, 'br'],
    ],
  },
};

/** Outdoor spaces per variant: [labelKey, x, y, w, h, kind]. */
const outdoor = (t, kind) => {
  if (kind === 'garden') return [['coveredTerrace', 0.6, t.H, t.W - 1.2, 2.4, 'deck'], ['garden', -1.2, t.H + 2.4, t.W + 2.4, 4.2, 'garden']];
  if (kind === 'loggia') return [['loggia', 1, t.H, t.W - 2, 2.1, 'deck']];
  // penthouse: terrace along the front and down the east side
  return [['terrace', 0, t.H, t.W + 2.6, t.W > 17 ? 5.2 : 4.4, 'deck'], ['', t.W, t.W > 17 ? 0.5 : 2.4, 2.6, t.W > 17 ? 10.15 : 7.5, 'deck']];
};

const LABELS = {
  it: {
    bed: 'Camera', bed1: 'Camera 1', bed2: 'Camera 2', bed3: 'Camera 3', bed4: 'Camera 4', suite: 'Camera padronale',
    bath: 'Bagno', bathSuite: 'Bagno', shower: 'Doccia', hall: 'Ingresso', living: 'Soggiorno', kitchen: 'Cucina',
    loggia: 'Loggia', terrace: 'Terrazza', coveredTerrace: 'Terrazza coperta', garden: 'Giardino privato',
    entry: 'Entrata', note: 'Pianta indicativa, non vincolante',
    rooms: (r) => `${r} locali`, penthouse: 'attico', withGarden: 'con giardino', plan: 'Pianta indicativa',
  },
  de: {
    bed: 'Zimmer', bed1: 'Zimmer 1', bed2: 'Zimmer 2', bed3: 'Zimmer 3', bed4: 'Zimmer 4', suite: 'Elternzimmer',
    bath: 'Bad', bathSuite: 'Bad', shower: 'Dusche', hall: 'Eingang', living: 'Wohnen', kitchen: 'Küche',
    loggia: 'Loggia', terrace: 'Terrasse', coveredTerrace: 'Gedeckter Sitzplatz', garden: 'Privatgarten',
    entry: 'Eingang', note: 'Indikativer Grundriss, unverbindlich',
    rooms: (r) => `${r} Zimmer`, penthouse: 'Attika', withGarden: 'mit Garten', plan: 'Indikativer Grundriss',
  },
};

const VARIANTS = [
  ['25', '25', 'loggia'],
  ['25-giardino', '25', 'garden'],
  ['35', '35', 'loggia'],
  ['35-giardino', '35', 'garden'],
  ['45', '45', 'loggia'],
  ['45-giardino', '45', 'garden'],
  ['attico-45', 'attico-45', 'terrace'],
  ['attico-55', 'attico-55', 'terrace'],
];

const f = (n) => Math.round(n * 1000) / 1000;
const m2 = (w, h) => `${String(Math.round(w * h * 10) / 10)} m²`;
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

function draw(typeKey, kind, lang, title, fit = false) {
  const t = T[typeKey];
  const L = LABELS[lang];
  const outs = outdoor(t, kind);
  const extra = outs.reduce((m, [, , y, , h]) => Math.max(m, y + h), t.H) - t.H;
  const right = outs.reduce((m, [, x, , w]) => Math.max(m, x + w), t.W);
  // Centre the drawing (footprint + outdoor) on the shared canvas.
  const ox = f((CANVAS.w - right) / 2);
  const oy = f(1.6 + (CANVAS.h - 1.6 - 1.6 - (t.H + extra)) / 2);
  const P = (x, y) => `${f(ox + x)},${f(oy + y)}`;
  const parts = [];

  // Outdoor spaces (south side): deck boards or a dotted garden.
  for (const [, x, y, w, h, k] of outs) {
    const g = k === 'garden';
    parts.push(`<rect x="${f(ox + x)}" y="${f(oy + y)}" width="${w}" height="${h}" fill="${g ? 'url(#garden)' : 'url(#deck)'}" stroke="${SOFT}" stroke-width="0.05" stroke-dasharray="${g ? '0.25 0.15' : '0'}"/>`);
  }
  for (const [key, x, y, w, h] of outs) {
    if (key) parts.push(`<text x="${f(ox + x + w / 2)}" y="${f(oy + y + h / 2 + 0.16)}" class="o">${esc(L[key])}</text>`);
  }

  // Rooms: fill + interior walls.
  for (const [, x, y, w, h] of t.rooms) {
    parts.push(`<rect x="${f(ox + x)}" y="${f(oy + y)}" width="${w}" height="${h}" fill="${ROOM}" stroke="${INK}" stroke-width="${INT}"/>`);
  }
  // Exterior wall.
  parts.push(`<rect x="${f(ox)}" y="${f(oy)}" width="${t.W}" height="${t.H}" fill="none" stroke="${INK}" stroke-width="${EXT}"/>`);

  // Windows on exterior walls: a white gap with two thin lines.
  const win = (x1, y1, x2, y2) => {
    parts.push(`<line x1="${f(ox + x1)}" y1="${f(oy + y1)}" x2="${f(ox + x2)}" y2="${f(oy + y2)}" stroke="${ROOM}" stroke-width="${EXT - 0.04}"/>`);
    const dx = y1 === y2 ? 0 : 0.07;
    const dy = y1 === y2 ? 0.07 : 0;
    for (const s of [-1, 1]) {
      parts.push(`<line x1="${f(ox + x1 + s * dx)}" y1="${f(oy + y1 + s * dy)}" x2="${f(ox + x2 + s * dx)}" y2="${f(oy + y2 + s * dy)}" stroke="${INK}" stroke-width="0.035"/>`);
    }
  };
  for (const [name, x, y, w, h, , sides] of t.rooms) {
    if (!sides) continue;
    const big = name === 'living' || name === 'kitchen';
    const span = (len) => Math.min(len - 0.8, big ? len * 0.75 : 1.8);
    if (sides.includes('t') && y === 0) { const s = span(w); win(x + (w - s) / 2, 0, x + (w + s) / 2, 0); }
    if (sides.includes('b') && y + h === t.H) { const s = span(w); win(x + (w - s) / 2, t.H, x + (w + s) / 2, t.H); }
    if (sides.includes('l') && x === 0) { const s = Math.min(h - 0.8, 1.6); win(0, y + (h - s) / 2, 0, y + (h + s) / 2); }
    if (sides.includes('r') && x + w === t.W) { const s = Math.min(h - 0.8, 1.6); win(t.W, y + (h - s) / 2, t.W, y + (h + s) / 2); }
  }

  // Doors: gap in the wall, leaf and quarter swing into the room.
  const door = ([side, at], [x, y, w, h], entry) => {
    const wall = entry ? EXT : INT;
    const d = DOOR;
    let hinge, gapA, gapB, leafEnd, arc;
    if (side === 'b' || side === 't') {
      const wy = side === 'b' ? y + h : y;
      const dir = side === 'b' ? -1 : 1; // swing into the room
      const sweep = entry ? (side === 't' ? 1 : 0) : side === 'b' ? 1 : 0;
      gapA = [x + at, wy]; gapB = [x + at + d, wy];
      hinge = gapA; leafEnd = [x + at, wy + dir * d];
      arc = `M${P(...leafEnd)} A${d},${d} 0 0 ${side === 'b' ? 1 : 0} ${P(...gapB)}`;
      void sweep;
    } else {
      const wx = side === 'r' ? x + w : x;
      const dir = side === 'r' ? -1 : 1;
      gapA = [wx, y + at]; gapB = [wx, y + at + d];
      hinge = gapA; leafEnd = [wx + dir * d, y + at];
      arc = `M${P(...leafEnd)} A${d},${d} 0 0 ${side === 'r' ? 0 : 1} ${P(...gapB)}`;
    }
    parts.push(`<line x1="${P(...gapA).split(',')[0]}" y1="${P(...gapA).split(',')[1]}" x2="${P(...gapB).split(',')[0]}" y2="${P(...gapB).split(',')[1]}" stroke="${ROOM}" stroke-width="${wall + 0.04}"/>`);
    parts.push(`<line x1="${P(...hinge).split(',')[0]}" y1="${P(...hinge).split(',')[1]}" x2="${P(...leafEnd).split(',')[0]}" y2="${P(...leafEnd).split(',')[1]}" stroke="${INK}" stroke-width="0.05"/>`);
    parts.push(`<path d="${arc}" fill="none" stroke="${SOFT}" stroke-width="0.03" stroke-dasharray="0.12 0.08"/>`);
  };
  for (const [, x, y, w, h, d, , entry] of t.rooms) {
    if (d) door(d, [x, y, w, h], false);
    if (entry) door(entry, [x, y, w, h], true);
  }
  // Apartment entrance marker.
  const hall = t.rooms.find((r) => r[7]);
  if (hall) {
    const [, x, , , , , , [, at]] = hall;
    parts.push(`<path d="M${P(x + at + DOOR / 2, -1.05)} l0,0.55 m-0.22,-0.24 l0.22,0.24 l0.22,-0.24" fill="none" stroke="${INK}" stroke-width="0.05"/>`);
    parts.push(`<text x="${f(ox + x + at + DOOR / 2)}" y="${f(oy - 1.2)}" class="s">${esc(L.entry)}</text>`);
  }

  // Fit variant (unit-type cards): the viewBox hugs the drawing, labels a
  // little larger, the north arrow in the corner, no scale bar (scales differ).
  const left = Math.min(0, ...outs.map(([, x]) => x));
  const box = fit ? { x: f(ox + left - 0.7), y: f(oy - 1.75), w: f(right - left + 1.4), h: f(t.H + extra + 1.75 + 0.6) } : { x: 0, y: 0, w: CANVAS.w, h: CANVAS.h };
  const k = fit ? Math.min(1.5, Math.max(1.15, box.w / 14)) : 1;
  // Room labels.
  for (const [key, x, y, w, h] of t.rooms) {
    const name = L[key];
    const cx = f(ox + x + w / 2);
    const cy = f(oy + y + h / 2);
    const small = w < 2.2 || (w < 3 && name.length > 7);
    parts.push(`<text x="${cx}" y="${f(cy - 0.05)}" class="${small ? 'n sm' : 'n'}">${esc(name)}</text>`);
    parts.push(`<text x="${cx}" y="${f(cy + (small ? 0.42 : 0.55) * k)}" class="${small ? 'a sm' : 'a'}">${m2(w, h)}</text>`);
  }

  // North arrow (top right) and a 5 m scale bar (bottom left).
  const nx = fit ? box.x + box.w - 0.75 : CANVAS.w - 1.2;
  const ny = fit ? box.y + 1.0 : 1.5;
  if (fit) parts.push(`<g transform="translate(${f(nx)},${f(ny)}) scale(0.8)">`);
  else parts.push(`<g transform="translate(${nx},${ny})">`);
  parts.push(`<circle r="0.62" fill="none" stroke="${SOFT}" stroke-width="0.04"/><path d="M0,-0.5 L0.24,0.32 L0,0.18 L-0.24,0.32 Z" fill="${INK}"/><text y="-0.78" class="s">N</text></g>`);
  const sy = CANVAS.h - 0.8;
  if (!fit) parts.push(`<g><path d="M0.8,${sy} h5" stroke="${INK}" stroke-width="0.06"/>${[0, 1, 2, 3, 4, 5].map((i) => `<path d="M${0.8 + i},${sy - (i % 5 ? 0.12 : 0.2)} v${i % 5 ? 0.24 : 0.4}" stroke="${INK}" stroke-width="0.04"/>`).join('')}<text x="0.8" y="${sy + 0.6}" class="s st">0</text><text x="5.8" y="${sy + 0.6}" class="s">5 m</text></g>`);
  if (!fit) parts.push(`<text x="${CANVAS.w - 0.8}" y="${sy + 0.6}" class="s en">${esc(L.note)}</text>`);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${box.x} ${box.y} ${box.w} ${box.h}" width="${Math.round(box.w * 40)}" height="${Math.round(box.h * 40)}" role="img" aria-label="${esc(title)}">
<title>${esc(title)}</title>
<defs>
<pattern id="deck" width="0.35" height="0.35" patternUnits="userSpaceOnUse"><rect width="0.35" height="0.35" fill="${OUT}"/><path d="M0,0.35 h0.35" stroke="#d9cdb8" stroke-width="0.03"/></pattern>
<pattern id="garden" width="0.5" height="0.5" patternUnits="userSpaceOnUse"><rect width="0.5" height="0.5" fill="#e3e6d3"/><circle cx="0.25" cy="0.25" r="0.035" fill="#a9b08c"/></pattern>
<style>text{font-family:Helvetica,Arial,sans-serif;fill:${INK};text-anchor:middle}.n{font-size:${f(0.36 * k)}px;font-weight:600;letter-spacing:0.01em}.a{font-size:${f(0.3 * k)}px;fill:${SOFT}}.o{font-size:${f(0.36 * k)}px;font-style:italic;fill:${SOFT}}.s{font-size:${f(0.3 * k)}px;fill:${SOFT}}.st{text-anchor:start}.en{text-anchor:end}.sm.n{font-size:${f(0.27 * k)}px}.sm.a{font-size:${f(0.24 * k)}px}</style>
</defs>
<rect x="${box.x}" y="${box.y}" width="${box.w}" height="${box.h}" fill="#ffffff"/>
${parts.join('\n')}
</svg>
`;
}

for (const lang of ['it', 'de']) {
  const L = LABELS[lang];
  mkdirSync(`public/plans/${lang}`, { recursive: true });
  for (const [file, type, kind] of VARIANTS) {
    const r = type.replace('attico-', '').replace(/(\d)(\d)/, '$1.$2');
    const title = `${L.plan}, ${L.rooms(r)}${type.startsWith('attico') ? `, ${L.penthouse}` : ''}${kind === 'garden' ? `, ${L.withGarden}` : ''}`;
    writeFileSync(`public/plans/${lang}/plan-${file}.svg`, draw(type, kind, lang, title));
    writeFileSync(`public/plans/${lang}/plan-${file}-fit.svg`, draw(type, kind, lang, title, true));
  }
}
console.log(`${VARIANTS.length * 4} plans written to public/plans/{it,de}/ (same-scale and fitted)`);
