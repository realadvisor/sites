/**
 * Unit mix: one column per type (T1..T5) with its indicative plan, surfaces,
 * what is left and the lowest public price. Links to the filtered Logements page.
 */
import type { DevelopmentWithUnits } from '@realadvisor/sites-sdk/types';
import { formatAmount, plural, programmeUrl, typeMix } from '../lib/fr';
import './TypeStrip.css';

export const TYPE_NAMES: Record<number, string> = { 1: 'Studio', 2: 'Deux pièces', 3: 'Trois pièces', 4: 'Quatre pièces', 5: 'Cinq pièces' };

export function TypeStrip({ programme: d }: { programme: DevelopmentWithUnits }) {
  const mix = typeMix(d);
  if (!mix.length) return null;
  return (
    <ul className="tstrip">
      {mix.map((t) => (
        <li key={t.code} className="reveal">
          <a href={`${programmeUrl(d, 'logements')}?type=${t.code}`} aria-label={`${t.code}, ${TYPE_NAMES[t.rooms] ?? ''} : voir les logements`}>
            <span className="ts-code">{t.code}</span>
            <span className="ts-name">{TYPE_NAMES[t.rooms] ?? `${t.rooms} pièces`}</span>
            {t.rooms <= 5 && <img src={`/plans/t${Math.min(5, t.rooms)}.svg`} alt="" width="400" height="340" loading="lazy" decoding="async" className="ts-thumb" />}
            <span className="ts-m num">{t.minSurface === t.maxSurface ? `${t.minSurface} m²` : `${t.minSurface} à ${t.maxSurface} m²`}</span>
            <span className="ts-av">{t.available ? plural(t.available, 'disponible', 'disponibles') : 'Plus de disponibilité'}</span>
            {t.minPrice && <span className="ts-pr num">dès {formatAmount(t.minPrice)}</span>}
            <span className="ts-arrow" aria-hidden="true">→</span>
          </a>
        </li>
      ))}
    </ul>
  );
}
