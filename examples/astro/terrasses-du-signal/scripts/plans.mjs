#!/usr/bin/env node
/**
 * Draws the indicative floor plans in public/plans/ (the API has no plans).
 * One drawing per unit type, all on the same canvas and the same scale
 * (1 SVG unit = 1 m), so a 2.5 looks smaller than an attique, as it is.
 * Walls, doors (leaf + swing), windows, room names with m², the outdoor
 * space tinted, a scale bar and a north arrow. Run: pnpm plans
 */
import { mkdirSync, writeFileSync } from 'node:fs';

const CANVAS = { w: 25, h: 18 };
const INK = '#2e2922';
const SOFT = '#7a6f60';
const ROOM = '#fbf9f5';
const OUT = '#e9e2d4';
const EXT = 0.28;
const INT = 0.12;
const DOOR = 0.85;

/**
 * Room: [name, x, y, w, h, door?] in metres from the footprint's top-left
 * (north up, south = lake side = bottom). door: [side, offset] where side is
 * t|b|l|r and offset the distance from the wall start; 'entry' marks the
 * apartment door. win: sides with windows (exterior walls only).
 */
const T = {
  '25': {
    W: 10, H: 7.4,
    rooms: [
      ['Chambre', 0, 0, 4, 3.2, ['b', 2.6], 'tl'],
      ['Bains', 4, 0, 2.4, 3.2, ['b', 0.8], ''],
      ['Hall', 6.4, 0, 3.6, 3.2, ['b', 0.4], '', ['t', 1.6]],
      ['Séjour', 0, 3.2, 6.2, 4.2, null, 'bl'],
      ['Cuisine', 6.2, 3.2, 3.8, 4.2, null, 'br'],
    ],
    outdoor: [[0.6, 7.4, 8.8, 2.5]],
  },
  '35': {
    W: 12, H: 8.6,
    rooms: [
      ['Chambre 1', 0, 0, 4.2, 3.4, ['b', 3.0], 'tl'],
      ['Bains', 4.2, 0, 2.4, 3.4, ['b', 0.8], ''],
      ['Hall', 6.6, 0, 2.2, 3.4, ['b', 0.6], '', ['t', 0.7]],
      ['Chambre 2', 8.8, 0, 3.2, 3.4, ['b', 0.3], 'tr'],
      ['Séjour', 0, 3.4, 7.6, 5.2, null, 'bl'],
      ['Cuisine', 7.6, 3.4, 4.4, 5.2, null, 'br'],
    ],
    outdoor: [[0.8, 8.6, 10.4, 2.5]],
  },
  '45': {
    W: 14, H: 9.2,
    rooms: [
      ['Chambre 1', 0, 0, 4, 3.6, ['b', 2.9], 'tl'],
      ['Bains', 4, 0, 2.4, 3.6, ['b', 0.8], ''],
      ['Hall', 6.4, 0, 2, 3.6, ['b', 0.6], '', ['t', 0.6]],
      ['Douche', 8.4, 0, 1.8, 3.6, ['b', 0.5], ''],
      ['Chambre 2', 10.2, 0, 3.8, 3.6, ['b', 0.3], 'tr'],
      ['Chambre 3', 0, 3.6, 3.6, 5.6, ['r', 0.4], 'bl'],
      ['Séjour', 3.6, 3.6, 6.8, 5.6, null, 'b'],
      ['Cuisine', 10.4, 3.6, 3.6, 5.6, null, 'br'],
    ],
    outdoor: [[3.6, 9.2, 7.2, 2.5]],
  },
  '55': {
    W: 16, H: 9.5,
    rooms: [
      ['Chambre 1', 0, 0, 4.2, 3.8, ['b', 3.1], 'tl'],
      ['Bains', 4.2, 0, 2.4, 3.8, ['b', 0.8], ''],
      ['Hall', 6.6, 0, 2.4, 3.8, ['b', 0.8], '', ['t', 0.8]],
      ['Douche', 9, 0, 1.8, 3.8, ['b', 0.5], ''],
      ['Chambre 2', 10.8, 0, 5.2, 3.8, ['b', 0.4], 'tr'],
      ['Chambre 3', 0, 3.8, 3.6, 2.9, ['r', 0.3], 'l'],
      ['Chambre 4', 0, 6.7, 3.6, 2.8, ['r', 0.3], 'bl'],
      ['Séjour', 3.6, 3.8, 9, 5.7, null, 'b'],
      ['Cuisine', 12.6, 3.8, 3.4, 5.7, null, 'br'],
    ],
    outdoor: [[2, 9.5, 12, 2.2]],
  },
  '55-attique': {
    W: 18, H: 10.5,
    rooms: [
      ['Suite', 0, 0, 5, 4, ['b', 3.9], 'tl'],
      ['Dressing', 5, 0, 2, 4, ['b', 0.6], ''],
      ['Bains', 7, 0, 2.6, 4, ['b', 0.9], ''],
      ['Hall', 9.6, 0, 2.4, 4, ['b', 0.8], '', ['t', 0.8]],
      ['Douche', 12, 0, 1.6, 4, ['b', 0.4], ''],
      ['Chambre 2', 13.6, 0, 4.4, 4, ['b', 0.4], 'tr'],
      ['Chambre 3', 0, 4, 4, 3.4, ['r', 0.4], 'l'],
      ['Chambre 4', 0, 7.4, 4, 3.1, ['r', 0.3], 'bl'],
      ['Séjour', 4, 4, 8.4, 6.5, null, 'b'],
      ['Cuisine', 12.4, 4, 5.6, 6.5, null, 'br'],
    ],
    outdoor: [[0, 10.5, 20.3, 3.2], [18, 3.6, 2.3, 6.9]],
  },
  '65-attique': {
    W: 20, H: 10.7,
    rooms: [
      ['Suite', 0, 0, 5, 4, ['b', 3.9], 'tl'],
      ['Dressing', 5, 0, 2, 4, ['b', 0.6], ''],
      ['Bains', 7, 0, 2.6, 4, ['b', 0.9], ''],
      ['Hall', 9.6, 0, 2.8, 4, ['b', 1.0], '', ['t', 1.0]],
      ['Douche', 12.4, 0, 1.6, 4, ['b', 0.4], ''],
      ['Chambre 2', 14, 0, 6, 4, ['b', 0.4], 'tr'],
      ['Chambre 3', 0, 4, 4, 3.5, ['r', 0.4], 'l'],
      ['Chambre 4', 0, 7.5, 4, 3.2, ['r', 0.3], 'bl'],
      ['Chambre 5', 4, 4, 3.6, 3.4, ['r', 0.4], ''],
      ['Buanderie', 4, 7.4, 3.6, 3.3, ['r', 0.3], ''],
      ['Séjour', 7.6, 4, 7.4, 6.7, null, 'b'],
      ['Cuisine', 15, 4, 5, 6.7, null, 'br'],
    ],
    outdoor: [[0, 10.7, 20, 3.2]],
  },
};

const VARIANTS = [
  ['25', '25', 'Terrasse'],
  ['35', '35', 'Terrasse'],
  ['35-jardin', '35', 'Jardin privatif'],
  ['45', '45', 'Terrasse'],
  ['45-jardin', '45', 'Jardin privatif'],
  ['55', '55', 'Terrasse'],
  ['55-jardin', '55', 'Jardin privatif'],
  ['55-attique', '55-attique', 'Terrasse'],
  ['65-attique', '65-attique', 'Terrasse'],
];

const f = (n) => Math.round(n * 1000) / 1000;
const m2 = (w, h) => `${String(Math.round(w * h * 10) / 10).replace('.', ',')} m²`;
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

function draw(typeKey, outdoorLabel, title, fit = false) {
  const t = T[typeKey];
  const extra = t.outdoor.reduce((m, [, y, , h]) => Math.max(m, y + h), t.H) - t.H;
  const right = t.outdoor.reduce((m, [x, , w]) => Math.max(m, x + w), t.W);
  // Centre the drawing (footprint + outdoor) on the shared canvas.
  const ox = f((CANVAS.w - right) / 2);
  const oy = f(1.6 + (CANVAS.h - 1.6 - 1.6 - (t.H + extra)) / 2);
  const P = (x, y) => `${f(ox + x)},${f(oy + y)}`;
  const parts = [];
  const isGarden = outdoorLabel.startsWith('Jardin');

  // Outdoor space (south side), tinted with a light hatch.
  for (const [x, y, w, h] of t.outdoor) {
    parts.push(`<rect x="${f(ox + x)}" y="${f(oy + y)}" width="${w}" height="${h}" fill="${isGarden ? 'url(#garden)' : 'url(#deck)'}" stroke="${SOFT}" stroke-width="0.05" stroke-dasharray="${isGarden ? '0.25 0.15' : '0'}"/>`);
  }
  const [bx, by, bw, bh] = t.outdoor[0];
  parts.push(`<text x="${f(ox + bx + bw / 2)}" y="${f(oy + by + bh / 2 + 0.16)}" class="o">${esc(outdoorLabel)}</text>`);

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
    const big = /Séjour|Cuisine/.test(name);
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
    parts.push(`<text x="${f(ox + x + at + DOOR / 2)}" y="${f(oy - 1.2)}" class="s">Entrée</text>`);
  }

  // Fit variant (unit-type cards): the viewBox hugs the drawing, labels a
  // little larger, the north arrow in the corner, no scale bar (scales differ).
  const left = Math.min(0, ...t.outdoor.map(([x]) => x));
  const box = fit ? { x: f(ox + left - 0.7), y: f(oy - 1.75), w: f(right - left + 1.4), h: f(t.H + extra + 1.75 + 0.6) } : { x: 0, y: 0, w: CANVAS.w, h: CANVAS.h };
  const k = fit ? Math.min(1.5, Math.max(1.15, box.w / 14)) : 1;
  // Room labels.
  for (const [name, x, y, w, h] of t.rooms) {
    const cx = f(ox + x + w / 2);
    const cy = f(oy + y + h / 2);
    const small = w < 2.2;
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
  if (!fit) parts.push(`<text x="${CANVAS.w - 0.8}" y="${sy + 0.6}" class="s en">Plan indicatif, non contractuel</text>`);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${box.x} ${box.y} ${box.w} ${box.h}" width="${Math.round(box.w * 40)}" height="${Math.round(box.h * 40)}" role="img" aria-label="${esc(title)}">
<title>${esc(title)}</title>
<defs>
<pattern id="deck" width="0.35" height="0.35" patternUnits="userSpaceOnUse"><rect width="0.35" height="0.35" fill="${OUT}"/><path d="M0,0.35 h0.35" stroke="#d6ccb9" stroke-width="0.03"/></pattern>
<pattern id="garden" width="0.5" height="0.5" patternUnits="userSpaceOnUse"><rect width="0.5" height="0.5" fill="#e4e6d6"/><circle cx="0.25" cy="0.25" r="0.035" fill="#b9bea0"/></pattern>
<style>text{font-family:Helvetica,Arial,sans-serif;fill:${INK};text-anchor:middle}.n{font-size:${f(0.36 * k)}px;font-weight:600;letter-spacing:0.01em}.a{font-size:${f(0.3 * k)}px;fill:${SOFT}}.o{font-size:${f(0.36 * k)}px;font-style:italic;fill:${SOFT}}.s{font-size:${f(0.3 * k)}px;fill:${SOFT}}.st{text-anchor:start}.en{text-anchor:end}.sm.n{font-size:${f(0.27 * k)}px}.sm.a{font-size:${f(0.24 * k)}px}</style>
</defs>
<rect x="${box.x}" y="${box.y}" width="${box.w}" height="${box.h}" fill="#ffffff"/>
${parts.join('\n')}
</svg>
`;
}

mkdirSync('public/plans', { recursive: true });
for (const [file, type, label] of VARIANTS) {
  const rooms = type.split('-')[0].replace(/(\d)(\d)/, '$1.$2');
  const title = `Plan indicatif, ${rooms} pièces${type.includes('attique') ? ', attique' : ''}${label.startsWith('Jardin') ? ', avec jardin' : ''}`;
  writeFileSync(`public/plans/plan-${file}.svg`, draw(type, label, title));
  writeFileSync(`public/plans/plan-${file}-fit.svg`, draw(type, label, title, true));
}
console.log(`${VARIANTS.length * 2} plans written to public/plans/ (same-scale and fitted)`);
