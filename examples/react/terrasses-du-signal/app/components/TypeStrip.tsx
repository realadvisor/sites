/**
 * Unit types: one card per room count with a large, legible plan (the
 * fitted drawing, cropped to the apartment), surfaces, and one price line:
 * "from" price (available units only) and the number available. Links to the units page filtered on
 * that type. Desktop: rows that always fill the width (5 types = 3 + 2,
 * 4 = 2 + 2); phone: one card per row.
 */
import type { CSSProperties } from 'react';
import type { UnitType } from '../lib/units';
import { Arrow } from './Arrow';
import './TypeStrip.css';

const fit = (plan: string) => plan.replace(/\.svg$/, '-fit.svg');

export function TypeStrip({ types }: { types: UnitType[] }) {
  const n = types.length;
  // Rows of 3 then 2 (6-column grid): 5 → 3+2, 4 → 2+2, 6 → 3+3. The larger
  // types come last, in the wider cards, so their plans stay as legible.
  const firstRow = n <= 3 ? n : n === 4 ? 2 : 3;
  const span = (i: number) => {
    if (n <= 3) return 6 / n;
    if (i < firstRow) return 6 / firstRow;
    const rest = n - firstRow;
    return rest % 3 === 0 || rest > 4 ? 2 : rest === 1 ? 6 : 3;
  };
  return (
    <>
      <ul className="types-strip">
        {types.map((t, i) => (
          <li key={t.rooms} style={{ '--span': span(i) } as CSSProperties}>
            <a href={`/appartements?pieces=${t.rooms}#lots`}>
              <span className="top">
                <span className="name">{t.label}</span>
              </span>
              {t.plan && (
                <span className="plan"><img src={fit(t.plan)} alt={`Plan indicatif, ${t.label}`} width="1000" height="750" loading="lazy" decoding="async" /></span>
              )}
              <span className="foot">
                <span className="meta num">{t.surfaces}</span>
                <span className="price">{t.available.length > 0 ? (
                  <>{t.priceFrom && <><span className="num">Dès {t.priceFrom}</span> · </>}<span className="num">{t.available.length} {t.available.length > 1 ? 'disponibles' : 'disponible'}</span></>
                ) : t.units.some((u) => u.status === 'reserved') ? 'Réservé' : 'Vendu'}</span>
                <span className="go" aria-hidden="true"><Arrow /></span>
              </span>
            </a>
          </li>
        ))}
      </ul>
      <p className="types-note">Plans indicatifs, non contractuels. L’échelle varie d’une typologie à l’autre.</p>
    </>
  );
}
