/**
 * One programme as a full-bleed cinematic panel (home): photo, status tag,
 * title, the first paragraph and three facts computed from the data.
 */
import type { Development } from '@realadvisor/sites-sdk/types';
import { contentFor } from '../content/programmes';
import { deliveryShort, plural, priceFrom, programmeStatus, programmeUrl, typeRange } from '../lib/fr';
import { Photo } from './Photo';
import './ProgrammePanel.css';

export function ProgrammePanel({ programme: d, index }: { programme: Development; index: number }) {
  const c = contentFor(d.slug);
  const photo = d.photos[c.hero ?? 0] ?? d.photos[0];
  const intro = d.description_text?.split(/\n\s*\n/)[0];
  const status = programmeStatus(d);
  const facts = [
    { label: 'Typologies', value: typeRange(d.stats.rooms) },
    { label: d.status === 'delivered' ? 'Livraison' : 'Livraison prévue', value: deliveryShort(d) },
    { label: d.stats.available ? 'Disponibles' : 'Logements', value: d.stats.available ? `${d.stats.available} / ${d.stats.units}` : String(d.stats.units) },
  ].filter((f) => f.value);
  const from = d.stats.available ? priceFrom(d) : '';
  return (
    <article className={`panel ${index % 2 ? 'panel--right' : 'panel--left'}`} aria-labelledby={`p-${d.slug}`}>
      <div className="pp-media parallax">
        {photo && <Photo src={photo} alt={photo.alt || d.title} width={1600} height={1000} mobile={{ width: 800, height: 800 }} sizes="100vw" />}
      </div>
      <div className="pp-scrim" aria-hidden="true"></div>
      <div className="pp-body wrap">
        <div className="pp-card reveal">
          <div className="pp-meta">
            {status && <span className="tag" data-status={d.status}>{status}</span>}
            <span className="pp-city">{d.address.city}</span>
          </div>
          <h3 id={`p-${d.slug}`} className="pp-title">
            <a href={programmeUrl(d)}>{d.title}</a>
          </h3>
          {intro && <p className="pp-intro">{intro}</p>}
          <dl className="pp-facts">
            {facts.map((f) => <div key={f.label}><dt>{f.label}</dt><dd className="num">{f.value}</dd></div>)}
          </dl>
          <div className="pp-actions">
            <a className="button button--solid" href={programmeUrl(d)} aria-label={`Découvrir ${d.title}`}>Découvrir</a>
            {d.stats.units > 0 && <a className="link" href={programmeUrl(d, 'logements')}>{d.stats.available ? plural(d.stats.available, 'logement disponible', 'logements disponibles') : 'Voir les logements'}</a>}
          </div>
          {from && <p className="pp-from num">{from}</p>}
        </div>
      </div>
    </article>
  );
}
