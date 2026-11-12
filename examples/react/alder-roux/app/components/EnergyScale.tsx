/**
 * Energy label scale A to G with the listing's class marked. Shown only
 * when the data has a class; never invented.
 */
import type { CSSProperties } from 'react';
import './EnergyScale.css';

const CLASSES = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
const COLORS = ['#1a7a46', '#4f9a3c', '#a5bf33', '#e8d22c', '#eaa52a', '#de6b26', '#c9302a'];

export function EnergyScale({ value, label, classLabel }: { value: string; label: string; classLabel: string }) {
  const v = value.trim().toUpperCase();
  if (!CLASSES.includes(v)) return null;
  return (
    <figure className="es">
      <figcaption className="sr-only">{label}</figcaption>
      <ol aria-label={`${label}: ${classLabel}`}>
        {CLASSES.map((c, i) => (
          <li key={c} className={c === v ? 'on' : undefined} style={{ '--c': COLORS[i], '--w': `${44 + i * 8}%`, '--on': i === 0 || i === 6 ? '#fff' : '#1b2430' } as CSSProperties} aria-current={c === v ? 'true' : undefined}>
            <span>{c}</span>{c === v && <b>{classLabel}</b>}
          </li>
        ))}
      </ol>
    </figure>
  );
}
