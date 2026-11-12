/**
 * Fields the API does not carry yet (fixture only): building and position on
 * the floor per unit; buildings and construction photos of the development.
 * Static data from the fixture's `fixture_only` block, read through these
 * two functions only and never merged into SDK objects.
 * Not a .server module: the unit helpers that read it render on the server,
 * but route modules are also compiled for the browser build.
 */
import { fixture_only } from '../../../../astro/archi-del-bre/src/data/fixture.json';
import type { DevelopmentWithUnits, Unit } from '@realadvisor/sites-sdk/types';

export type UnitExtra = {
  building?: string;
  position?: number;
};

export type DevelopmentExtra = {
  buildings?: string[];
  construction_photos?: string[];
};

const FX = fixture_only as unknown as { units: Record<string, UnitExtra>; developments: Record<string, DevelopmentExtra> };

/** fixture only: building, position on the floor. */
export const unitExtra = (u: Pick<Unit, 'id'>): UnitExtra => FX.units[u.id] ?? {};

/** fixture only: buildings, construction photos. */
export const developmentExtra = (d: Pick<DevelopmentWithUnits, 'id'>): DevelopmentExtra => FX.developments[d.id] ?? {};
