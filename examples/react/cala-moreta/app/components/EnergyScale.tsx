/**
 * Spanish energy certificate: the A–G scale with the listing's class marked.
 * The class is the listing's `energy_class`.
 */
import { UI, type Lang } from '../lib/i18n';
import './EnergyScale.css';

const CLASSES = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];

export function EnergyScale({ value, lang }: { value: string; lang: Lang }) {
  return (
    <figure className="energy">
      <figcaption><span className="energy-t">{UI[lang].energy}</span><span className="energy-note">{UI[lang].energyNote}</span></figcaption>
      <ol className="energy-scale">
        {CLASSES.map((c, i) => (
          <li key={c} className={[`e${i}`, c === value && 'on'].filter(Boolean).join(' ')} aria-current={c === value ? 'true' : undefined}>
            <span>{c}</span>
          </li>
        ))}
      </ol>
    </figure>
  );
}
