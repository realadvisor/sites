/**
 * A static map from OpenStreetMap tiles (no library, no iframe, no JS): a
 * grid of 256 px tiles centred on the point, a marker, the attribution and a
 * link to the full map. Coordinates from the API are rounded, never exact.
 */
import type { CSSProperties } from 'react';
import './StaticMap.css';

type Props = { lat: number; lng: number; zoom?: number; label: string; cols?: number; rows?: number; className?: string };

export function StaticMap({ lat, lng, zoom = 15, label, cols = 7, rows = 5, className }: Props) {
  const n = 2 ** zoom;
  const fx = ((lng + 180) / 360) * n;
  const rad = (lat * Math.PI) / 180;
  const fy = ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * n;
  const x0 = Math.floor(fx - cols / 2);
  const y0 = Math.floor(fy - rows / 2);
  // Marker position inside the grid, in % of the grid.
  const mx = ((fx - x0) / cols) * 100;
  const my = ((fy - y0) / rows) * 100;
  const tiles = Array.from({ length: rows }, (_, j) => Array.from({ length: cols }, (_, i) => ({ x: x0 + i, y: y0 + j }))).flat();
  const osm = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=${zoom}/${lat}/${lng}`;
  return (
    <figure className={['map', className].filter(Boolean).join(' ')} style={{ '--cols': cols, '--rows': rows, '--mx': `${mx}%`, '--my': `${my}%` } as CSSProperties}>
      <div className="frame">
        <div className="grid" role="img" aria-label={`Carte : ${label}`}>
          {tiles.map((t) => <img key={`${t.x}-${t.y}`} src={`https://tile.openstreetmap.org/${zoom}/${t.x}/${t.y}.png`} alt="" width="256" height="256" loading="lazy" decoding="async" />)}
          <span className="pin" aria-hidden="true"></span>
        </div>
      </div>
      <figcaption>
        <span>{label}</span>
        <span><a href={osm} rel="noopener" target="_blank">Ouvrir la carte</a> · © <a href="https://www.openstreetmap.org/copyright" rel="noopener" target="_blank">contributeurs OpenStreetMap</a></span>
      </figcaption>
    </figure>
  );
}
