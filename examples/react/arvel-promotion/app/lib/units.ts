/**
 * Fixture-only extras of units and developments (types and ordering). The
 * loaders read them (lib/data.server.ts) and pass them next to the SDK
 * records, keyed by id, so components never import server code.
 */
import type { DevelopmentWithUnits, Unit } from '@realadvisor/sites-sdk/types';

export type UnitExtra = {
  unit_number?: string;
  /** 1-based position on the floor, left to right on the stacking plan. */
  position?: number;
  /** Main facade: N, NE, E, SE, S, SW, W, NW. */
  orientation?: string;
  terrace_surface?: number;
};
export type UnitExtras = Record<string, UnitExtra>;
export type DevelopmentExtra = {
  developer?: string;
  architect?: string;
  general_contractor?: string;
  construction_photos?: string[];
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
