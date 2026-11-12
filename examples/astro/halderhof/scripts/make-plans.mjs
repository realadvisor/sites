#!/usr/bin/env node
/**
 * Indicative floor plans per unit type of "Dorenbachhof", drawn
 * for this example (the data has no plans). One SVG per type and language
 * in public/plans/<lang>/<type>.svg, all at the same scale (1 m = 32 px):
 * walls, doors, room names with m², outdoor space, north arrow, scale bar.
 *
 *   node scripts/make-plans.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs';

const S = 32; // px per metre
const M = 56; // margin

const NAMES = {
  living: { de: 'Wohnen / Küche', fr: 'Séjour / cuisine', en: 'Living / kitchen' },
  bed: { de: 'Zimmer', fr: 'Chambre', en: 'Bedroom' },
  bath: { de: 'Bad', fr: 'Bains', en: 'Bath' },
  shower: { de: 'Dusche', fr: 'Douche', en: 'Shower' },
  hall: { de: 'Entrée', fr: 'Entrée', en: 'Hall' },
  store: { de: 'Reduit', fr: 'Réduit', en: 'Store' },
  loggia: { de: 'Loggia', fr: 'Loggia', en: 'Loggia' },
  terrace: { de: 'Terrasse', fr: 'Terrasse', en: 'Terrace' },
  garden: { de: 'Gartensitzplatz und Garten', fr: 'Terrasse et jardin', en: 'Patio and garden' },
};

// [kind, x, y, w, h, door] in metres; door = [side, offset] (side n|s|e|w), 'entry' marks the flat's door.
const TYPES = {
  '2-5': { W: 9, D: 7, out: ['loggia', 0, 7, 3.8, 1.9], rooms: [
    ['bath', 0, 0, 2.4, 2.8, ['s', 0.7]],
    ['hall', 2.4, 0, 3.8, 2.8, ['n', 1.2], 'entry'],
    ['bed', 6.2, 0, 2.8, 4.6, ['w', 3.2]],
    ['living', 0, 2.8, 6.2, 4.2],
    ['store', 6.2, 4.6, 2.8, 2.4, ['w', 0.3]],
  ] },
  '3-5': { W: 11, D: 8, out: ['loggia', 0, 8, 4.8, 1.9], rooms: [
    ['bath', 0, 0, 2.6, 3.2, ['s', 0.9]],
    ['hall', 2.6, 0, 2.6, 3.2, ['n', 0.8], 'entry'],
    ['bed', 5.2, 0, 3.2, 3.6, ['w', 2.4]],
    ['shower', 8.4, 0, 2.6, 3.6, ['s', 0.9]],
    ['living', 0, 3.2, 7.2, 4.8],
    ['bed', 7.2, 3.6, 3.8, 4.4, ['w', 0.4]],
  ] },
  '4-5': { W: 12.4, D: 8.8, out: ['loggia', 0, 8.8, 5.6, 2], rooms: [
    ['bath', 0, 0, 2.6, 3.2, ['s', 0.9]],
    ['hall', 2.6, 0, 2.4, 3.2, ['n', 0.7], 'entry'],
    ['shower', 5, 0, 2, 3.2, ['s', 0.5]],
    ['bed', 7, 0, 2.7, 3.6, ['s', 0.4]],
    ['bed', 9.7, 0, 2.7, 3.6, ['s', 0.4]],
    ['living', 0, 3.2, 8.2, 5.6],
    ['bed', 8.2, 3.6, 4.2, 3.6, ['w', 0.4]],
    ['store', 8.2, 7.2, 4.2, 1.6, ['w', 0.3]],
  ] },
  '3-5-attika': { W: 11.6, D: 8.3, out: ['terrace', 0, 8.3, 11.6, 3], rooms: [
    ['bath', 0, 0, 2.6, 3.3, ['s', 0.9]],
    ['hall', 2.6, 0, 2.6, 3.3, ['n', 0.8], 'entry'],
    ['bed', 5.2, 0, 3.4, 3.6, ['w', 2.5]],
    ['shower', 8.6, 0, 3, 3.6, ['s', 1.1]],
    ['living', 0, 3.3, 7.6, 5],
    ['bed', 7.6, 3.6, 4, 4.7, ['w', 0.4]],
  ] },
  '4-5-attika': { W: 14, D: 9.2, out: ['terrace', 0, 9.2, 14, 3.2], rooms: [
    ['bath', 0, 0, 2.8, 3.4, ['s', 0.9]],
    ['hall', 2.8, 0, 2.6, 3.4, ['n', 0.8], 'entry'],
    ['shower', 5.4, 0, 2.2, 3.4, ['s', 0.6]],
    ['bed', 7.6, 0, 3.2, 3.8, ['s', 0.4]],
    ['bed', 10.8, 0, 3.2, 3.8, ['s', 0.4]],
    ['living', 0, 3.4, 9.4, 5.8],
    ['bed', 9.4, 3.8, 4.6, 3.8, ['w', 0.4]],
    ['store', 9.4, 7.6, 4.6, 1.6, ['w', 0.3]],
  ] },
};

const px = (m) => +(M + m * S).toFixed(1);
const fmt = (n) => Math.round(n);

function door(x, y, w, h, [side, off], entry) {
  const len = 0.9 * S;
  const o = off * S;
  let gap, leaf, arc;
  const X = px(x), Y = px(y), Wd = w * S, Hd = h * S;
  if (side === 'n' || side === 's') {
    const wy = side === 'n' ? Y : Y + Hd;
    const x0 = X + o, x1 = x0 + len;
    const dir = side === 'n' ? 1 : -1; // leaf swings into the room
    gap = `<rect x="${x0}" y="${wy - 4}" width="${len}" height="8" fill="#fff"/>`;
    leaf = `<line x1="${x0}" y1="${wy}" x2="${x0}" y2="${wy + dir * len}" class="leaf"/>`;
    arc = `<path d="M${x0} ${wy + dir * len} A${len} ${len} 0 0 ${dir > 0 ? 0 : 1} ${x1} ${wy}" class="arc"/>`;
  } else {
    const wx = side === 'w' ? X : X + Wd;
    const y0 = Y + o, y1 = y0 + len;
    const dir = side === 'w' ? 1 : -1;
    gap = `<rect x="${wx - 4}" y="${y0}" width="8" height="${len}" fill="#fff"/>`;
    leaf = `<line x1="${wx}" y1="${y0}" x2="${wx + dir * len}" y2="${y0}" class="leaf"/>`;
    arc = `<path d="M${wx + dir * len} ${y0} A${len} ${len} 0 0 ${dir > 0 ? 1 : 0} ${wx} ${y1}" class="arc"/>`;
  }
  return gap + leaf + arc + (entry ? '' : '');
}

function svg(key, lang) {
  const T = TYPES[key];
  const outD = T.out[4];
  const width = px(T.W) + M;
  const height = px(T.D + outD) + M + 24;
  const parts = [];
  // outdoor space
  const [ok, ox, oy, ow, oh] = T.out;
  parts.push(`<rect x="${px(ox)}" y="${px(oy)}" width="${ow * S}" height="${oh * S}" class="out"/>`);
  parts.push(`<text x="${px(ox + ow / 2)}" y="${px(oy + oh / 2) + 5}" class="lbl">${NAMES[ok][lang]}</text>`);
  // rooms
  for (const [k, x, y, w, h] of T.rooms) {
    parts.push(`<rect x="${px(x)}" y="${px(y)}" width="${w * S}" height="${h * S}" class="${k === 'living' ? 'room living' : 'room'}"/>`);
  }
  // open kitchen counter along the living room's west wall
  const liv = T.rooms.find((r) => r[0] === 'living');
  parts.push(`<rect x="${px(liv[1]) + 4}" y="${px(liv[2] + 0.5)}" width="${0.62 * S}" height="${3 * S}" class="fx"/>`);
  parts.push(`<rect x="${px(liv[1] + 1.7)}" y="${px(liv[2] + 1.2)}" width="${0.95 * S}" height="${1.8 * S}" class="fx"/>`);
  // fixtures in wet rooms
  for (const [k, x, y, w, h] of T.rooms) {
    if (k === 'bath') parts.push(`<rect x="${px(x + 0.2)}" y="${px(y + 0.2)}" width="${Math.min(1.7, w - 0.4) * S}" height="${0.72 * S}" rx="10" class="fx"/>`);
    if (k === 'shower') parts.push(`<rect x="${px(x + w - 1.1)}" y="${px(y + h - 1.1)}" width="${0.9 * S}" height="${0.9 * S}" class="fx"/>`);
  }
  // outer wall on top of everything
  parts.push(`<rect x="${px(0)}" y="${px(0)}" width="${T.W * S}" height="${T.D * S}" class="wall"/>`);
  // doors
  for (const [, x, y, w, h, d, e] of T.rooms) if (d) parts.push(door(x, y, w, h, d, e));
  // labels
  for (const [k, x, y, w, h] of T.rooms) {
    const cx = px(x + w / 2), cy = px(y + h / 2);
    const name = NAMES[k][lang];
    parts.push(`<text x="${cx}" y="${cy - 2}" class="lbl${k === 'living' ? ' big' : ''}">${name}</text>`);
    parts.push(`<text x="${cx}" y="${cy + 16}" class="area">${fmt(w * h)} m²</text>`);
  }
  // north arrow
  const nx = width - M + 18, ny = 30;
  parts.push(`<g transform="translate(${nx - 40} ${ny})"><circle r="17" class="na"/><path d="M0 -12 L6 8 L0 4 L-6 8 Z" class="nap"/><text y="-22" class="nt">N</text></g>`);
  // scale bar 0-5 m
  const sy = height - 22;
  parts.push(`<g class="scale"><rect x="${M}" y="${sy}" width="${2.5 * S}" height="5" class="sb1"/><rect x="${M + 2.5 * S}" y="${sy}" width="${2.5 * S}" height="5" class="sb2"/><text x="${M}" y="${sy - 6}">0</text><text x="${M + 5 * S}" y="${sy - 6}" text-anchor="end">5 m</text></g>`);
  const css = `.room{fill:#fff;stroke:#1b2420;stroke-width:2.5}.living{fill:#f1eee9}.out{fill:url(#h);stroke:#8f968f;stroke-width:1.5;stroke-dasharray:6 4}.wall{fill:none;stroke:#1b2420;stroke-width:7}.leaf{stroke:#1b2420;stroke-width:2}.arc{fill:none;stroke:#8f968f;stroke-width:1.2;stroke-dasharray:3 3}.fx{fill:none;stroke:#8f968f;stroke-width:1.4}.lbl{font:600 13px 'Public Sans',Arial,sans-serif;fill:#1b2420;text-anchor:middle;letter-spacing:.02em}.big{font-size:15px}.area{font:400 12px 'Public Sans',Arial,sans-serif;fill:#59615c;text-anchor:middle}.na{fill:#fff;stroke:#1b2420;stroke-width:1.5}.nap{fill:#1f4d3a}.nt{font:700 12px Arial,sans-serif;text-anchor:middle;fill:#1b2420}.scale text{font:500 11px Arial,sans-serif;fill:#59615c}.sb1{fill:#1b2420}.sb2{fill:#fff;stroke:#1b2420}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}"><defs><pattern id="h" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="8" height="8" fill="#fbfaf7"/><line x1="0" y1="0" x2="0" y2="8" stroke="#dcd8d1" stroke-width="2"/></pattern></defs><style>${css}</style>${parts.join('')}</svg>\n`;
}

// Garden-level variants: the same flat with a terrace and garden instead of a balcony.
for (const key of ['3-5', '4-5']) {
  const T = TYPES[key];
  TYPES[`${key}-eg`] = { ...T, out: ['garden', 0, T.D, T.W, 4.6] };
}

for (const lang of ['de', 'fr', 'en']) {
  mkdirSync(`public/plans/${lang}`, { recursive: true });
  for (const key of Object.keys(TYPES)) {
    writeFileSync(`public/plans/${lang}/${key}.svg`, svg(key, lang));
    const sum = TYPES[key].rooms.reduce((a, r) => a + r[3] * r[4], 0);
    if (lang === 'de') console.log(key, `${sum.toFixed(1)} m²`);
  }
}
