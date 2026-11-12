/**
 * DPE scale (A to G) with the listing's class marked. Shows only what the
 * data has: no class, "DPE en cours". The consumption value and the GES
 * class are not in the data: the line under the scale says so.
 */
import type { CSSProperties } from 'react';
import './EnergyScale.css';

const STEPS = [
  ['A', '#137a3b', '#fff'], ['B', '#4ea443', '#1c1917'], ['C', '#a2c240', '#1c1917'], ['D', '#f1df3b', '#1c1917'],
  ['E', '#f3b23b', '#1c1917'], ['F', '#ec7a32', '#1c1917'], ['G', '#c9302a', '#fff'],
] as const;

export function EnergyScale({ grade: raw }: { grade?: string }) {
  const g = raw?.toUpperCase();
  const grade = g && /^[A-G]$/.test(g) ? g : undefined;
  return (
    <figure className="dpe">
      <figcaption className="dpe__cap">
        Diagnostic de performance énergétique (DPE){grade ? <> : <strong>classe {grade}</strong></> : <> : <strong>en cours</strong></>}
      </figcaption>
      <ol className="dpe__scale" aria-label="Échelle DPE de A à G">
        {STEPS.map(([k, c, ink], i) => (
          <li key={k} className={k === grade ? 'dpe__step is-on' : 'dpe__step'} style={{ '--c': c, '--ink': ink, '--w': `${42 + i * 9}%` } as CSSProperties} aria-current={k === grade ? 'true' : undefined}>
            <span className="dpe__bar">{k}</span>
            {k === grade && <span className="dpe__mark">Ce bien</span>}
          </li>
        ))}
      </ol>
      <p className="dpe__note">Consommation, émissions (GES) et estimation des coûts annuels : sur le diagnostic complet, à demander à l'agent.</p>
    </figure>
  );
}
