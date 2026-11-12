/**
 * Fixture-only extras of units and developments (types and ordering). The
 * loaders read them (lib/data.server.ts) and pass them next to the SDK
 * records, keyed by id, so components never import server code.
 */
import type { DevelopmentWithUnits, Unit } from '@realadvisor/sites-sdk/types';

export type UnitExtra = {
  /** 1-based position on the floor, left to right on the stacking plan. */
  position?: number;
};
export type UnitExtras = Record<string, UnitExtra>;
export type DevelopmentExtra = {
  construction_photos?: string[];
};

/** The unit's main facade as a code (N, NE, E, SE, S, SW, W, NW), from its `orientation`. */
export const orientationCode = (u: Pick<Unit, 'orientation'>): string | undefined => {
  const o = u.orientation ?? [];
  const code = (o.includes('north') ? 'N' : o.includes('south') ? 'S' : '') + (o.includes('east') ? 'E' : o.includes('west') ? 'W' : '');
  return code || undefined;
};

export const extraOf = (extras: UnitExtras, u: Pick<Unit, 'id'>): UnitExtra => extras[u.id] ?? {};

/** Units in stacking-plan order: floor, then position on the floor (fixture only), then surface. */
export const unitsInOrder = (d: Pick<DevelopmentWithUnits, 'units'>, extras: UnitExtras) =>
  [...d.units].sort(
    (a, b) =>
      (a.floor ?? 0) - (b.floor ?? 0) ||
      (extraOf(extras, a).position ?? 99) - (extraOf(extras, b).position ?? 99) ||
      (a.living_surface ?? 0) - (b.living_surface ?? 0),
  );
