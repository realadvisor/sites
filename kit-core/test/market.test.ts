// marketListings / sortByPrice / byCurrency (lib/market.ts).
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { byCurrency, marketListings, sortByPrice } from '../lib/market.ts';

const L = (id: string, currency: string, price?: number, country?: string, price_on_request = false) => ({ id, currency, price, price_on_request, address: country ? { country } : {} });
const ids = (ls: { id: string }[]) => ls.map((l) => l.id);
const pool = [L('ch1', 'CHF', 900_000, 'CH'), L('fr1', 'EUR', 2_000_000, 'FR'), L('ch2', 'CHF', 1_500_000), L('chE', 'EUR', 700_000, 'CH'), L('ch3', 'CHF', undefined, 'CH', true), L('frC', 'CHF', 400_000, 'FR')];

describe('marketListings', () => {
  it('keeps the agency’s currency and countries', () => {
    assert.deepEqual(ids(marketListings(pool, { currency: 'CHF', countries: ['CH'] })), ['ch1', 'ch2', 'ch3']);
    assert.deepEqual(ids(marketListings(pool, { countries: ['CH'] })), ['ch1', 'ch2', 'ch3'], 'CHF by default for CH');
    assert.deepEqual(ids(marketListings(pool, { countries: ['fr'] })), ['fr1'], 'EUR by default, codes in any case');
    assert.deepEqual(ids(marketListings(pool, { currency: 'CHF', countries: ['CH'], unknownCountry: 'drop' })), ['ch1', 'ch3']);
  });
  it('sorts by price inside the market, prices on request last', () => {
    assert.deepEqual(ids(marketListings(pool, { countries: ['CH'], sort: 'price-desc' })), ['ch2', 'ch1', 'ch3']);
    assert.deepEqual(ids(marketListings(pool, { countries: ['CH'], sort: 'price-asc' })), ['ch1', 'ch2', 'ch3']);
  });
});

describe('sortByPrice', () => {
  it('never compares currencies: each sorted on its own, in order of first appearance', () => {
    assert.deepEqual(ids(sortByPrice(pool, 'price-desc')), ['ch2', 'ch1', 'frC', 'ch3', 'fr1', 'chE']);
  });
  it('returns a copy', () => {
    const a = [L('a', 'CHF', 2), L('b', 'CHF', 1)];
    sortByPrice(a);
    assert.deepEqual(ids(a), ['a', 'b']);
  });
});

describe('byCurrency', () => {
  it('groups by currency, the agency’s own first', () => {
    assert.deepEqual(byCurrency(pool, 'EUR').map((g) => [g.currency, ids(g.listings)]), [['EUR', ['fr1', 'chE']], ['CHF', ['ch1', 'ch2', 'ch3', 'frC']]]);
  });
});
