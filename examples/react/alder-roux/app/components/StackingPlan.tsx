/**
 * Stacking plan and unit table of one development, server-rendered, zero
 * JavaScript. One row per floor (top floor first), one block per unit whose
 * width follows its living area; fill and label both say the status, only
 * available units show a price. "Only available" is a checkbox that dims
 * the others in CSS (:has). The table below is the accessible and phone
 * view of the same units.
 */
import type { DevelopmentWithUnits, Unit } from '@realadvisor/sites-sdk/types';
import { tx } from '../lib/copy';
import { floor, floorShort, formatSurface, orientation, price, rooms } from '../lib/format';
import type { L } from '../lib/routes';
import type { Extras } from '../lib/extras';
import { outdoor, sortUnits, statusLabel, typeOf, unitHref, unitTitle, unitTypes } from '../lib/dev';
import './StackingPlan.css';

export function StackingPlan({ dev, l, ex }: { dev: DevelopmentWithUnits; l: L; ex: Extras }) {
  const t = tx(l);
  const units = sortUnits(dev.units, ex);
  const types = unitTypes(dev.units, ex);
  const floors = [...new Set(units.map((u) => u.floor ?? 0))].sort((a, b) => b - a);
  const unitPrice = (u: Unit) => (u.status === 'available' ? price({ ...u, status: 'available' }, l) : statusLabel(u.status, l));
  return (
    <div className="sp">
      <div className="sp__head">
        <p className="sp__count num"><b>{dev.stats.available}</b> {t('unitsAvailable', { n: '', t: dev.stats.units }).trim()}</p>
        <ul className="sp__legend" aria-hidden="true">
          <li className="lg lg--available">{t('available')}</li>
          <li className="lg lg--reserved">{t('reserved')}</li>
          <li className="lg lg--sold">{t('sold')}</li>
        </ul>
        <label className="sp__only"><input type="checkbox" className="sp__toggle" /> {t('onlyAvailable')}</label>
      </div>

      <div className="sp__plan" aria-hidden="true">
        <div className="sp__roof"></div>
        {floors.map((f) => {
          const row = units.filter((u) => (u.floor ?? 0) === f);
          return (
            <div key={f} className="sp__floor">
              <span className="sp__fl">{floorShort(f, l)}</span>
              <div className="sp__row">
                {row.map((u) => (
                  <a key={u.id} className={`u u--${u.status}`} href={unitHref(dev, u, l)} tabIndex={-1} style={{ flexGrow: u.living_surface ?? 100 }}>
                    <b>{u.reference ?? typeOf(types, u)?.letter}</b>
                    <span className="u__r">{rooms(u.rooms, l)} · {formatSurface(u.living_surface)}</span>
                    <span className="u__p num">{unitPrice(u)}</span>
                  </a>
                ))}
              </div>
            </div>
          );
        })}
        <div className="sp__ground"></div>
      </div>

      <div className="sp__table">
        <table>
          <caption className="sr-only">{t('table')}</caption>
          <thead>
            <tr>
              <th scope="col">{t('unit')}</th>
              <th scope="col">{t('floorRow')}</th>
              <th scope="col">{t('rooms')}</th>
              <th scope="col" className="r">{t('livingArea')}</th>
              <th scope="col" className="r">{t('outdoor')}</th>
              <th scope="col">{t('orientation')}</th>
              <th scope="col" className="r">{t('price')}</th>
              <th scope="col"><span className="sr-only">{t('status')}</span></th>
            </tr>
          </thead>
          <tbody>
            {units.map((u) => {
              const out = outdoor(u);
              const ori = orientation(u.orientation, l);
              const ty = typeOf(types, u);
              return (
                <tr key={u.id} className={`st-${u.status}`}>
                  <th scope="row"><a href={unitHref(dev, u, l)}>{unitTitle(u, l)}</a><span className="t-type">{ty && t('typeName', { k: ty.letter })}</span></th>
                  <td data-l={t('floorRow')}>{floor(u.floor, l)}</td>
                  <td data-l={t('rooms')}>{rooms(u.rooms, l)}</td>
                  <td className="r num" data-l={t('livingArea')}>{formatSurface(u.living_surface)}</td>
                  <td className="r num" data-l={t('outdoor')}>{out ? formatSurface(out) : '–'}</td>
                  <td data-l={t('orientation')}>{ori || '–'}</td>
                  <td className="r num t-price">{u.status === 'available' ? unitPrice(u) : '–'}</td>
                  <td className="t-st"><span className={`pill pill--${u.status}`}>{statusLabel(u.status, l)}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
