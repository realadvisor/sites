/** Unit types as columns (name, plan, sizes, rent from, availability), each linking to the filtered units. */
import type { TypeInfo } from '../lib/units';
import { chf, surface } from '../lib/units';
import { Icon } from './Icon';
import './TypeStrip.css';

export function TypeStrip({ list }: { list: TypeInfo[] }) {
  return (
    <ul className="types">
      {list.map((t) => (
        <li key={t.rooms}>
          <a href={`/wohnungen?zimmer=${t.rooms}`} className="type">
            <span className="t-name"><span className="n num">{String(t.rooms)}</span> Zimmer</span>
            {t.plan && <img className="plan" src={t.plan} width="600" height="470" loading="lazy" decoding="async" alt={`Grundriss indikativ, ${String(t.rooms)} Zimmer`} />}
            <dl>
              {t.surface && <div><dt>Wohnfläche</dt><dd className="num">{surface(t.surface)}</dd></div>}
              <div><dt>Miete netto</dt><dd className="num">{t.from ? `ab ${chf(t.from)}` : 'zurzeit vergeben'}</dd></div>
            </dl>
            <span className="avail"><span className="num">{t.available}</span> von {t.total} frei <Icon name="arrow" /></span>
          </a>
        </li>
      ))}
    </ul>
  );
}
