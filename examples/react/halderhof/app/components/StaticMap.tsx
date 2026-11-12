/**
 * Static map from OpenStreetMap tiles (the one map host the CSP allows): a
 * mosaic of lazy tiles centred on the point, no JavaScript, no library.
 * `area`: the address is rounded, so it draws a zone instead of a pin.
 */
import type { CSSProperties } from 'react';
import './StaticMap.css';

type Props = {
  lat: number;
  lng: number;
  zoom?: number;
  label: string;
  area?: boolean;
  height?: number;
  linkLabel: string;
  /** Several labelled points (office map): drawn around the centre lat/lng. */
  points?: { lat: number; lng: number; label: string; href?: string }[];
  className?: string;
};

export function StaticMap({ lat, lng, zoom = 14, label, area = false, height = 380, linkLabel, points, className }: Props) {
  const n = 2 ** zoom;
  const fx = ((lng + 180) / 360) * n;
  const rad = (lat * Math.PI) / 180;
  const fy = ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * n;
  const cx = Math.floor(fx);
  const cy = Math.floor(fy);
  // Offset of the point inside its tile, in px.
  const ox = Math.round((fx - cx) * 256);
  const oy = Math.round((fy - cy) * 256);
  const tiles: { x: number; y: number; dx: number; dy: number }[] = [];
  const rows = height <= 512 ? 1 : 2;
  for (let dy = -rows; dy <= rows; dy++) for (let dx = -3; dx <= 3; dx++) tiles.push({ x: (cx + dx + n) % n, y: cy + dy, dx, dy });
  const world = (la: number, ln: number) => {
    const r = (la * Math.PI) / 180;
    return { x: ((ln + 180) / 360) * n * 256, y: ((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * n * 256 };
  };
  const c = world(lat, lng);
  const pins = (points ?? []).map((p) => { const w = world(p.lat, p.lng); return { ...p, dx: Math.round(w.x - c.x), dy: Math.round(w.y - c.y) }; });
  const osm = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=${zoom + 1}/${lat}/${lng}`;
  const at = (dx: number, dy: number): CSSProperties => ({ left: `calc(50% + ${dx}px)`, top: `calc(50% + ${dy}px)` });
  return (
    <figure className={['smap', className].filter(Boolean).join(' ')} style={{ '--h': `${height}px` } as CSSProperties}>
      <div className="smap__view" role={pins.length ? 'group' : 'img'} aria-label={label}>
        <div className="smap__tiles" style={{ transform: `translate(${-ox}px, ${-oy}px)` }}>
          {tiles.map((t) => (
            <img key={`${t.dx}:${t.dy}`} src={`https://tile.openstreetmap.org/${zoom}/${t.x}/${t.y}.png`} alt="" width={256} height={256} loading="lazy" decoding="async"
              style={{ left: `calc(50% + ${t.dx * 256}px)`, top: `calc(50% + ${t.dy * 256}px)` }} />
          ))}
        </div>
        {pins.length === 0 && <span className={['smap__mark', area && 'smap__mark--area'].filter(Boolean).join(' ')} aria-hidden="true"></span>}
        {pins.map((p) => (
          p.href
            ? <a key={p.label} className="smap__pin" href={p.href} style={at(p.dx, p.dy)}><span>{p.label}</span></a>
            : <span key={p.label} className="smap__pin" style={at(p.dx, p.dy)}><span>{p.label}</span></span>
        ))}
      </div>
      <figcaption className="smap__cap">
        <span>© <a href="https://www.openstreetmap.org/copyright" rel="noopener">OpenStreetMap</a></span>
        <a href={osm} rel="noopener">{linkLabel} ↗</a>
      </figcaption>
    </figure>
  );
}
