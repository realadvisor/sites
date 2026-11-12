#!/usr/bin/env node
// Draws the indicative floor plans (one per unit type and orientation) into
// public/plans/: typ-<rooms>-<orientation>.svg, e.g. typ-3-5-sw.svg.
// All types share one scale (S px per metre), so the plans compare at a glance.
// The loggia side is drawn at the bottom; the north arrow turns with the
// direction the loggia faces. The fixture has no plans: these are drawn here.
//
//   node scripts/plans.mjs
import { mkdirSync, writeFileSync } from 'node:fs';

const S = 34; // px per metre
const VW = 600;
const VH = 470;
const INK = '#140F3A';
const WET = '#EEE9FF';
const OUT = '#FCD9CC';
const FONT = "font-family='Helvetica Neue, Arial, sans-serif'";

// Rooms in metres: [label, x, y, w, h, wet?]. Doors: [x, y, 'h'|'v', width, swing]
// (swing: +1 into larger y / x, -1 the other way). Open: wall parts erased
// between two areas of one space (kitchen open to the living room).
const TYPES = {
  '1-5': {
    rooms: 1.5, area: 38, W: 7.6, D: 5.0,
    list: [['Entrée', 0, 0, 3.0, 2.2], ['Bad', 3.0, 0, 2.2, 2.2, 1], ['Küche', 5.2, 0, 2.4, 2.2], ['Wohnen / Schlafen', 0, 2.2, 7.6, 2.8]],
    doors: [[0.8, 0, 'h', 0.9, 1, 'entry'], [3.0, 0.6, 'v', 0.8, 1], [1.6, 2.2, 'h', 0.9, 1]],
    open: [[5.25, 2.2, 'h', 2.3]],
    windows: [[0.8, 5.0, 'h', 5.8], [7.6, 0.4, 'v', 1.4]],
    counter: [[5.3, 0.08, 2.2, 0.62]],
  },
  '2-5': {
    rooms: 2.5, area: 58, W: 10.0, D: 5.8,
    list: [['Entrée', 0, 0, 3.6, 2.2], ['Bad', 3.6, 0, 2.4, 2.2, 1], ['Réduit', 6.0, 0, 1.2, 2.2], ['Zimmer', 7.2, 0, 2.8, 5.8], ['Wohnen / Essen / Küche', 0, 2.2, 7.2, 3.6]],
    doors: [[1.0, 0, 'h', 0.9, 1, 'entry'], [3.6, 0.6, 'v', 0.8, 1], [2.6, 2.2, 'h', 0.9, 1], [6.2, 2.2, 'h', 0.8, -1], [7.2, 2.8, 'v', 0.85, 1]],
    open: [],
    windows: [[0.8, 5.8, 'h', 5.6], [7.8, 5.8, 'h', 1.6], [10.0, 0.6, 'v', 1.6]],
    counter: [[0.1, 2.28, 2.3, 0.62]],
  },
  '3-5': {
    rooms: 3.5, area: 82, W: 12.4, D: 6.6,
    list: [['Bad', 0, 0, 2.4, 2.4, 1], ['Entrée / Korridor', 2.4, 0, 4.6, 2.4], ['Dusche / WC', 7.0, 0, 1.4, 2.4, 1], ['Réduit', 8.4, 0, 1.0, 2.4], ['Küche', 9.4, 0, 3.0, 2.4],
      ['Zimmer', 0, 2.4, 3.4, 4.2], ['Zimmer', 3.4, 2.4, 2.6, 4.2], ['Wohnen / Essen', 6.0, 2.4, 6.4, 4.2]],
    doors: [[3.6, 0, 'h', 1.0, 1, 'entry'], [2.4, 0.7, 'v', 0.8, -1], [7.0, 0.7, 'v', 0.7, 1], [2.5, 2.4, 'h', 0.8, 1], [4.4, 2.4, 'h', 0.8, 1], [8.5, 2.4, 'h', 0.75, -1]],
    open: [[6.05, 2.4, 'h', 0.9], [9.45, 2.4, 'h', 2.9]],
    windows: [[0.6, 6.6, 'h', 2.2], [3.9, 6.6, 'h', 1.6], [6.8, 6.6, 'h', 5.0], [12.4, 0.4, 'v', 1.6], [0, 3.2, 'v', 1.8]],
    counter: [[9.5, 0.08, 2.8, 0.62]],
  },
  '4-5': {
    rooms: 4.5, area: 104, W: 13.6, D: 7.65,
    list: [['Bad', 0, 0, 2.2, 2.6, 1], ['Entrée / Korridor', 2.2, 0, 7.0, 2.6], ['Dusche / WC', 9.2, 0, 1.4, 2.6, 1], ['Küche', 10.6, 0, 3.0, 2.6],
      ['Zimmer', 0, 2.6, 3.2, 5.05], ['Zimmer', 3.2, 2.6, 2.6, 5.05], ['Zimmer', 5.8, 2.6, 2.4, 5.05], ['Wohnen / Essen', 8.2, 2.6, 5.4, 5.05]],
    doors: [[4.2, 0, 'h', 1.0, 1, 'entry'], [2.2, 0.8, 'v', 0.8, -1], [9.2, 0.8, 'v', 0.7, 1], [2.3, 2.6, 'h', 0.8, 1], [4.0, 2.6, 'h', 0.8, 1], [6.4, 2.6, 'h', 0.8, 1]],
    open: [[8.25, 2.6, 'h', 0.9], [10.65, 2.6, 'h', 2.9]],
    windows: [[0.5, 7.65, 'h', 2.2], [3.6, 7.65, 'h', 1.8], [6.1, 7.65, 'h', 1.8], [8.8, 7.65, 'h', 4.2], [13.6, 0.5, 'v', 1.6], [0, 3.6, 'v', 2.0]],
    counter: [[10.7, 0.08, 2.8, 0.62]],
  },
};

// Direction the loggia faces -> degrees; the north arrow turns by facing - 180.
const FACING = { n: 0, ne: 45, e: 90, se: 135, s: 180, sw: 225, w: 270, nw: 315 };
const LOGGIA = 1.8;

const r1 = (n) => Math.round(n * 10) / 10;
const fmtArea = (a) => `${String(Math.round(a * 2) / 2).replace('.', ',')} m²`;

function svg(key, facing) {
  const t = TYPES[key];
  const ox = (VW - t.W * S) / 2;
  const oy = 96 + (322 - (t.D + LOGGIA) * S) / 2;
  const X = (m) => r1(ox + m * S);
  const Y = (m) => r1(oy + m * S);
  const parts = [];
  // Loggia / garden seat in front of the living side.
  parts.push(`<rect x='${X(0)}' y='${Y(t.D)}' width='${r1(t.W * S)}' height='${r1(LOGGIA * S)}' fill='${OUT}' stroke='${INK}' stroke-width='1.2'/>`);
  parts.push(`<text x='${X(t.W / 2)}' y='${Y(t.D + LOGGIA / 2) + 4}' text-anchor='middle' font-size='12' fill='${INK}'>Loggia / Sitzplatz</text>`);
  // Rooms
  for (const [, x, y, w, h, wet] of t.list) {
    parts.push(`<rect x='${X(x)}' y='${Y(y)}' width='${r1(w * S)}' height='${r1(h * S)}' fill='${wet ? WET : '#fff'}' stroke='${INK}' stroke-width='2.5'/>`);
  }
  // Kitchen counters
  for (const [x, y, w, h] of t.counter) {
    parts.push(`<rect x='${X(x)}' y='${Y(y)}' width='${r1(w * S)}' height='${r1(h * S)}' fill='none' stroke='${INK}' stroke-width='1' stroke-dasharray='0'/>`);
    parts.push(`<circle cx='${X(x + w * 0.3)}' cy='${Y(y + h / 2)}' r='5' fill='none' stroke='${INK}' stroke-width='1'/><circle cx='${X(x + w * 0.3 + 0.4)}' cy='${Y(y + h / 2)}' r='5' fill='none' stroke='${INK}' stroke-width='1'/>`);
  }
  // Open connections: erase the wall, mark with a dashed line.
  for (const [x, y, o, len] of t.open) {
    const [x2, y2] = o === 'h' ? [x + len, y] : [x, y + len];
    parts.push(`<line x1='${X(x)}' y1='${Y(y)}' x2='${X(x2)}' y2='${Y(y2)}' stroke='#fff' stroke-width='4'/>`);
    parts.push(`<line x1='${X(x)}' y1='${Y(y)}' x2='${X(x2)}' y2='${Y(y2)}' stroke='${INK}' stroke-width='0.8' stroke-dasharray='4 4'/>`);
  }
  // Outer wall
  parts.push(`<rect x='${X(0)}' y='${Y(0)}' width='${r1(t.W * S)}' height='${r1(t.D * S)}' fill='none' stroke='${INK}' stroke-width='7'/>`);
  // Windows: a gap in the outer wall with a thin double line.
  for (const [x, y, o, len] of t.windows) {
    if (o === 'h') {
      parts.push(`<rect x='${X(x)}' y='${Y(y) - 4}' width='${r1(len * S)}' height='8' fill='#fff'/>`);
      parts.push(`<line x1='${X(x)}' y1='${Y(y) - 2}' x2='${X(x + len)}' y2='${Y(y) - 2}' stroke='${INK}' stroke-width='1'/><line x1='${X(x)}' y1='${Y(y) + 2}' x2='${X(x + len)}' y2='${Y(y) + 2}' stroke='${INK}' stroke-width='1'/>`);
    } else {
      parts.push(`<rect x='${X(x) - 4}' y='${Y(y)}' width='8' height='${r1(len * S)}' fill='#fff'/>`);
      parts.push(`<line x1='${X(x) - 2}' y1='${Y(y)}' x2='${X(x) - 2}' y2='${Y(y + len)}' stroke='${INK}' stroke-width='1'/><line x1='${X(x) + 2}' y1='${Y(y)}' x2='${X(x) + 2}' y2='${Y(y + len)}' stroke='${INK}' stroke-width='1'/>`);
    }
  }
  // Doors: gap, leaf and swing arc.
  for (const [x, y, o, w, swing, kind] of t.doors) {
    const sw = kind === 'entry' ? 9 : 5;
    if (o === 'h') {
      parts.push(`<rect x='${X(x)}' y='${Y(y) - sw / 2}' width='${r1(w * S)}' height='${sw}' fill='#fff'/>`);
      const hy = Y(y);
      const ty = r1(hy + swing * w * S);
      parts.push(`<line x1='${X(x)}' y1='${hy}' x2='${X(x)}' y2='${ty}' stroke='${INK}' stroke-width='1.6'/>`);
      parts.push(`<path d='M${X(x)} ${ty} A${r1(w * S)} ${r1(w * S)} 0 0 ${swing > 0 ? 0 : 1} ${X(x + w)} ${hy}' fill='none' stroke='${INK}' stroke-width='0.8' stroke-dasharray='3 3'/>`);
    } else {
      parts.push(`<rect x='${X(x) - sw / 2}' y='${Y(y)}' width='${sw}' height='${r1(w * S)}' fill='#fff'/>`);
      const hx = X(x);
      const tx = r1(hx + swing * w * S);
      parts.push(`<line x1='${hx}' y1='${Y(y)}' x2='${tx}' y2='${Y(y)}' stroke='${INK}' stroke-width='1.6'/>`);
      parts.push(`<path d='M${tx} ${Y(y)} A${r1(w * S)} ${r1(w * S)} 0 0 ${swing > 0 ? 1 : 0} ${hx} ${Y(y + w)}' fill='none' stroke='${INK}' stroke-width='0.8' stroke-dasharray='3 3'/>`);
    }
  }
  // Room labels with area
  for (const [label, x, y, w, h] of t.list) {
    const cx = X(x + w / 2);
    const cy = Y(y + h * 0.56);
    const small = w < 1.6;
    const size = small ? 9.5 : 12;
    const lines = small ? label.split(' / ') : [label];
    const tspans = lines.map((l, i) => `<tspan x='${cx}' dy='${i === 0 ? 0 : size + 1}'>${l}</tspan>`).join('');
    const top = cy - ((lines.length - 1) * (size + 1)) / 2 - 2;
    parts.push(`<text x='${cx}' y='${r1(top)}' text-anchor='middle' font-size='${size}' font-weight='600' fill='${INK}'>${tspans}</text>`);
    parts.push(`<text x='${cx}' y='${r1(top + lines.length * (size + 1) + 3)}' text-anchor='middle' font-size='${size - 1}' fill='#4A4566'>${fmtArea(w * h)}</text>`);
  }
  // Entrance mark
  const entry = t.doors.find((d) => d[5] === 'entry');
  parts.push(`<text x='${X(entry[0] + entry[3] / 2)}' y='${Y(0) - 14}' text-anchor='middle' font-size='10' fill='#4A4566'>Eingang</text>`);
  // North arrow, turned to the loggia's facing.
  const rot = FACING[facing] - 180;
  parts.push(`<g transform='translate(${VW - 46} 42) rotate(${rot})'><circle r='20' fill='#fff' stroke='${INK}' stroke-width='1.2'/><path d='M0 -16 L7 8 L0 3 L-7 8 Z' fill='${INK}'/><text y='-22' text-anchor='middle' font-size='11' font-weight='700' fill='${INK}' transform='rotate(${-rot} 0 -26)'>N</text></g>`);
  // Title, scale bar, note
  parts.push(`<text x='24' y='34' font-size='17' font-weight='700' fill='${INK}'>${String(t.rooms)} Zimmer · ${t.area} m²</text>`);
  parts.push(`<text x='24' y='52' font-size='11' fill='#4A4566'>Grundriss indikativ · Masse und Möblierung unverbindlich</text>`);
  const sbY = VH - 22;
  parts.push(`<g fill='${INK}' font-size='9'><rect x='24' y='${sbY}' width='${S}' height='5'/><rect x='${24 + S}' y='${sbY}' width='${S}' height='5' fill='#fff' stroke='${INK}' stroke-width='0.8'/><rect x='${24 + 2 * S}' y='${sbY}' width='${3 * S}' height='5' fill='${INK}'/><text x='24' y='${sbY - 4}'>0</text><text x='${24 + S}' y='${sbY - 4}' text-anchor='middle'>1</text><text x='${24 + 2 * S}' y='${sbY - 4}' text-anchor='middle'>2</text><text x='${24 + 5 * S}' y='${sbY - 4}' text-anchor='middle'>5 m</text></g>`);
  return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${VW} ${VH}' width='${VW}' height='${VH}' ${FONT} role='img' aria-label='Grundriss indikativ, ${String(t.rooms)} Zimmer, ${t.area} m²'><rect width='${VW}' height='${VH}' fill='#fff'/>${parts.join('')}</svg>\n`;
}

const dir = new URL('../public/plans/', import.meta.url);
mkdirSync(dir, { recursive: true });
for (const key of Object.keys(TYPES)) for (const f of Object.keys(FACING)) writeFileSync(new URL(`typ-${key}-${f}.svg`, dir), svg(key, f));
console.log(`plans: ${Object.keys(TYPES).length * Object.keys(FACING).length} files in public/plans/`);
