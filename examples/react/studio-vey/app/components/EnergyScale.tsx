/** Energy class on the A–G scale (GEAK), the listing's class marked. Only with data; never invented. */
import type { CSSProperties } from 'react';
import './EnergyScale.css';

const CLASSES = ['A', 'B', 'C', 'D', 'E', 'F', 'G'] as const;

export function EnergyScale({ value, label = 'GEAK Gesamtenergieeffizienz' }: { value: string; label?: string }) {
  const v = value.trim().toUpperCase();
  if (!CLASSES.includes(v as (typeof CLASSES)[number])) return null;
  return (
    <figure className="en">
      <figcaption className="caps muted">{label}</figcaption>
      <ol className="en-scale" aria-label={`Energieklasse ${v} auf der Skala A bis G`}>
        {CLASSES.map((c, i) => (
          <li key={c} className={c === v ? 'en-step is-on' : 'en-step'} style={{ '--i': i } as CSSProperties} aria-current={c === v ? 'true' : undefined}>
            <span>{c}</span>
          </li>
        ))}
      </ol>
    </figure>
  );
}
