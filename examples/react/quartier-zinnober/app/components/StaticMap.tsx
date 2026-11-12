/**
 * A static map for one address: OpenStreetMap tiles laid out around the
 * point (no library, no iframe, no JS), a pin, the attribution and a link to
 * the full map. Tiles are lazy and come from tile.openstreetmap.org (allowed
 * by the kit's CSP).
 */
import { t } from '@realadvisor/sites-kit-core/i18n';
import './StaticMap.css';

type Props = {
  lat: number;
  lng: number;
  label: string;
  zoom?: number;
  cols?: number;
  rows?: number;
  className?: string;
  /** The map is the page's first image: load the tiles around the pin first. */
  eager?: boolean;
};

export function StaticMap({ lat, lng, label, zoom = 16, cols = 6, rows = 4, className, eager = false }: Props) {
  const n = 2 ** zoom;
  const fx = ((lng + 180) / 360) * n;
  const rad = (lat * Math.PI) / 180;
  const fy = ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * n;
  const x0 = Math.floor(fx) - Math.floor(cols / 2);
  const y0 = Math.floor(fy) - Math.floor(rows / 2);
  // Pixel position of the point inside the tile grid.
  const px = Math.round((fx - x0) * 256);
  const py = Math.round((fy - y0) * 256);
  const tiles = Array.from({ length: rows }, (_, r) => Array.from({ length: cols }, (_, c) => ({ x: x0 + c, y: y0 + r, c, r }))).flat();
  const osm = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=${zoom}/${lat}/${lng}`;
  return (
    <>
      {eager && <link rel="preconnect" href="https://tile.openstreetmap.org" />}
      <figure className={['map', className].filter(Boolean).join(' ')}>
        <div className="viewport" role="img" aria-label={`Karte: ${label}`}>
          <div className="grid" style={{ width: `${cols * 256}px`, height: `${rows * 256}px`, left: `calc(50% - ${px}px)`, top: `calc(50% - ${py}px)` }}>
            {tiles.map((tl) => (
              <img
                key={`${tl.x}-${tl.y}`}
                src={`https://tile.openstreetmap.org/${zoom}/${tl.x}/${tl.y}.png`}
                width="256"
                height="256"
                alt=""
                loading={eager && Math.abs(tl.x + 0.5 - fx) < 1.6 && Math.abs(tl.y + 0.5 - fy) < 1.6 ? 'eager' : 'lazy'}
                fetchPriority={eager && Math.floor(fx) === tl.x && Math.floor(fy) === tl.y ? 'high' : undefined}
                decoding="async"
                style={{ left: `${tl.c * 256}px`, top: `${tl.r * 256}px` }}
              />
            ))}
          </div>
          <span className="pin" aria-hidden="true">
            <svg viewBox="0 0 40 52" width="40" height="52"><path d="M20 50S4 32 4 19a16 16 0 0 1 32 0c0 13-16 31-16 31Z" fill="#E4572E" stroke="#140F3A" strokeWidth="3" /><circle cx="20" cy="19" r="6" fill="#140F3A" /></svg>
          </span>
          <span className="tag">{label}</span>
        </div>
        <figcaption>
          <a href={osm} rel="noopener" target="_blank">Auf OpenStreetMap öffnen</a>
          <span>© <a href="https://www.openstreetmap.org/copyright" rel="noopener" target="_blank">{t('osmContributors')}</a></span>
        </figcaption>
      </figure>
    </>
  );
}
