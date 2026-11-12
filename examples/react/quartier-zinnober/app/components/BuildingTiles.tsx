import type { BuildingInfo } from '../lib/units';
import { chf, freeRent, monthYear } from '../lib/units';
import { Icon } from './Icon';
import './BuildingTiles.css';

export function BuildingTiles({ houses }: { houses: BuildingInfo[] }) {
  return (
    <ul className="tiles">
      {houses.map((h) => {
        const rents = h.rows.map((r) => freeRent(r.u)).filter((n): n is number => n != null);
        return (
          <li className={`tile tile--${h.key.toLowerCase()}`} key={h.key}>
            <a href={`/wohnungen?haus=${h.key}`}>
              <span className="name">{h.name}</span>
              {h.moveIn && <span className="move">Bezug ab<br /><strong>{monthYear(h.moveIn)}</strong></span>}
              <span className="meta">
                <span className="num">{h.available > 0 ? `${h.available} von ${h.rows.length} frei` : 'Alle vergeben'}</span>
                {rents.length > 0 && <span className="num">ab {chf(Math.min(...rents))}</span>}
              </span>
              <span className="go" aria-hidden="true"><Icon name="arrow" size={22} /></span>
            </a>
          </li>
        );
      })}
    </ul>
  );
}
