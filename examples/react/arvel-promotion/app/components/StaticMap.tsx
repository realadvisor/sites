/**
 * Static map of one address from OpenStreetMap tiles (allowed host, no
 * library, no iframe): a grid of tiles centred on the point, a marker, the
 * attribution and links to open the place in a map app. Coordinates from the
 * API are rounded, so the marker says "approximate".
 */
import type { CSSProperties } from 'react';
import './StaticMap.css';

const COLS = 5;
const ROWS = 3;

export function StaticMap({ lat, lng, label, zoom = 15 }: { lat: number; lng: number; label: string; zoom?: number }) {
  const n = 2 ** zoom;
  const fx = ((lng + 180) / 360) * n;
  const rad = (lat * Math.PI) / 180;
  const fy = ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * n;
  const x0 = Math.floor(fx) - Math.floor(COLS / 2);
  const y0 = Math.floor(fy) - Math.floor(ROWS / 2);
  const tiles: { x: number; y: number; c: number; r: number }[] = [];
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) tiles.push({ x: x0 + c, y: y0 + r, c, r });
  // point position inside the tile grid, in % of the grid
  const px = ((fx - x0) / COLS) * 100;
  const py = ((fy - y0) / ROWS) * 100;
  const osm = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=${zoom + 1}/${lat}/${lng}`;
  const gmaps = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  return (
    <figure className="smap">
      <div className="sm-viewport">
        <div className="sm-grid" style={{ '--px': `${px.toFixed(3)}%`, '--py': `${py.toFixed(3)}%` } as CSSProperties}>
          {tiles.map((t) => (
            <img key={`${t.c}-${t.r}`} src={`https://tile.openstreetmap.org/${zoom}/${t.x}/${t.y}.png`} alt="" width="256" height="256" loading="lazy" decoding="async" style={{ gridColumn: t.c + 1, gridRow: t.r + 1 }} />
          ))}
        </div>
        <span className="sm-pin" aria-hidden="true"></span>
        <span className="sm-attr">© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a></span>
      </div>
      <figcaption>
        <span>{label} <span className="muted">· emplacement approximatif</span></span>
        <span className="sm-links"><a href={osm} rel="noopener">OpenStreetMap</a><a href={gmaps} rel="noopener">Google Maps</a></span>
      </figcaption>
    </figure>
  );
}
