/**
 * One building as a stacking plan: one row per floor, top floor first; each
 * unit a block whose width follows its living area. Status shows as fill and
 * as text; free and reserved units show their net rent, let units none. Every
 * block links to its unit page. Server-rendered (works without JS); data-*
 * attributes feed the filter script (app/client.ts: unitsFilter()).
 */
import type { BuildingInfo, Filters, Row } from '../lib/units';
import { chf, floorShort, matches, monthYear, netRent, rentShort, statusLabel, unitTitle, unitUrl } from '../lib/units';
import './StackingPlan.css';

type Props = {
  building: BuildingInfo;
  filters?: Filters;
  /** Unit to mark (unit page). */
  current?: string;
  /** Compact: no rents, smaller blocks (unit page context). */
  compact?: boolean;
  headingLevel?: 2 | 3;
};

const floorName = (f: number) => (f === 0 ? 'EG' : `${f}. OG`);
const SHORT = { available: 'frei', reserved: 'res.', sold: 'verm.' } as const;

export function StackingPlan({ building: b, filters, current, compact = false, headingLevel = 2 }: Props) {
  const H = `h${headingLevel}` as 'h2' | 'h3';
  const rowsOn = (f: number): Row[] => b.rows.filter((r) => (r.u.floor ?? 0) === f).sort((x, y) => (x.x.position ?? 0) - (y.x.position ?? 0));
  const tone = ({ A: 'a', B: 'b', C: 'c' } as Record<string, string>)[b.key] ?? 'a';
  const hid = `stack-${b.key}${compact ? '-c' : ''}`;
  return (
    <section className={['stack', `tone-${tone}`, compact && 'compact'].filter(Boolean).join(' ')} data-building={b.key} aria-labelledby={hid}>
      <header className="stack-head">
        <H className="stack-title" id={hid}>{b.name}</H>
        {!compact && (
          <p className="stack-meta">
            {b.moveIn && <span>Bezug ab {monthYear(b.moveIn)}</span>}
            <span className="num" data-free="">{b.available} von {b.rows.length} frei</span>
          </p>
        )}
      </header>
      <div className="roof" aria-hidden="true"></div>
      <ol className="floors" aria-label={`${b.name}, Geschosse von oben nach unten`}>
        {b.floors.map((f) => (
          <li className="floor" key={f}>
            <span className="floor-label">{floorName(f)}</span>
            <ul className="units">
              {rowsOn(f).map((r) => {
                const rent = netRent(r.u);
                const dim = filters ? !matches(r, filters) : false;
                const label = [unitTitle(r), r.u.reference, statusLabel(r.u), rent ? `${chf(rent)} netto` : ''].filter(Boolean).join(', ');
                const isCurrent = current === r.u.id;
                return (
                  <li style={{ flexGrow: (r.u.living_surface ?? 60) + 25 }} className="unit-cell" key={r.u.id}>
                    <a
                      href={unitUrl(r.u)}
                      className={['u', `u--${r.u.status}`, dim && 'is-dim', isCurrent && 'is-current'].filter(Boolean).join(' ')}
                      aria-label={label}
                      aria-current={isCurrent ? 'page' : undefined}
                      data-unit=""
                      data-status={r.u.status}
                      data-rooms={r.u.rooms}
                      data-rent={rent ?? ''}
                      data-floor={r.u.floor ?? 0}
                      data-movein={r.u.available_from?.slice(0, 7) ?? ''}
                      data-haus={r.x.building}
                    >
                      <span className="u-no">{r.u.reference ?? floorShort(r.u)}</span>
                      <span className="u-rooms">{String(r.u.rooms ?? '')}<span className="u-zi"> Zi.</span></span>
                      {!compact && (
                        <span className="u-rent num">
                          <span className="long">{rent ? chf(rent) : statusLabel(r.u)}</span>
                          <span className="short" aria-hidden="true">{rent ? rentShort(rent) : SHORT[r.u.status]}</span>
                        </span>
                      )}
                    </a>
                  </li>
                );
              })}
            </ul>
          </li>
        ))}
      </ol>
      <div className="ground" aria-hidden="true"></div>
    </section>
  );
}
