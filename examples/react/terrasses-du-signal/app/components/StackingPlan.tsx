/**
 * The building as a stacking plan: one row per floor (top floor first), one
 * block per unit, its width by living area, fill and label by status. Every
 * block is a link to the unit page, so it works without JavaScript.
 * Filters (rooms, only available) dim blocks via data attributes; the units
 * page script (app/client.ts) updates them in place, the server renders them from the URL.
 */
import type { CSSProperties } from 'react';
import type { Unit } from '@realadvisor/sites-sdk/types';
import { floorName, formatSurface, sortUnits, statusLabel, unitExtra, unitPath, unitPrice, type Extras } from '../lib/units';
import './StackingPlan.css';

type Props = {
  units: Unit[];
  extras: Extras;
  /** Highlight one unit (unit page). */
  current?: string;
  /** Server-side filter state (?pieces=, ?dispo=1). */
  rooms?: number | null;
  onlyAvailable?: boolean;
  compact?: boolean;
  label?: string;
};

export function StackingPlan({ units, extras, current, rooms = null, onlyAvailable = false, compact = false, label = 'Plan de l’immeuble par étage' }: Props) {
  const floors = [...new Set(units.map((u) => u.floor ?? 0))].sort((a, b) => b - a);
  const rows = floors.map((f) => {
    const us = sortUnits(units.filter((u) => (u.floor ?? 0) === f), extras);
    return { floor: f, name: floorName(us[0]!), units: us, area: us.reduce((s, u) => s + (u.living_surface ?? 60), 0) };
  });
  const maxArea = Math.max(...rows.map((r) => r.area));
  const matches = (u: Unit) => (rooms == null || u.rooms === rooms) && (!onlyAvailable || u.status === 'available');
  const short = (f: number, name: string) => (f === 0 ? 'Rez' : name.replace(' étage', ''));
  return (
    <figure className={['stack', compact && 'compact'].filter(Boolean).join(' ')} aria-label={label}>
      <div className="roof" aria-hidden="true"></div>
      <ol className="floors">
        {rows.map((r) => (
          <li className="floor" key={r.floor}>
            <span className="fl"><span className="fl-long">{r.name}</span><span className="fl-short" aria-hidden="true">{short(r.floor, r.name)}</span></span>
            <div className="row" style={{ '--w': `${((r.area / maxArea) * 100).toFixed(2)}%` } as CSSProperties}>
              {r.units.map((u) => {
                const no = unitExtra(extras, u).unit_number; // fixture only: unit number
                const isCurrent = current === u.id;
                return (
                  <a
                    key={u.id}
                    href={unitPath(u)}
                    className={['u', u.status, !matches(u) && 'dim'].filter(Boolean).join(' ')}
                    style={{ flexGrow: u.living_surface ?? 60 }}
                    data-unit=""
                    data-rooms={u.rooms ?? undefined}
                    data-status={u.status}
                    aria-current={isCurrent ? 'true' : undefined}
                  >
                    <span className="top">
                      {no && <span className="no"><span className="sr-only">Lot </span>{no}</span>}
                      <span className="r">{u.rooms != null ? <>{u.rooms}<span aria-hidden="true"> p.</span><span className="sr-only"> pièces, {floorName(u)}</span></> : ''}</span>
                    </span>
                    {!compact && <span className="m2 num">{formatSurface(u.living_surface)}</span>}
                    {!compact && <span className={['st', u.status === 'available' && 'price'].filter(Boolean).join(' ')}>{u.status === 'available' ? unitPrice(u) : statusLabel(u)}</span>}
                    {(compact || u.status === 'available') && <span className="sr-only">, {statusLabel(u)}{isCurrent ? ' (ce lot)' : ''}</span>}
                  </a>
                );
              })}
            </div>
          </li>
        ))}
      </ol>
      <div className="ground" aria-hidden="true"></div>
    </figure>
  );
}
