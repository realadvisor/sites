/**
 * Stacking plan: one row per floor, top floor first; each unit a block whose
 * width follows its living surface, status as fill and text. Every block
 * links to its lot page. Server-rendered (works without JS); the filters on
 * the Logements page dim blocks with `data-dim` (units() in app/client.ts).
 * Order on the floor and lot numbers are fixture only.
 */
import type { DevelopmentWithUnits } from '@realadvisor/sites-sdk/types';
import { extraOf, unitsInOrder, type UnitExtras } from '../lib/units';
import { floorName, floorShort, formatSurface, statusLabel, typeCode, unitPrice, unitUrl } from '../lib/fr';
import './StackingPlan.css';

type Props = {
  programme: Pick<DevelopmentWithUnits, 'slug' | 'units'>;
  /** Fixture only: unit_number and position on the floor, by unit id. */
  extras: UnitExtras;
  /** Filter state from the URL: a type code (T1..T5) and "only available". */
  type?: string;
  onlyAvailable?: boolean;
  compact?: boolean;
  /** Unit to highlight (lot page). */
  current?: string;
  labelledby?: string;
};

export function StackingPlan({ programme: d, extras, type, onlyAvailable, compact = false, labelledby, current }: Props) {
  const units = unitsInOrder(d, extras);
  const floors = [...new Set(units.map((u) => u.floor ?? 0))].sort((a, b) => b - a);
  const dim = (u: (typeof units)[number]) => (!!type && typeCode(u) !== type) || (!!onlyAvailable && u.status !== 'available');
  return (
    <div className={compact ? 'stack stack--compact' : 'stack'} data-stack="" role="group" aria-labelledby={labelledby}>
      <div className="sp-roof" aria-hidden="true"></div>
      {floors.map((f) => {
        const row = units.filter((u) => (u.floor ?? 0) === f);
        const label = floorName(row[0]!);
        return (
          <div className="sp-floor" key={f}>
            <p className="sp-fl"><span className="sp-fl-long">{label}</span><span className="sp-fl-short" aria-hidden="true">{floorShort(f)}</span></p>
            <ul className="sp-row" aria-label={label}>
              {row.map((u) => {
                const x = extraOf(extras, u);
                const m2 = u.living_surface ? formatSurface(u.living_surface) : '';
                const desc = [typeCode(u), m2, label, unitPrice(u)].filter(Boolean).join(', ');
                return (
                  <li key={u.id} style={{ flexGrow: u.living_surface ?? 50 }} data-unit="" data-type={typeCode(u)} data-st={u.status} data-dim={dim(u) ? '' : undefined}>
                    <a className="sp-u" href={unitUrl(d, u)} aria-current={current === u.id ? 'page' : undefined} aria-label={x.unit_number ? `Lot ${x.unit_number} : ${desc}` : desc}>
                      {/* fixture only: unit_number */}
                      {x.unit_number && <span className="sp-n num">{x.unit_number}</span>}
                      <span className="sp-ty">{typeCode(u)}</span>
                      {!compact && m2 && <span className="sp-m2 num">{m2}</span>}
                      <span className="sp-pr num">{u.status === 'available' ? unitPrice(u) : statusLabel(u)}</span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
      <div className="sp-ground" aria-hidden="true"></div>
    </div>
  );
}
