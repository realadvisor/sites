/**
 * A static map from OpenStreetMap tiles (no library, no iframe, no JS): a
 * grid of 256 px tiles centred on the point, numbered markers for places,
 * the attribution and a link to the full map. API coordinates are rounded.
 */
import type { CSSProperties } from 'react';
import { tr, type Lang } from '../lib/i18n';
import './StaticMap.css';

type Props = { lat: number; lng: number; zoom?: number; label: string; lang: Lang; cols?: number; rows?: number; marks?: { lat: number; lng: number; n: number; name: string }[] };

export function StaticMap({ lat, lng, zoom = 15, label, lang, cols = 7, rows = 5, marks = [] }: Props) {
  const t = tr(lang);
  const n = 2 ** zoom;
  const proj = (la: number, ln: number) => {
    const rad = (la * Math.PI) / 180;
    return { x: ((ln + 180) / 360) * n, y: ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * n };
  };
  const c = proj(lat, lng);
  const x0 = Math.floor(c.x - cols / 2);
  const y0 = Math.floor(c.y - rows / 2);
  const pct = (p: { x: number; y: number }) => ({ x: ((p.x - x0) / cols) * 100, y: ((p.y - y0) / rows) * 100 });
  const me = pct(c);
  const pins = marks.map((m) => ({ ...m, ...pct(proj(m.lat, m.lng)) })).filter((m) => m.x > 1 && m.x < 99 && m.y > 1 && m.y < 99);
  const tiles = Array.from({ length: rows }, (_, j) => Array.from({ length: cols }, (_, i) => ({ x: x0 + i, y: y0 + j }))).flat();
  const osm = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=${zoom}/${lat}/${lng}`;
  const vars = { '--cols': cols, '--rows': rows, '--mx': `${me.x}%`, '--my': `${me.y}%` } as CSSProperties;
  return (
    <figure className="smap" style={vars}>
      <div className="smap-frame">
        <div className="smap-grid" role="img" aria-label={`${t.mapOf}: ${label}`}>
          {tiles.map((tl) => <img key={`${tl.x}-${tl.y}`} src={`https://tile.openstreetmap.org/${zoom}/${tl.x}/${tl.y}.png`} alt="" width="256" height="256" loading="lazy" decoding="async" />)}
          {pins.map((p) => <span key={p.n} className="smap-mk" style={{ left: `${p.x}%`, top: `${p.y}%` }} title={p.name}>{p.n}</span>)}
          <span className="smap-pin" aria-hidden="true"></span>
        </div>
      </div>
      <figcaption>
        <span>{label}</span>
        <span><a href={osm} rel="noopener" target="_blank">{t.openMap}</a> · © <a href="https://www.openstreetmap.org/copyright" rel="noopener" target="_blank">{t.osm}</a></span>
      </figcaption>
    </figure>
  );
}
