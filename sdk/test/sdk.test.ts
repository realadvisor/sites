// node --test from sdk: Node strips the TypeScript types itself.
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { afterEach, describe, it, mock } from 'node:test';

import * as sdk from '../src/index.ts';
import { createClient, createFixtureClient, FIXTURE_TURNSTILE_SITE_KEY, handleEnquiry, SitesApiError } from '../src/index.ts';
import type { Fixture, Listing } from '../src/index.ts';

const URL_ = 'https://gw.test/';
const KEY = 'ra_site_test';
const MAIN = 'portal-main';
const FEATURED = 'portal-featured';
const ID = '55555555-5555-4555-8555-555555555555';

type Seen = { method: string; url: URL; headers: Headers; body: unknown; signal?: AbortSignal };

/** A fetch that records each request and answers from `answer` (a Response or a thrown error). */
const fakeFetch = (answer: (req: Seen, n: number) => Response | Promise<Response>) => {
  const seen: Seen[] = [];
  const fetch = (async (input: string, init: RequestInit = {}) => {
    const req = {
      method: init.method ?? 'GET',
      url: new URL(input),
      headers: new Headers(init.headers),
      body: init.body ? JSON.parse(String(init.body)) : undefined,
      signal: init.signal ?? undefined,
    };
    seen.push(req);
    return answer(req, seen.length);
  }) as typeof globalThis.fetch;
  return { fetch, seen };
};

const json = (status: number, body: unknown) => Response.json(body, { status });

/** A list answer of rest-api: one page of `rows`. */
const page = (rows: unknown[] = [], total = rows.length, offset = 0) => ({
  data: rows,
  pagination: { limit: 200, offset, total, total_is_capped: false, has_more: offset + rows.length < total },
});

const client = (answer: Parameters<typeof fakeFetch>[0]) => {
  const f = fakeFetch(answer);
  return { ra: createClient({ portals: { main: MAIN, featured: FEATURED }, url: URL_, key: KEY, fetch: f.fetch }), seen: f.seen };
};

afterEach(() => {
  delete process.env.SITES_API_URL;
  delete process.env.SITES_API_KEY;
  delete process.env.SITE_MODE;
  mock.timers.reset();
});

describe('package', () => {
  it('exports exactly createClient, createFixtureClient, handleEnquiry, SitesApiError and FIXTURE_TURNSTILE_SITE_KEY', () => {
    assert.deepEqual(Object.keys(sdk).sort(), ['FIXTURE_TURNSTILE_SITE_KEY', 'SitesApiError', 'createClient', 'createFixtureClient', 'handleEnquiry']);
  });

  it('has no dependencies or peerDependencies', () => {
    const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
    assert.equal(pkg.dependencies, undefined);
    assert.equal(pkg.peerDependencies, undefined);
  });

  it('imports no framework, virtual module, node: built-in or package', () => {
    const dir = new URL('../src/', import.meta.url);
    for (const file of readdirSync(dir)) {
      const src = readFileSync(new URL(file, dir), 'utf8');
      for (const [, spec] of src.matchAll(/(?:from|import)\s*\(?\s*['"]([^'"]+)['"]/g)) {
        assert.match(spec!, /^\.\.?\//, `${file} imports ${spec}`);
      }
    }
  });
});

describe('data access', () => {
  it('reads SITES_API_URL and SITES_API_KEY from process.env and sends the key as a bearer', async () => {
    process.env.SITES_API_URL = 'https://env.test';
    process.env.SITES_API_KEY = 'ra_site_env';
    const f = fakeFetch(() => json(200, page()));
    const original = globalThis.fetch;
    globalThis.fetch = f.fetch;
    try {
      await createClient({ portals: { main: MAIN } }).teams();
    } finally {
      globalThis.fetch = original;
    }
    assert.equal(f.seen[0]!.url.href, 'https://env.test/v3/public/teams?limit=200&offset=0');
    assert.equal(f.seen[0]!.headers.get('authorization'), 'Bearer ra_site_env');
  });

  it('fails with the exact message when the URL or the key is missing, before any request', async () => {
    for (const env of [{}, { SITES_API_URL: 'https://env.test' }, { SITES_API_KEY: 'k' }]) {
      Object.assign(process.env, env);
      const f = fakeFetch(() => json(200, page()));
      const ra = createClient({ portals: { main: MAIN }, fetch: f.fetch });
      await assert.rejects(ra.teams(), (err: unknown) => {
        assert.ok(err instanceof SitesApiError);
        assert.equal(err.code, 'unavailable');
        assert.equal(err.message, 'no data access: set SITES_API_URL and SITES_API_KEY');
        return true;
      });
      assert.equal(f.seen.length, 0);
      delete process.env.SITES_API_URL;
      delete process.env.SITES_API_KEY;
    }
  });
});

describe('methods', () => {
  it('call their /v3/public paths with their query strings', async () => {
    const { ra, seen } = client(req =>
      json(200, /\/(listings|developments)\/|organisation$/.test(req.url.pathname) ? { id: ID } : page()),
    );
    await ra.organisation();
    await ra.teams();
    await ra.agents();
    await ra.agents({ team_id: 't1' });
    await ra.listings();
    await ra.listings({ portal: 'featured', team_id: 't1', offer_type: 'rent', city: 'Genève', min_price: 1000, max_price: 3000, min_rooms: 2, limit: 500, offset: 24 });
    await ra.listing(`villa-au-lac-${ID.toUpperCase()}`);
    await ra.developments({ team_id: 't1' });
    await ra.development('les jardins');
    assert.deepEqual(
      seen.map(s => `${s.method} ${s.url.pathname}${s.url.search}`),
      [
        'GET /v3/public/organisation',
        'GET /v3/public/teams?limit=200&offset=0',
        'GET /v3/public/agents?limit=200&offset=0',
        'GET /v3/public/agents?team_id=t1&limit=200&offset=0',
        `GET /v3/public/listings?portal_ids=${MAIN}&limit=24`,
        `GET /v3/public/listings?team_id=t1&offer_type=rent&city=Gen%C3%A8ve&min_price=1000&max_price=3000&min_rooms=2&offset=24&portal_ids=${FEATURED}&limit=200`,
        `GET /v3/public/listings/${ID}?portal_ids=${MAIN}%2C${FEATURED}`,
        `GET /v3/public/developments?team_id=t1&portal_ids=${MAIN}%2C${FEATURED}&limit=200&offset=0`,
        `GET /v3/public/developments/les%20jardins?portal_ids=${MAIN}%2C${FEATURED}`,
      ],
    );
  });

  it('without portals, names none: rest-api uses the site portal', async () => {
    const f = fakeFetch(req => json(200, /listings\//.test(req.url.pathname) ? { id: ID } : page()));
    const ra = createClient({ url: URL_, key: KEY, fetch: f.fetch });
    await ra.listings();
    await ra.listing(ID);
    await ra.developments();
    assert.deepEqual(
      f.seen.map(s => `${s.url.pathname}${s.url.search}`),
      ['/v3/public/listings?limit=24', `/v3/public/listings/${ID}`, '/v3/public/developments?limit=200&offset=0'],
    );
    await assert.rejects(ra.listings({ portal: 'main' }), { code: 'invalid_portal' });
    const res = await handleEnquiry(enquiryRequest({ json: FORM }), ra);
    assert.equal(res.status, 200);
    assert.equal((f.seen.at(-1)!.body as Record<string, unknown>).portal_id, undefined);
  });

  it('turnstileSiteKey: the key of /v3/public/enquiries/verification, kept; null when off or failed', async () => {
    const { ra, seen } = client(() => json(200, { site_key: '0x4AAA' }));
    assert.equal(await ra.turnstileSiteKey(), '0x4AAA');
    assert.equal(await ra.turnstileSiteKey(), '0x4AAA');
    assert.deepEqual(seen.map(s => s.url.pathname), ['/v3/public/enquiries/verification']);
    assert.equal(await client(() => json(200, { site_key: null })).ra.turnstileSiteKey(), null);
    const errors = mock.method(console, 'error', () => {});
    try {
      assert.equal(await client(() => json(403, { error: 'forbidden' })).ra.turnstileSiteKey(), null);
      assert.equal(errors.mock.callCount(), 0, 'a 403 is not logged');
      assert.equal(await client(() => json(500, {})).ra.turnstileSiteKey(), null);
      assert.ok(errors.mock.callCount() > 0);
    } finally {
      errors.mock.restore();
    }
  });

  it('answers null for a listing or development not found, never an error', async () => {
    const { ra, seen } = client(() => json(404, { title: 'Listing not found' }));
    assert.equal(await ra.listing(ID), null);
    assert.equal(await ra.development('nope'), null);
    assert.equal(await ra.listing('no-id-here'), null);
    assert.equal(seen.length, 2, 'a slug without an id asks nothing');
  });

  it('refuses a portal name the client does not have', async () => {
    const { ra, seen } = client(() => json(200, page()));
    await assert.rejects(ra.listings({ portal: 'other' }), { code: 'invalid_portal' });
    assert.equal(seen.length, 0);
  });

  it('answers a page of listings as rest-api sends it', async () => {
    const answer = page([{ id: ID }], 31, 24);
    const { ra } = client(() => json(200, answer));
    assert.deepEqual(await ra.listings({ offset: 24 }), answer);
  });

  it('allListings and the other lists read every page', async () => {
    const rows = Array.from({ length: 430 }, (_, i) => ({ id: String(i) }));
    const { ra, seen } = client(req => {
      const offset = Number(req.url.searchParams.get('offset') ?? 0);
      return json(200, page(rows.slice(offset, offset + 200), rows.length, offset));
    });
    const all = await ra.allListings({ offer_type: 'buy' });
    assert.equal(all.length, 430);
    assert.deepEqual(
      seen.map(s => [s.url.searchParams.get('offset'), s.url.searchParams.get('limit'), s.url.searchParams.get('offer_type')]).sort(),
      [
        ['0', '200', 'buy'],
        ['200', '200', 'buy'],
        ['400', '200', 'buy'],
      ],
    );
    assert.equal((await ra.agents()).length, 430);
  });

  it('a list ends with the last page the API serves, offset 10 000', async () => {
    const { ra, seen } = client(req => {
      const offset = Number(req.url.searchParams.get('offset') ?? 0);
      // rest-api: no offset past 10 000, and a total that stops counting at 10 201.
      if (offset > 10_000) return json(400, { error: 'invalid', fields: { offset: 'invalid' } });
      const rows = Array.from({ length: 200 }, (_, i) => ({ id: String(offset + i) }));
      return json(200, { ...page(rows, 10_201, offset), pagination: { ...page(rows, 10_201, offset).pagination, total_is_capped: true } });
    });
    assert.equal((await ra.allListings()).length, 10_200);
    assert.equal(Math.max(...seen.map(s => Number(s.url.searchParams.get('offset')))), 10_000);
  });
});

describe('errors', () => {
  const cases: Array<[number, Record<string, unknown>, string]> = [
    [400, { error: 'invalid', fields: { email: 'invalid' } }, 'invalid'],
    [400, { error: 'lot_required', fields: { lot_id: 'required' } }, 'invalid'],
    [400, { error: 'portal_required' }, 'invalid'],
    [400, { error: 'invalid_portal' }, 'invalid_portal'],
    [400, { error: 'invalid_team' }, 'invalid_team'],
    [400, { error: 'rejected' }, 'rejected'],
    [401, { error: 'unauthorized' }, 'site_key'],
    [403, { error: 'unknown site' }, 'site_key'],
    [403, { error: 'verification_required' }, 'verification_required'],
    [429, { error: 'rate limited' }, 'rate_limited'],
    [502, { error: 'upstream unavailable' }, 'unavailable'],
    [503, {}, 'unavailable'],
  ];
  for (const [status, body, code] of cases) {
    it(`${status} ${JSON.stringify(body.error ?? '')} is ${code}`, async () => {
      const { ra } = client(() => json(status, body));
      await assert.rejects(ra.teams(), (err: unknown) => {
        assert.ok(err instanceof SitesApiError);
        assert.equal(err.code, code);
        assert.equal(err.status, status);
        if (body.fields) assert.deepEqual(err.fields, body.fields);
        return true;
      });
    });
  }

  it('a network failure is unavailable', async () => {
    const { ra } = client(() => Promise.reject(new TypeError('fetch failed')));
    await assert.rejects(ra.teams(), { code: 'unavailable' });
  });

  it('gives up after 8 s with unavailable, and tries a GET once more', async () => {
    mock.timers.enable({ apis: ['setTimeout'] });
    // A request that never answers: it ends only when the SDK aborts it.
    const { ra, seen } = client(
      req =>
        new Promise<Response>((_, reject) =>
          req.signal!.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError'))),
        ),
    );
    const pending = assert.rejects(ra.teams(), (err: unknown) => {
      assert.ok(err instanceof SitesApiError);
      assert.equal(err.code, 'unavailable');
      assert.match(err.message, /no answer in 8 s/);
      return true;
    });
    for (let attempt = 1; attempt <= 2; attempt++) {
      while (seen.length < attempt) await new Promise(r => setImmediate(r));
      mock.timers.tick(7999);
      assert.equal(seen[attempt - 1]!.signal!.aborted, false, 'still waiting just before 8 s');
      mock.timers.tick(1);
    }
    await pending;
    assert.equal(seen.length, 2);
  });

  it('retries a GET once when unavailable, and only then', async () => {
    const { ra, seen } = client((_, n) => (n === 1 ? json(503, {}) : json(200, page())));
    assert.deepEqual(await ra.teams(), []);
    assert.equal(seen.length, 2);

    const twice = client(() => json(502, {}));
    await assert.rejects(twice.ra.teams(), { code: 'unavailable' });
    assert.equal(twice.seen.length, 2);

    const refused = client(() => json(401, {}));
    await assert.rejects(refused.ra.teams(), { code: 'site_key' });
    assert.equal(refused.seen.length, 1, 'never retries a refusal');
  });

  it('never retries a POST', async () => {
    const { ra, seen } = client(() => json(503, {}));
    const res = await handleEnquiry(enquiryRequest({ json: FORM }), ra);
    assert.equal(res.status, 502);
    assert.deepEqual(await res.json(), { code: 'unavailable' });
    assert.equal(seen.length, 1);
  });
});

const FORM = { name: 'Ada Lovelace', email: 'ada@example.com', message: 'Plans please' };

const enquiryRequest = ({ json: body, form, headers = {} }: { json?: Record<string, string>; form?: Record<string, string>; headers?: Record<string, string> }) =>
  new Request('https://site.test/api/enquiry', {
    method: 'POST',
    headers: body ? { 'content-type': 'application/json', ...headers } : headers,
    body: body ? JSON.stringify(body) : new URLSearchParams(form),
  });

describe('handleEnquiry', () => {
  it('sends a JSON enquiry with the main portal, token, idempotency key and visitor IP', async () => {
    const { ra, seen } = client(() => json(200, { id: 'enq-1' }));
    const res = await handleEnquiry(
      enquiryRequest({
        json: { ...FORM, listing_id: ID, team_id: 't1', 'cf-turnstile-response': 'tok', idempotency_key: 'idem-12345' },
        headers: { 'cf-connecting-ip': '203.0.113.7', 'x-forwarded-for': '198.51.100.1' },
      }),
      ra,
    );
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), { id: 'enq-1' });
    const sent = seen[0]!;
    assert.equal(`${sent.method} ${sent.url.pathname}`, 'POST /v3/public/enquiries');
    assert.equal(sent.headers.get('x-ra-client-ip'), '203.0.113.7');
    assert.deepEqual(sent.body, {
      ...FORM,
      listing_id: ID,
      team_id: 't1',
      idempotency_key: 'idem-12345',
      turnstile_token: 'tok',
      portal_id: MAIN,
    });
  });

  it('takes form data, the IP from the first x-forwarded-for, and redirects a form posted without JavaScript', async () => {
    const { ra, seen } = client(() => json(200, { id: 'enq-2' }));
    const res = await handleEnquiry(
      enquiryRequest({ form: { ...FORM, redirect: '/contact#form' }, headers: { 'x-forwarded-for': '198.51.100.1, 10.0.0.1' } }),
      ra,
    );
    assert.equal(res.status, 303);
    assert.equal(res.headers.get('location'), '/contact?enquiry=sent#form');
    assert.equal(seen[0]!.headers.get('x-ra-client-ip'), '198.51.100.1');
    assert.equal((seen[0]!.body as Record<string, string>).name, 'Ada Lovelace');
  });

  it('never redirects off the site', async () => {
    const { ra } = client(() => json(200, { id: 'enq-3' }));
    const res = await handleEnquiry(enquiryRequest({ form: { ...FORM, redirect: '//evil.example/x' } }), ra);
    assert.equal(res.headers.get('location'), '/?enquiry=sent');
  });

  it('answers 400 invalid with the fields, and sends nothing', async () => {
    const { ra, seen } = client(() => json(200, { id: 'x' }));
    const res = await handleEnquiry(enquiryRequest({ json: { name: 'Ada', email: 'not-an-email', lot_id: ID } }), ra);
    assert.equal(res.status, 400);
    assert.deepEqual(await res.json(), { code: 'invalid', fields: { email: 'invalid', message: 'required', lot_id: 'invalid' } });
    assert.equal(seen.length, 0);
  });

  it('on a preview (SITE_MODE=preview) answers { preview: true } without calling fetch', async () => {
    process.env.SITE_MODE = 'preview';
    const { ra, seen } = client(() => json(200, { id: 'x' }));
    const res = await handleEnquiry(enquiryRequest({ json: FORM }), ra);
    assert.deepEqual(await res.json(), { preview: true });
    assert.equal(seen.length, 0);
  });

  it('answers each code with its status, codes only', async () => {
    const answers: Array<[number, Record<string, unknown>, number, Record<string, unknown>]> = [
      [403, { error: 'verification_required' }, 403, { code: 'verification_required' }],
      [400, { error: 'rejected' }, 400, { code: 'rejected' }],
      [400, { error: 'lot_required', fields: { lot_id: 'required' } }, 400, { code: 'invalid', fields: { lot_id: 'required' } }],
      [429, { error: 'rate limited' }, 429, { code: 'rate_limited' }],
      [401, {}, 401, { code: 'site_key' }],
    ];
    for (const [status, body, want, wantBody] of answers) {
      const { ra } = client(() => json(status, body));
      const res = await handleEnquiry(enquiryRequest({ json: FORM }), ra);
      assert.equal(res.status, want);
      assert.deepEqual(await res.json(), wantBody);
    }
  });
});

describe('createFixtureClient', () => {
  const T1 = '11111111-1111-4111-8111-111111111111';
  const listing = (id: string, over: Partial<Listing>): Listing => ({
    id,
    slug: `flat-${id}`,
    title: 'Flat',
    offer_type: 'buy',
    property_type: 'apartment',
    status: 'available',
    currency: 'CHF',
    address: { city: 'Genève' },
    photos: [],
    features: [],
    published_at: '2026-01-01T00:00:00Z',
    team_ids: [T1],
    ...over,
  });
  const fx: Fixture = {
    organisation: { id: 'o1', name: 'Demo Agency' },
    teams: [{ id: T1, name: 'Lausanne', primary: true, address: {}, socials: {} }],
    agents: [
      { id: 'a1', first_name: 'Léa', last_name: 'Exemple', team_ids: [T1] },
      { id: 'a2', first_name: 'Marc', last_name: 'Démo', team_ids: [] },
    ],
    listings: [
      listing('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', { price: 900_000, rooms: 4, published_at: '2026-01-01T00:00:00Z' }),
      listing('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', { offer_type: 'rent', property_type: 'apartment_penthouse', price: 3000, rooms: 2, published_at: '2026-03-01T00:00:00Z' }),
      listing('cccccccc-cccc-4ccc-8ccc-cccccccccccc', { property_type: 'house_villa', status: 'sold', price_on_request: true, address: { city: 'Lausanne' }, team_ids: [], published_at: '2026-02-01T00:00:00Z' }),
    ],
    developments: [
      {
        id: ID, slug: 'les-jardins', title: 'Les Jardins', address: {}, photos: [], currency: 'CHF', agents: [], team_ids: [T1],
        stats: { units: 1, available: 1, reserved: 0, sold: 0 },
        units: [{ id: 'u1', name: '4,5 pièces', status: 'available', offer_type: 'buy', property_type: 'apartment', currency: 'CHF', features: [] }],
      },
    ],
  };
  const ra = createFixtureClient(fx);
  const ids = (ls: Listing[]) => ls.map(l => l.id[0]);

  it('lists newest first with the API filters and pages', async () => {
    assert.deepEqual(ids(await ra.allListings()), ['b', 'c', 'a']);
    assert.deepEqual(ids(await ra.allListings({ property_type: 'apartment' })), ['b', 'a']);
    assert.deepEqual(ids(await ra.allListings({ offer_type: 'rent' })), ['b']);
    assert.deepEqual(ids(await ra.allListings({ city: 'geneve ' })), ['b', 'a']);
    assert.deepEqual(ids(await ra.allListings({ status: 'sold' })), ['c']);
    assert.deepEqual(ids(await ra.allListings({ min_price: 1000, max_price: 5000 })), ['b']);
    assert.deepEqual(ids(await ra.allListings({ min_rooms: 3 })), ['a']);
    assert.deepEqual(ids(await ra.allListings({ team_id: T1 })), ['b', 'a']);
    const p = await ra.listings({ limit: 1, offset: 1 });
    assert.deepEqual(ids(p.data), ['c']);
    assert.deepEqual(p.pagination, { limit: 1, offset: 1, total: 3, total_is_capped: false, has_more: true });
  });

  it('finds a listing or a development by slug, id or a slug ending with the id', async () => {
    assert.equal((await ra.listing('flat-aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'))?.id[0], 'a');
    assert.equal((await ra.listing('anything-bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'))?.id[0], 'b');
    assert.equal(await ra.listing('nope'), null);
    assert.equal((await ra.development('les-jardins'))?.units.length, 1);
    assert.equal((await ra.development(ID))?.slug, 'les-jardins');
    assert.equal('units' in (await ra.developments())[0]!, false);
  });

  it('agents of a team, and a stand-in Turnstile key unless the fixture says otherwise', async () => {
    assert.deepEqual((await ra.agents({ team_id: T1 })).map(a => a.id), ['a1']);
    assert.equal((await ra.agents()).length, 2);
    assert.equal(await ra.turnstileSiteKey(), FIXTURE_TURNSTILE_SITE_KEY);
    assert.equal(await createFixtureClient({ ...fx, turnstile_site_key: null }).turnstileSiteKey(), null);
  });

  it('never sends an enquiry', async () => {
    await assert.rejects(handleEnquiry(enquiryRequest({ json: FORM }), ra), TypeError);
  });
});
