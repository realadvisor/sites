/**
 * Availability table: the accessible companion of the stacking plan, and
 * the phone layout (one card per unit). Rows hidden by the filters get
 * `hidden`. Lot number and orientation are fixture only.
 */
import type { DevelopmentWithUnits } from '@realadvisor/sites-sdk/types';
import { extraOf, unitsInOrder, type UnitExtras } from '../lib/units';
import { floorName, formatSurface, orientationLabel, statusLabel, typeCode, typeName, unitPrice, unitUrl, programmeUrl } from '../lib/fr';
import './UnitTable.css';

type Props = { programme: Pick<DevelopmentWithUnits, 'slug' | 'title' | 'units'>; extras: UnitExtras; type?: string; onlyAvailable?: boolean; enquiryPath?: string };

export function UnitTable({ programme: d, extras, type, onlyAvailable, enquiryPath }: Props) {
  const units = [...unitsInOrder(d, extras)].sort((a, b) => (b.floor ?? 0) - (a.floor ?? 0) || 0);
  const hide = (u: (typeof units)[number]) => (!!type && typeCode(u) !== type) || (!!onlyAvailable && u.status !== 'available');
  const ask = (id: string) => `${enquiryPath ?? programmeUrl(d)}?lot=${encodeURIComponent(id)}#contact`;
  return (
    <div className="ut-box">
      <table className="units">
        <caption className="sr-only">Logements de {d.title}</caption>
        <thead>
          <tr>
            <th scope="col">Lot</th>
            <th scope="col">Type</th>
            <th scope="col">Étage</th>
            <th scope="col" className="ut-r">Surface</th>
            <th scope="col" className="ut-r">Extérieur</th>
            <th scope="col">Orientation</th>
            <th scope="col" className="ut-r">Prix</th>
            <th scope="col">Statut</th>
            <th scope="col"><span className="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody>
          {units.map((u) => {
            const x = extraOf(extras, u);
            // fixture only: terrace_surface for ground floor units
            const outdoor = x.terrace_surface ?? u.balcony_surface;
            return (
              <tr key={u.id} data-unit="" data-type={typeCode(u)} data-st={u.status} hidden={hide(u) || undefined}>
                {/* fixture only: unit_number */}
                <td className="c-lot num" data-l="Lot">{x.unit_number ?? '—'}</td>
                <th scope="row" className="c-type"><a href={unitUrl(d, u)}><span className="ut-code">{typeCode(u)}</span> <span className="ut-tname">{typeName(u)}</span></a></th>
                <td className="c-floor">{floorName(u)}</td>
                <td className="ut-r num c-m2">{u.living_surface ? formatSurface(u.living_surface) : ''}</td>
                <td className="ut-r num c-out">{outdoor ? <>{formatSurface(outdoor)}<span className="ut-out-l"> {x.terrace_surface ? 'terrasse' : 'balcon'}</span></> : ''}</td>
                {/* fixture only: orientation */}
                <td className="c-or">{orientationLabel(x.orientation)}</td>
                <td className="ut-r num c-price">{u.status === 'available' ? unitPrice(u) : ''}</td>
                <td className="c-st"><span className="pill" data-st={u.status}>{statusLabel(u)}</span></td>
                <td className="c-sum" aria-hidden="true">{[floorName(u), u.living_surface && formatSurface(u.living_surface), outdoor && `${x.terrace_surface ? 'terrasse' : 'balcon'} ${formatSurface(outdoor)}`, orientationLabel(x.orientation)].filter(Boolean).join(' · ')}</td>
                <td className="c-act">
                  <a className="ut-act" href={unitUrl(d, u)}>Plan<span className="sr-only"> du {typeCode(u)}, {floorName(u)}</span></a>
                  {/* the space between the two links, as in the Astro markup */}
                  {u.status !== 'sold' && ' '}
                  {u.status !== 'sold' && <a className="ut-act ut-act--ask" href={ask(u.id)}>Se renseigner<span className="sr-only"> sur le {typeCode(u)}, {floorName(u)}</span></a>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
