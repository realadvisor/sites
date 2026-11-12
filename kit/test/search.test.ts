// Unit tests for src/lib/search.ts: `pnpm test` (node --test, strip-types).
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { Listing } from '../lib/ra.ts';
import { mapView, matches, pageList, parseSearch, priceSteps, runSearch, searchHref, sortListings, type SearchParams } from '../lib/search.ts';

type Fx = Partial<Omit<Listing, 'address'>> & { city?: string; lat?: number; lng?: number };
let n = 0;
const L = ({ city, lat, lng, ...o }: Fx = {}): Listing =>
  ({
    id: `l${++n}`,
    slug: `l-${n}`,
    title: `Listing ${n}`,
    offer_type: 'buy',
    property_type: 'apartment',
    status: 'available',
    currency: 'CHF',
    photos: [],
    address: { city, lat, lng },
    ...o,
  }) as Listing;
const P = (s = '') => parseSearch(new URLSearchParams(s));
const ids = (ls: Listing[]) => ls.map((l) => l.id);

describe('parseSearch', () => {
  it('bbox: map view only, valid s<n and w<e, normalised to 5 decimals', () => {
    assert.equal(P('view=map&bbox=46.1234567,6.1,46.9,7.2').bbox, '46.12346,6.1,46.9,7.2');
    assert.equal(P('bbox=46,6,47,7').bbox, undefined, 'list view ignores it');
    for (const b of ['47,6,46,7', '46,7,47,6', '46,6,47', 'a,b,c,d', '-95,6,47,7', '46,6,47,190', ',,,']) assert.equal(P(`view=map&bbox=${b}`).bbox, undefined, b);
  });
  it('drops absurd prices and rooms (they would land in the h1)', () => {
    const p = parseSearch(new URLSearchParams('minPrice=999999999999&maxPrice=2000000000&minRooms=99'));
    assert.equal(p.minPrice, undefined);
    assert.equal(p.maxPrice, undefined);
    assert.equal(p.minRooms, undefined);
    assert.equal(parseSearch(new URLSearchParams('maxPrice=900000000')).maxPrice, 9e8);
  });
  it('defaults', () => {
    assert.deepEqual(P(), {
      offerType: undefined, propertyType: undefined, city: undefined, minPrice: undefined, maxPrice: undefined,
      minRooms: undefined, status: 'available', sort: 'newest', view: 'list', page: 1, map: undefined, bbox: undefined,
    });
  });
  it('drops junk numbers (negative, zero, NaN, Infinity, empty)', () => {
    for (const v of ['-5', '0', 'abc', 'NaN', 'Infinity', '', '  ']) {
      const p = P(`minPrice=${v}&maxPrice=${v}&minRooms=${v}`);
      assert.equal(p.minPrice, undefined, v);
      assert.equal(p.maxPrice, undefined, v);
      assert.equal(p.minRooms, undefined, v);
    }
    assert.equal(P('minRooms=3.5').minRooms, 3.5);
  });
  it('swaps min/max price when reversed', () => {
    const p = P('minPrice=900000&maxPrice=300000');
    assert.equal(p.minPrice, 300000);
    assert.equal(p.maxPrice, 900000);
    assert.deepEqual([P('minPrice=5').minPrice, P('maxPrice=5').maxPrice], [5, 5]);
  });
  it('offerType, status and view accept only known values', () => {
    assert.equal(P('offerType=rent').offerType, 'rent');
    assert.equal(P('offerType=sell').offerType, undefined);
    assert.equal(P('status=sold').status, 'sold');
    assert.equal(P('status=whatever').status, 'available');
    assert.equal(P('view=map').view, 'map');
    assert.equal(P('view=grid').view, 'list');
  });
  it('sort: known values, Rockwell asc/desc, unknown → newest', () => {
    assert.equal(P('sort=surface-desc').sort, 'surface-desc');
    assert.equal(P('sort=price-asc').sort, 'price-asc');
    assert.equal(P('sort=asc').sort, 'price-asc');
    assert.equal(P('sort=desc').sort, 'price-desc');
    assert.equal(P('sort=cheapest').sort, 'newest');
    assert.equal(P('sort=').sort, 'newest');
  });
  it('map: only zoom/lat/lng', () => {
    assert.equal(P('map=12/46.2/6.15').map, '12/46.2/6.15');
    assert.equal(P('map=12/-33.9/-151.2').map, '12/-33.9/-151.2');
    for (const bad of ['abc', '12/46.2', '123/1/1', '12/46/6/1', '12/46/6;x', '12//6']) assert.equal(P(`map=${encodeURIComponent(bad)}`).map, undefined, bad);
  });
  it('page: floored, at least 1', () => {
    assert.equal(P('page=2.7').page, 2);
    assert.equal(P('page=0').page, 1);
    assert.equal(P('page=-3').page, 1);
    assert.equal(P('page=abc').page, 1);
    assert.equal(P('page=0.5').page, 1);
  });
  it('propertyType: lowercase codes only, trimmed', () => {
    assert.equal(P('propertyType=house_villa').propertyType, 'house_villa');
    assert.equal(P('propertyType=%20house%20').propertyType, 'house');
    for (const bad of ['House', 'a b', '../x', 'house-villa', '<script>', 'x'.repeat(65)]) assert.equal(P(`propertyType=${encodeURIComponent(bad)}`).propertyType, undefined, bad);
  });
  it('city: trimmed, capped at 80, blank dropped', () => {
    assert.equal(P('city=%20Gen%C3%A8ve%20').city, 'Genève');
    assert.equal(P('city=%20%20').city, undefined);
    assert.equal(P(`city=${'a'.repeat(100)}`).city?.length, 80);
  });
});

describe('matches', () => {
  const p = (s: string) => P(s);
  it('propertyType is a prefix on the group, not a substring', () => {
    assert.ok(matches(L({ property_type: 'house_villa' }), p('propertyType=house')));
    assert.ok(matches(L({ property_type: 'house' }), p('propertyType=house')));
    assert.ok(!matches(L({ property_type: 'houseboat' }), p('propertyType=house')));
    assert.ok(!matches(L({ property_type: 'house' }), p('propertyType=house_villa')));
  });
  it('city is accent-, case- and space-insensitive', () => {
    assert.ok(matches(L({ city: 'Genève' }), p('city=geneve')));
    assert.ok(matches(L({ city: ' GENEVE ' }), p('city=Genève')));
    assert.ok(!matches(L({ city: 'Lausanne' }), p('city=geneve')));
    assert.ok(!matches(L({}), p('city=geneve')));
  });
  it('price filters exclude price on request and missing prices', () => {
    assert.ok(matches(L({ price: 500 }), p('minPrice=500&maxPrice=500')));
    assert.ok(!matches(L({ price: 500, price_on_request: true }), p('minPrice=100')));
    assert.ok(!matches(L({ price: 500, price_on_request: true }), p('maxPrice=1000')));
    assert.ok(!matches(L({}), p('maxPrice=1000')));
    assert.ok(matches(L({ price_on_request: true }), p('')));
  });
  it('status must match; rooms; offer', () => {
    assert.ok(!matches(L({ status: 'sold' }), p('')));
    assert.ok(matches(L({ status: 'sold' }), p('status=sold')));
    assert.ok(!matches(L({ rooms: 2 }), p('minRooms=3')));
    assert.ok(!matches(L({}), p('minRooms=1')));
    assert.ok(!matches(L({ offer_type: 'rent' }), p('offerType=buy')));
  });
  it('skip ignores one filter only', () => {
    const q = p('city=Lausanne&minRooms=3');
    const l = L({ city: 'Genève', rooms: 4 });
    assert.ok(matches(l, q, 'city'));
    assert.ok(!matches(l, q, 'minRooms'));
  });
});

describe('sortListings', () => {
  const a = L({ id: 'a', price: 300, living_surface: 50, published_at: '2026-01-01' });
  const b = L({ id: 'b', price: 100, living_surface: 120, published_at: '2026-03-01' });
  const c = L({ id: 'c', price: 200, published_at: '2026-02-01' });
  const por = L({ id: 'por', price: 50, price_on_request: true, living_surface: 80, published_at: '2026-04-01' });
  const none = L({ id: 'none' });
  const all = [none, a, por, b, c];
  it('price asc/desc with missing prices last', () => {
    assert.deepEqual(ids(sortListings(all, 'price-asc')), ['b', 'c', 'a', 'por', 'none']);
    assert.deepEqual(ids(sortListings(all, 'price-desc')), ['a', 'c', 'b', 'por', 'none']);
  });
  it('surface desc, missing last (ties by newest)', () => {
    assert.deepEqual(ids(sortListings(all, 'surface-desc')), ['b', 'por', 'a', 'c', 'none']);
  });
  it('newest first, undated last; input untouched', () => {
    assert.deepEqual(ids(sortListings(all, 'newest')), ['por', 'b', 'c', 'a', 'none']);
    assert.deepEqual(ids(all), ['none', 'a', 'por', 'b', 'c']);
  });
});

describe('priceSteps', () => {
  it('prices above the top step: only the top step, never the whole ladder', () => {
    assert.deepEqual(priceSteps([40e6, 50e6], 'buy'), [30e6]);
    assert.deepEqual(priceSteps([25e3, 28e3], 'rent'), [20e3]);
  });
  it('fewer than two prices → none', () => {
    assert.deepEqual(priceSteps([], 'buy'), []);
    assert.deepEqual(priceSteps([500000], 'buy'), []);
    assert.deepEqual(priceSteps([0, 500000, -1], 'buy'), []);
  });
  it('buy: one step below the cheapest to one at/above the dearest', () => {
    assert.deepEqual(priceSteps([250e3, 900e3], 'buy'), [200e3, 300e3, 400e3, 500e3, 600e3, 750e3, 1e6]);
  });
  it('rent: rent steps (explicit or guessed from small prices)', () => {
    assert.deepEqual(priceSteps([1200, 2200], 'rent'), [1000, 1250, 1500, 1750, 2000, 2500]);
    assert.deepEqual(priceSteps([1200, 2200], undefined), [1000, 1250, 1500, 1750, 2000, 2500]);
    assert.ok(priceSteps([1200, 900e3], undefined).every((s) => s >= 100e3));
  });
  it('capped at max, ascending, keeps both ends', () => {
    const s = priceSteps([100e3, 30e6], 'buy');
    assert.ok(s.length <= 10 && s.length >= 2);
    assert.equal(s[0], 100e3);
    assert.equal(s.at(-1), 30e6);
    assert.deepEqual(s, [...s].sort((x, y) => x - y));
    assert.equal(new Set(s).size, s.length);
    assert.ok(priceSteps([100e3, 30e6], 'buy', 5).length <= 5);
  });
  it('prices above the last step end at the last step', () => {
    assert.equal(priceSteps([5e6, 50e6], 'buy').at(-1), 30e6);
  });
});

describe('pageList', () => {
  it('small: every page', () => {
    assert.deepEqual(pageList(1, 1), [1]);
    assert.deepEqual(pageList(3, 7), [1, 2, 3, 4, 5, 6, 7]);
  });
  it('large: edges and middle', () => {
    assert.deepEqual(pageList(1, 12), [1, 2, 3, 4, null, 12]);
    assert.deepEqual(pageList(4, 12), [1, 2, 3, 4, 5, null, 12]);
    assert.deepEqual(pageList(6, 12), [1, null, 5, 6, 7, null, 12]);
    assert.deepEqual(pageList(12, 12), [1, null, 9, 10, 11, 12]);
  });
  it('never a gap of one page, never two gaps in a row, no duplicates', () => {
    for (let pages = 8; pages <= 30; pages++) {
      for (let page = 1; page <= pages; page++) {
        const out = pageList(page, pages);
        const nums = out.filter((x): x is number => x != null);
        assert.ok(nums.includes(1) && nums.includes(pages) && nums.includes(page), `${page}/${pages}`);
        assert.deepEqual(nums, [...new Set(nums)].sort((a, b) => a - b), `${page}/${pages}`);
        for (let i = 1; i < out.length; i++) {
          assert.ok(!(out[i] == null && out[i - 1] == null), `double gap ${page}/${pages}`);
          if (out[i] == null) assert.ok((out[i + 1] as number) - (out[i - 1] as number) > 2, `gap hides one page ${page}/${pages}`);
          else if (out[i - 1] != null) assert.equal((out[i] as number) - (out[i - 1] as number), 1);
        }
      }
    }
  });
});

describe('runSearch', () => {
  const many = (k: number, o: Fx = {}) => Array.from({ length: k }, (_, i) => L({ price: (i + 1) * 1000, publishedAt: `2026-01-${String((i % 28) + 1).padStart(2, '0')}`, ...o }));
  it('pages and clamps the page', () => {
    const pool = many(30);
    const r = runSearch(pool, P('page=9&sort=price-asc'), { pageSize: 10 });
    assert.equal(r.total, 30);
    assert.equal(r.pages, 3);
    assert.equal(r.page, 3);
    assert.deepEqual(r.items.map((l) => l.price), Array.from({ length: 10 }, (_, i) => (i + 21) * 1000));
    const empty = runSearch([], P('page=4'));
    assert.deepEqual([empty.page, empty.pages, empty.total, empty.items.length], [1, 1, 0, 0]);
  });
  it('map view: list paged like the list view, markers = every located match up to mapLimit', () => {
    const pool = [...many(30, { lat: 46.5, lng: 6.6 }), ...many(2)];
    const r = runSearch(pool, P('view=map&page=4'), { pageSize: 10, mapLimit: 25 });
    assert.deepEqual([r.page, r.pages, r.items.length, r.total, r.mapItems.length, r.truncated], [4, 4, 2, 32, 25, true]);
    assert.equal(runSearch(pool, P('view=map'), { mapLimit: 30 }).truncated, false);
    assert.deepEqual(runSearch(pool, P()).mapItems, [], 'no markers in list view');
  });
  it('map area (bbox): list, count and pages inside it, markers everywhere', () => {
    const inside = many(3, { lat: 46.5, lng: 6.6 });
    const outside = many(4, { lat: 47.4, lng: 8.5 });
    const r = runSearch([...inside, ...outside, L()], P('view=map&bbox=46,6,47,7'));
    assert.equal(r.total, 3);
    assert.deepEqual(new Set(ids(r.items)), new Set(ids(inside)));
    assert.equal(r.mapItems.length, 7);
    assert.deepEqual(r.chips, ['bbox']);
    const none = runSearch([...inside, ...outside], P('view=map&bbox=40,0,41,1'));
    assert.equal(none.total, 0);
    assert.deepEqual(none.relax, [{ key: 'bbox', count: 7 }]);
    assert.equal(none.mapItems.length, 7, 'markers stay so the visitor can pan to them');
  });
  it('counts the whole pool per status, whatever the filters', () => {
    const pool = [...many(3), ...many(2, { status: 'sold' })];
    const r = runSearch(pool, P('minPrice=999999'));
    assert.deepEqual(r.counts, { available: 3, sold: 2 });
    assert.equal(r.total, 0);
    assert.equal(runSearch(pool, P('status=sold')).total, 2);
    assert.deepEqual(runSearch(null as unknown as Listing[], P()).counts, { available: 0, sold: 0 });
  });
  it('facets: offer types present only; cities folded, deduped, sorted, from every offer', () => {
    const pool = [
      L({ city: 'Lausanne', property_type: 'house_villa', rooms: 5 }),
      L({ city: 'Genève' }),
      L({ city: ' geneve ', offer_type: 'rent', price: 2000 }),
      L({ city: '  ' }),
      L({ city: 'Zürich', status: 'sold', offer_type: 'rent' }),
      L({ city: 'Bern', offer_type: 'rent', property_type: 'house' }),
    ];
    const r = runSearch(pool, P(), { locale: 'fr' });
    assert.deepEqual(r.facets.offerTypes, ['buy', 'rent']);
    assert.deepEqual(r.facets.cities, [{ value: 'Bern', count: 1 }, { value: 'Genève', count: 2 }, { value: 'Lausanne', count: 1 }]);
    const buy = runSearch(pool, P('offerType=buy&city=Bern'));
    assert.deepEqual(buy.facets.cities.map((c) => c.value), ['Bern', 'Genève', 'Lausanne'], 'cities ignore offer and city filters');
    assert.deepEqual(buy.facets.propertyTypes, [{ value: 'apartment', count: 2 }, { value: 'house', count: 1 }]);
    assert.deepEqual(buy.facets.rooms, [1, 2, 3, 4, 5]);
    assert.deepEqual(runSearch([L(), L()], P()).facets.offerTypes, ['buy']);
    assert.deepEqual(runSearch(pool, P('status=sold')).facets.offerTypes, ['rent']);
  });
  it('relax: only with zero results, best first, at most 3', () => {
    const pool = [
      L({ city: 'Genève', price: 100, rooms: 2, property_type: 'house' }),
      L({ city: 'Genève', price: 200, rooms: 2, property_type: 'house' }),
      L({ city: 'Lausanne', price: 900, rooms: 5, property_type: 'apartment' }),
    ];
    // Lausanne + rooms 5 + apartment match listing 3 except its price; city and type are fine.
    const r = runSearch(pool, P('city=Lausanne&maxPrice=500&minRooms=5&propertyType=apartment'));
    assert.equal(r.total, 0);
    assert.deepEqual(r.relax, [{ key: 'maxPrice', count: 1 }]);
    const r2 = runSearch(pool, P('city=Genève&minRooms=5&propertyType=apartment&offerType=buy'));
    assert.equal(r2.total, 0);
    assert.ok(r2.relax.length <= 3);
    assert.deepEqual(r2.relax.map((x) => x.count), [...r2.relax.map((x) => x.count)].sort((a, b) => b - a));
    const r3 = runSearch(pool, P('minRooms=2&maxPrice=150&minPrice=50&city=Genève'));
    assert.equal(r3.total, 1);
    assert.deepEqual(r3.relax, []);
    const many4 = runSearch(
      [L({ city: 'A', price: 1, rooms: 1, property_type: 'house', offer_type: 'rent' }), L({ city: 'B', price: 9, rooms: 9, property_type: 'apartment' })],
      P('city=A&maxPrice=5&minRooms=5&propertyType=house'),
    );
    assert.equal(many4.total, 0);
    assert.deepEqual(many4.relax, [{ key: 'minRooms', count: 1 }]);
  });
  it('relax caps at 3, best first', () => {
    // Each listing fails exactly one filter; removing that filter finds them.
    const q = P('offerType=buy&propertyType=house&city=A&minPrice=10&maxPrice=20&minRooms=3');
    const ok = { offer_type: 'buy' as const, property_type: 'house', city: 'A', price: 15, rooms: 3 };
    const pool = [
      ...Array.from({ length: 4 }, () => L({ ...ok, city: 'B' })),
      ...Array.from({ length: 3 }, () => L({ ...ok, rooms: 1 })),
      ...Array.from({ length: 2 }, () => L({ ...ok, price: 50 })),
      L({ ...ok, offer_type: 'rent' }),
    ];
    const r = runSearch(pool, q);
    assert.equal(r.total, 0);
    assert.deepEqual(r.relax, [{ key: 'city', count: 4 }, { key: 'minRooms', count: 3 }, { key: 'maxPrice', count: 2 }]);
  });
  it('chips in display order whatever the URL order', () => {
    const r = runSearch([], P('minRooms=2&city=X&maxPrice=9&offerType=rent&sort=price-asc&view=map&status=sold'));
    assert.deepEqual(r.chips, ['offerType', 'city', 'maxPrice', 'minRooms']);
    assert.equal(r.hasFilters, true);
    assert.equal(runSearch([], P('sort=price-asc&status=sold')).hasFilters, false);
  });
});

describe('searchHref with a map area', () => {
  const base = '/listings';
  it('a filter change keeps the area and the map position; removing the area refits', () => {
    const p = P('view=map&map=12/46.5/6.6&bbox=46,6,47,7&page=2');
    assert.equal(searchHref(base, p, { offerType: 'rent' }), '/listings?offerType=rent&view=map&map=12/46.5/6.6&bbox=46,6,47,7');
    assert.equal(searchHref(base, p, { bbox: undefined }), '/listings?view=map');
    assert.equal(searchHref(base, p, { view: undefined }), '/listings');
    assert.equal(searchHref(base, P('view=map&map=12/46.5/6.6'), { offerType: 'rent' }), '/listings?offerType=rent&view=map');
  });
});

describe('searchHref', () => {
  it('drops default params', () => {
    assert.equal(searchHref('/listings', P()), '/listings');
    assert.equal(searchHref('/listings', P('status=available&sort=newest&view=list&page=1')), '/listings');
    assert.equal(searchHref('/proprietes', P(), { page: 1 }), '/proprietes');
  });
  it('a filter change resets the page and the map position', () => {
    const p = P('city=Lausanne&view=map&map=12/46.5/6.6&page=3');
    assert.equal(searchHref('/listings', p, { minPrice: 100000 }), '/listings?city=Lausanne&minPrice=100000&view=map');
    assert.equal(searchHref('/listings', p, { status: 'sold' }), '/listings?city=Lausanne&status=sold&view=map');
    assert.equal(searchHref('/listings', p, { city: undefined }), '/listings?view=map');
  });
  it('sort resets the page but keeps the map; page and map changes keep the rest', () => {
    const p = P('view=map&map=12/46.5/6.6&page=3&offerType=rent');
    assert.equal(searchHref('/listings', p, { sort: 'price-asc' }), '/listings?offerType=rent&sort=price-asc&view=map&map=12/46.5/6.6');
    const l = P('page=3&city=A');
    assert.equal(searchHref('/listings', l, { page: 4 }), '/listings?city=A&page=4');
    assert.equal(searchHref('/listings', l), '/listings?city=A&page=3');
    assert.equal(searchHref('/listings', p, { map: '10/1/2' }), '/listings?offerType=rent&view=map&page=3&map=10/1/2');
  });
  it('map param dropped in list view', () => {
    const p: SearchParams = { ...P('view=map'), map: '12/46.5/6.6' };
    assert.equal(searchHref('/listings', p, { view: 'list' }), '/listings');
    assert.equal(searchHref('/listings', { ...P(), map: '12/46.5/6.6' }), '/listings');
  });
  it('keeps a fixed param order and encodes values', () => {
    const p = P('page=2&minRooms=3&city=Gen%C3%A8ve%20%26%20co&offerType=buy&sort=desc');
    assert.equal(searchHref('/listings', p, { page: 2 }), '/listings?offerType=buy&city=Gen%C3%A8ve+%26+co&minRooms=3&sort=price-desc&page=2');
    assert.deepEqual(P(searchHref('/listings', p, { page: 2 }).split('?')[1]), p);
  });
});

describe('mapView', () => {
  it('valid positions only', () => {
    assert.deepEqual(mapView('12/46.2/6.15'), { z: 12, lat: 46.2, lng: 6.15 });
    assert.equal(mapView(undefined), undefined);
    assert.equal(mapView('2/46/6'), undefined);
    assert.equal(mapView('19/46/6'), undefined);
    assert.equal(mapView('12/86/6'), undefined);
    assert.equal(mapView('12/46/181'), undefined);
  });
});

describe('price filter currency', () => {
  it('filters and steps within one currency (the pool’s, or opts.currency); never compares CHF with EUR', () => {
    const chf = [L({ price: 900_000 }), L({ price: 1_500_000 })];
    const eur = L({ price: 1_000_000, currency: 'EUR' });
    const pool = [...chf, eur];
    assert.deepEqual(ids(runSearch(pool, P('maxPrice=1200000')).matches), [chf[0]!.id]);
    assert.deepEqual(ids(runSearch(pool, P('maxPrice=1200000'), { currency: 'EUR' }).matches), [eur.id]);
    assert.equal(runSearch(pool, P()).total, 3, 'no price filter: every currency');
    assert.ok(!matches(eur, P('minPrice=1'), undefined, 'CHF'));
  });
});
