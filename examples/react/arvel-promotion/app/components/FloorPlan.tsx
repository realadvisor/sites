/**
 * Indicative plan of one unit, drawn inline from app/lib/plans.ts (room areas
 * scaled to the unit, north arrow turned to its orientation, balcony or
 * terrace with its area), with the rooms as a list (readable on a phone and
 * for screen readers). Labelled "plan indicatif".
 */
import type { Unit } from '@realadvisor/sites-sdk/types';
import { planFor, planTree, roomAreas } from '../lib/plans';
import { orientationBearing, typeCode } from '../lib/fr';
import { SvgNode } from './SvgNode';
import './FloorPlan.css';

type Props = { unit: Unit; orientation?: string; terrace?: number };
const fmt = (n: number) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 }).format(n);

export function FloorPlan({ unit: u, orientation, terrace }: Props) {
  const plan = planFor(u.rooms);
  const outdoor = terrace ? { label: 'Terrasse', surface: terrace } : u.balcony_surface ? { label: 'Balcon', surface: u.balcony_surface } : undefined;
  const tree = plan
    ? planTree(plan, {
        surface: u.living_surface,
        outdoor,
        facadeBearing: orientationBearing(orientation),
        title: `Plan indicatif du ${typeCode(u)}${u.living_surface ? `, ${u.living_surface} m²` : ''}`,
      })
    : null;
  const rooms = plan ? roomAreas(plan, u.living_surface) : [];
  return (
    <>
      {tree && <SvgNode node={tree} />}
      {rooms.length > 0 && (
        <ul className="fp-rooms" aria-label="Pièces et surfaces indicatives">
          {rooms.map((r, i) => <li key={i}><span>{r.name}</span><span className="num">{fmt(r.area)} m²</span></li>)}
          {outdoor && <li><span>{outdoor.label}</span><span className="num">{fmt(outdoor.surface)} m²</span></li>}
        </ul>
      )}
    </>
  );
}
