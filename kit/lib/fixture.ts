/**
 * A site's own fixture (src/data/fixture.json of the example sites): the
 * SDK's Fixture (createFixtureClient answers from it with the API's filters)
 * plus the site's languages and portals, and `fixture_only`, the fields the
 * API does not have yet.
 */
import type { Fixture as SdkFixture, Portals } from '@realadvisor/sites-sdk/types';

export { createFixtureClient } from '@realadvisor/sites-sdk';

export type Fixture = SdkFixture & {
  languages: string[];
  portals: Portals;
  /** Fields the API does not have yet, keyed by listing, unit or development id. Never present them as API data. */
  fixture_only: {
    listings: Record<string, Record<string, unknown>>;
    units: Record<string, Record<string, unknown>>;
    developments: Record<string, Record<string, unknown>>;
  };
};

/** Fixture-only extras of one record: always label them as such in code. */
export const fixtureOnly = (fx: Fixture, kind: keyof Fixture['fixture_only'], id: string) => fx.fixture_only[kind][id] ?? {};
