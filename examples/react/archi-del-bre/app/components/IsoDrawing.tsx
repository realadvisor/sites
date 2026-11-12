/**
 * Schematic axonometric drawing of the buildings, generated as SVG on the
 * server: each building a stack of floors, each unit a segment of the front
 * facade (width by living area), the last unit of a floor wrapping onto the
 * side facade, the top floor set back as penthouses. Fill = status; every
 * segment is a link with a full text label, so the drawing is usable with
 * the keyboard. The unit table next to it stays the accessible path.
 *
 * Needs building and position per unit (fixture only): without them it
 * renders nothing and the page falls back to the table alone.
 *
 * Hover / focus sync with the table lives in app/scripts/units-view.ts
 * ([data-unit] on both sides).
 */
import { Fragment } from 'react';
import type { Unit } from '@realadvisor/sites-sdk/types';
import { unitExtra } from '../lib/extras';
import { building, buildingName, floorName, formatRooms, isPenthouse, shortId, statusLabel, unitNumber, unitPath, unitPrice } from '../lib/units';
import type { L } from '../lib/routes';
import { c } from '../lib/copy';
import './IsoDrawing.css';

type Props = {
  units: Unit[];
  l: L;
  /** Unit page: this unit drawn as the highlight; the other units stay links to their own pages. */
  current?: string;
  className?: string;
  /** Visible caption under the drawing. */
  caption?: string;
};

const W = 24; // facade length, m
const D = 12; // depth
const H = 3.2; // floor height
const SET = 3.2; // penthouse setback from the front
const GAP = 9; // between buildings
const ax = (18 * Math.PI) / 180;
const ay = (38 * Math.PI) / 180;
const k = 0.72;
const P = (x: number, y: number, z: number): [number, number] => [x * Math.cos(ax) - y * k * Math.cos(ay), x * Math.sin(ax) + y * k * Math.sin(ay) - z];
const pts = (...p: [number, number, number][]) => p.map((q) => P(...q).map((n) => n.toFixed(2)).join(',')).join(' ');

type Seg = { u: Unit; front: string; side?: string; tx: number; ty: number; label: string };
type Bld = { name: string; segs: Seg[]; tops: string[]; ground: string; labelAt: [number, number] };

export function IsoDrawing({ units, l, current, className, caption }: Props) {
  // fixture only: building and position on the floor.
  const placed = units.every((u) => building(u) && unitExtra(u).position != null && u.floor != null);
  if (!placed) return null;
  const buildings = [...new Set(units.map(building))].sort();

  const bounds = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
  const grow = (x: number, y: number, z: number) => {
    const [sx, sy] = P(x, y, z);
    bounds.x0 = Math.min(bounds.x0, sx); bounds.x1 = Math.max(bounds.x1, sx);
    bounds.y0 = Math.min(bounds.y0, sy); bounds.y1 = Math.max(bounds.y1, sy);
  };

  const blds: Bld[] = buildings.map((b, bi) => {
    const ox = bi * (W + GAP);
    const oy = bi * 2.5; // the second house a little lower on the slope, a little forward
    const oz = -bi * 2.4;
    const mine = units.filter((u) => building(u) === b);
    const floors = [...new Set(mine.map((u) => u.floor ?? 0))].sort((a, z) => a - z);
    const segs: Seg[] = [];
    const tops: string[] = [];
    for (const f of floors) {
      const row = mine.filter((u) => u.floor === f).sort((a, z) => (unitExtra(a).position ?? 0) - (unitExtra(z).position ?? 0));
      const pent = row.some((u) => isPenthouse(u, units));
      const x0 = ox + (pent ? 1.2 : 0);
      const x1 = ox + W - (pent ? 1.2 : 0);
      const yf = oy + (pent ? D - SET : D);
      const yb = oy;
      const z0 = oz + f * H;
      const z1 = z0 + H;
      const total = row.reduce((s, u) => s + (u.living_surface ?? 1), 0);
      let x = x0;
      row.forEach((u, i) => {
        const w = ((u.living_surface ?? 1) / total) * (x1 - x0);
        const xa = x;
        const xb = i === row.length - 1 ? x1 : x + w;
        x = xb;
        const front = pts([xa, yf, z0], [xb, yf, z0], [xb, yf, z1], [xa, yf, z1]);
        const side = i === row.length - 1 ? pts([x1, yf, z0], [x1, yb, z0], [x1, yb, z1], [x1, yf, z1]) : undefined;
        const [tx, ty] = P((xa + xb) / 2, yf, (z0 + z1) / 2);
        const label = [unitNumber(u), formatRooms(u.rooms, l), floorName(u, l, units), buildingName(b, l), statusLabel(u, l), u.status === 'available' ? unitPrice(u, l) : ''].filter(Boolean).join(', ');
        segs.push({ u, front, side, tx, ty, label });
      });
      // Slab top of this floor (visible only where nothing stands on it: the penthouse terraces and the roof).
      tops.push(pts([x0, yb, z1], [x1, yb, z1], [x1, yf, z1], [x0, yf, z1]));
      for (const [gx, gy, gz] of [[x0, yb, z1], [x1, yb, z1], [x1, yf, z0], [x0, yf, z0]] as const) grow(gx, gy, gz);
    }
    const g = 2.2;
    const zg = oz;
    const ground = pts([ox - g, oy - g, zg], [ox + W + g, oy - g, zg], [ox + W + g, oy + D + g, zg], [ox - g, oy + D + g, zg]);
    for (const [gx, gy] of [[ox - g, oy + D + g], [ox + W + g, oy + D + g], [ox + W + g, oy - g]] as const) grow(gx, gy, zg);
    const labelAt = P(ox + 0.4, oy + D + g + 0.4, zg);
    grow(ox, oy + D + g + 4, zg);
    return { name: buildingName(b, l), segs, tops, ground, labelAt };
  });
  const pad = 2;
  const vb = `${(bounds.x0 - pad).toFixed(1)} ${(bounds.y0 - pad).toFixed(1)} ${(bounds.x1 - bounds.x0 + 2 * pad).toFixed(1)} ${(bounds.y1 - bounds.y0 + 2 * pad).toFixed(1)}`;
  const title = l === 'de' ? 'Schematische Axonometrie der Häuser mit allen Wohnungen nach Status' : 'Assonometria schematica delle case con tutti gli appartamenti per stato';
  const cls = (...x: (string | false | undefined)[]) => x.filter(Boolean).join(' ');

  return (
    <figure className={cls('iso', className, !!current && 'single')} data-iso="">
      <svg viewBox={vb} role="group" aria-label={title} xmlns="http://www.w3.org/2000/svg">
        {blds.map((b) => {
          const floorsOf = [...new Set(b.segs.map((x) => x.u.floor))];
          return (
            <g className="bld" key={b.name}>
              <polygon className="ground" points={b.ground} />
              {b.segs.map((s, i) => (
                <Fragment key={s.u.id}>
                  {s.u.id === current ? (
                    <g className={cls('u', s.u.status, 'is-current')} data-unit={shortId(s.u)} aria-current="page">
                      <polygon className="f" points={s.front} />
                      {s.side && <polygon className="f s" points={s.side} />}
                      {s.side && <polygon className="shade" points={s.side} />}
                      <text x={s.tx.toFixed(2)} y={(s.ty + 0.4).toFixed(2)}>{unitNumber(s.u)}</text>
                    </g>
                  ) : (
                    <a href={unitPath(s.u, l)} className={cls('u', s.u.status)} data-unit={shortId(s.u)} aria-label={s.label}>
                      <polygon className="f" points={s.front} />
                      {s.side && <polygon className="f s" points={s.side} />}
                      {s.side && <polygon className="shade" points={s.side} />}
                      <text x={s.tx.toFixed(2)} y={(s.ty + 0.4).toFixed(2)} aria-hidden="true">{unitNumber(s.u)}</text>
                    </a>
                  )}
                  {/* After the last unit of a floor, its slab top (covered by the next floor except at the setback). */}
                  {(i === b.segs.length - 1 || b.segs[i + 1]!.u.floor !== s.u.floor) && <polygon className="top" points={b.tops[floorsOf.indexOf(s.u.floor)]} />}
                </Fragment>
              ))}
              <text className="bname" x={b.labelAt[0].toFixed(2)} y={(b.labelAt[1] + 2.6).toFixed(2)}>{b.name}</text>
            </g>
          );
        })}
      </svg>
      <figcaption>
        <ul className="legend" aria-label={c('legend', l)}>
          <li><span className="sw available"></span>{statusLabel({ status: 'available' }, l)}</li>
          <li><span className="sw reserved"></span>{statusLabel({ status: 'reserved' }, l)}</li>
          <li><span className="sw sold"></span>{statusLabel({ status: 'sold' }, l)}</li>
        </ul>
        {caption && <p>{caption}</p>}
      </figcaption>
    </figure>
  );
}
