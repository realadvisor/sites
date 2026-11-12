# @realadvisor/sites-sdk

The data client of a RealAdvisor site. It reads what an agency publishes from
its CRM (organisation, teams, agents, listings, new-build developments) and
sends enquiries back to it.

It is a thin client of the REST API's `/v3/public` resource. The API owns
every data rule (what is public, how prices and addresses are shown, caching).
The SDK adds four things: transport, types, one error code per failure, and a
ready-made enquiry endpoint.

- No dependencies, web standards only (`fetch`, `Request`, `Response`). It
  runs unchanged in Astro, React Router, a Cloudflare Worker and Node 22.
- Server-side only. The key must never reach the browser.
- Not on npm yet: sites depend on it by path (`file:../sdk`).
- Both kits (`kit`, `kit-react`) take it as a peer and re-export
  it; a site depends on it next to the kit (`file:../sdk`).

## Quick start

Set two environment variables. The CRM sets both when it publishes a site.

```sh
SITES_API_URL=https://rest.realadvisor.com   # the REST API origin
SITES_API_KEY=...                            # the site's own key (a secret)
```

Create one client and read:

```ts
import { createClient } from '@realadvisor/sites-sdk';

const ra = createClient({
  // The site's portals by name, `main` required. Without portals: the site's own.
  portals: { main: '939666fc-c8d9-49e9-8e4b-19a6e9177e21' },
});

const organisation = await ra.organisation();
const { data, pagination } = await ra.listings({ offer_type: 'buy', limit: 12 });

console.log(organisation.name, pagination.total);
for (const listing of data) console.log(listing.title, listing.price);
```

The client reads the two variables on each call, not when it is created. A
build with no data access only fails where it reads data.

## Reading data

| Method | Returns | Notes |
| --- | --- | --- |
| `organisation()` | `Organisation` | The agency the site is for. |
| `teams()` | `Team[]` | Every team (office). The site's own team is first and has `primary: true`. |
| `agents({ team_id? })` | `Agent[]` | The whole organisation without `team_id`. |
| `listings(query?)` | `Page<Listing>` | One page. See the filters below. |
| `allListings(query?)` | `Listing[]` | Every page of `listings(query)`. |
| `listing(slugOrId, { locale? })` | `Listing \| null` | Live on any of the site's portals. `null` when not found. |
| `developments({ team_id?, locale? })` | `Development[]` | New-build developments, without their units. |
| `development(slugOrId, { locale? })` | `DevelopmentWithUnits \| null` | One development with its units. `null` when not found. |
| `turnstileSiteKey()` | `string \| null` | The enquiry form's Turnstile key, kept 5 minutes. `null`: no widget. |

Not found is never an error: `listing()` and `development()` answer `null`.

### Listing filters

Every filter is optional.

| Filter | Type | Meaning |
| --- | --- | --- |
| `portal` | `string` | A name from the client's `portals`. Default `main`. |
| `team_id` | `string` | Listings of one team's brokers. |
| `offer_type` | `'buy' \| 'rent'` | |
| `property_type` | `string` | Exact type name or a prefix: `apartment` matches `apartment_penthouse`. |
| `status` | `'available' \| 'sold'` | |
| `city` | `string` | Case- and accent-insensitive: `geneve` finds Genève. |
| `min_price`, `max_price` | `number` | |
| `min_rooms` | `number` | |
| `locale` | `string` | The page language. See Languages. |
| `limit` | `number` | 1 to 200. Default 24 (the API's own default is 50). |
| `offset` | `number` | Up to 10 000. |

### Languages

`listings`, `allListings`, `listing`, `developments` and `development` take a
`locale` (`de`, `fr-CH`, ...). With it, a listing's `title`, `description` and
`description_text` (a live unit's `description`) come in that language when
the agency wrote them in the CRM (the listing's custom texts, as its brochure
shows them), else the original. `text_locale` is set when every text came in
that language: mark it as the element's `lang`. A development's own texts
have one language in the CRM. Without `locale`, the original texts. Both kits
pass the page locale on a site with more than one locale.

### Pages

`listings()` answers one page, exactly as the API sends it:

```ts
type Page<T> = {
  data: T[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
    total_is_capped: boolean; // true when `total` stopped counting at its cap
    has_more: boolean;
  };
};
```

`teams()`, `agents()`, `developments()` and `allListings()` read every page for
you and answer a plain array. The API accepts no offset past 10 000, so the
array ends after 10 200 rows.

### Portals

A portal is a publication channel in the CRM. A listing shows on a site when
it is live on one of the site's portals.

```ts
const ra = createClient({
  portals: { main: '<portal id>', luxury: '<another portal id>' },
});

await ra.listings();                     // listings of `main`
await ra.listings({ portal: 'luxury' }); // listings of `luxury`
await ra.listing(slug);                  // found on any of the two
```

Enquiries always go to `main`. A client without `portals` names none: rest-api
then uses the site's own portal, for reads and enquiries.

## What the data looks like

The types are the `/v3/public` schemas of the REST API, field for field, in
the API's snake_case (`offer_type`, `first_name`, `living_surface`). A type
test in `rest-api` fails when the two differ, so the types cannot drift.

Four rules hold for every answer:

1. **A field with no value is absent.** Never `null`, never `''`. Test with
   `if (listing.price)`, not against `null`.
2. **Arrays are always arrays.** `listing.photos` and `listing.features` exist
   even when empty.
3. **Descriptions are sanitized HTML.** Only `p`, `br`, `ul`, `ol`, `li`,
   `strong`, `em`, `h3`, `h4`, no attributes. `description_text` is the same
   text without tags, for meta tags and cards.
4. **Coordinates are never exact.** `lat` and `lng` are rounded as the CRM's
   address display option asks (about 10 m, 100 m or 1 km).

A hidden price is absent, and `price_on_request` is then `true`; so are the
prices that go with it (`rent_extra`, the parking prices).

### Listing and unit facts

Both carry these, each absent when the CRM has none. Money is in the record's
`currency`, surfaces in m².

| Field | Meaning |
| --- | --- |
| `balcony_surface`, `terrace_surface`, `garden_surface` | Outdoor surfaces. |
| `floor` | 0 = ground floor. `building_floors`: floors of the building. |
| `orientation` | `['south', 'west']`: the directions it faces. |
| `construction_year`, `renovation_year` | |
| `energy_class` | `A` to `G`. `energy_certificate_version`: the certificate it is from, as typed in the CRM. |
| `minergie` | `minergie`, `minergie_p`, `minergie_eco` or `minergie_p_eco`. |
| `heating` | CRM key: `heat_pump`, `gas`, `district`, ... Show it translated. |
| `has_cellar`, `furnished`, `pets_allowed` | `true` or `false`. |
| `indoor_parkings`, `outdoor_parkings` | Numbers of parkings. |
| `charges` | Monthly charges of the property. |
| `rent_extra` | Rentals: monthly extra costs on top of `price`. |
| `parking_price` or `indoor_parking_price` / `outdoor_parking_price` | All parkings together, or per parking. `parking_included: true` when they are in `price`. |
| `available_from` | Move-in date, `YYYY-MM-DD`. |
| `video_url`, `virtual_visit_url` | Links. A unit has them, like its photos, when it is a live listing. |

A unit also has `reference` (its number in the development, `A1.2`) and
`site_plan_points`: its outline on the development's `site_plan`, as SVG
polygon points in the image's own pixels
(`<svg viewBox="0 0 {width} {height}"><polygon points={site_plan_points} /></svg>`
over the image). A development has `developer`, `architect` and
`general_contractor`: `{ name, website?, logo? }`.

`Unit.name` ("4,5 pièces · Rez-de-jardin") is written by the API in French for
now, whatever the site's language.

All types are exported from the package root and from
`@realadvisor/sites-sdk/types`:
`Organisation`, `Team`, `Agent`, `Listing`, `Unit`, `Development`,
`DevelopmentWithUnits`, `PropertyFacts`, `Company`, `Photo`, `Address`,
`Socials`, `OfferType`, `ListingStatus`, `UnitStatus`, `Page`, `Pagination`,
`ListingsQuery`, `TextQuery`, `Portals`, `ClientOptions`, `SitesClient`,
`Fixture`, `FixtureTranslations`, `ErrorCode`.

## Enquiries

`handleEnquiry` is the site's whole enquiry endpoint: a standard `Request` in,
a `Response` out. Mount it on one route.

```ts
// Astro: src/pages/api/enquiry.ts
import { handleEnquiry } from '@realadvisor/sites-sdk';
import { ra } from '../../lib/ra';

export const prerender = false;
export const POST = ({ request }) => handleEnquiry(request, ra);
```

It accepts a JSON body or a posted form with these fields:

| Field | Required | Notes |
| --- | --- | --- |
| `name`, `email`, `message` | yes | At most 100, 200 and 5000 characters. |
| `phone` | no | At most 40 characters. |
| `listing_id`, `agent_id`, `team_id` | no | What the enquiry is about. |
| `development_id`, `lot_id` | no | `lot_id` needs `development_id`. |
| `contact_reason` | no | `buy`, `sell`, `valuation` or `other`. |
| `locale`, `page_url` | no | `page_url` defaults to the `Referer` header. |
| `idempotency_key` | no | 8 to 100 letters, digits, `-` or `_`. The same key never creates a second enquiry. |
| `cf-turnstile-response` | when verification is on | The Turnstile widget adds it to the form. |

It answers:

| Case | JSON request | Form posted without JavaScript |
| --- | --- | --- |
| Sent | `200 { id }` | `303` to `redirect` with `?enquiry=sent` |
| Preview (`SITE_MODE=preview`) | `200 { preview: true }`, nothing is sent | `?enquiry=preview` |
| Refused | the code's status, `{ code, fields? }` | `?enquiry=error` |

`redirect` is a form field: a path of the same site (default `/`).

The answer carries codes, never sentences: the site's form words them in its
own language. The visitor's IP (`cf-connecting-ip`, else `x-forwarded-for`) is
passed on so the API can limit enquiries per visitor.

### Verification (Turnstile)

The API decides whether an enquiry needs a Turnstile token. Ask it for the
public key the form's widget renders:

```
GET /v3/public/enquiries/verification   ->   { "site_key": "0x4AAA..." }
```

`site_key` is `null` while verification is off: render no widget then.
`turnstileSiteKey()` reads it and keeps it 5 minutes (30 s while there is
none); a failed lookup answers `null`.

## Errors

Every failure is a `SitesApiError` with one `code`:

| `code` | Status | Meaning |
| --- | --- | --- |
| `invalid` | 400 | A field is wrong. `err.fields` says which, e.g. `{ email: 'invalid' }`. |
| `invalid_portal` | 400 | A portal is not an API portal of the organisation. |
| `invalid_team` | 400 | `team_id` is not a team of the organisation. |
| `rejected` | 400 | The CRM refused the enquiry. |
| `site_key` | 401, 403 | The key was revoked or rotated, or may not read this. |
| `verification_required` | 403 | No valid Turnstile token. |
| `rate_limited` | 429 | Too many enquiries from this visitor. |
| `unavailable` | any other, or none | The API failed or did not answer in 8 s, or no data access is configured. Also a 409: an enquiry with the same `idempotency_key` is still being created. |

```ts
import { SitesApiError } from '@realadvisor/sites-sdk';

try {
  await ra.listings({ team_id });
} catch (err) {
  if (err instanceof SitesApiError && err.code === 'invalid_team') {
    // err.status is the HTTP status (0 when the API gave none), err.fields the wrong fields
  }
  throw err;
}
```

A read that finds the API unavailable is tried once more before it fails. An
enquiry is never retried.

## Caching

The API caches reads for 60 seconds per key. A change in the CRM shows on the
site within a minute. Do not add a cache of your own on top. Enquiries and the
verification route are never cached.

## Fixtures

`createFixtureClient(fixture)` is a `SitesClient` with no network, for
`pnpm dev`, builds and tests: the same methods and the same filters as the
API, over a `Fixture` (`organisation`, `teams`, `agents`, `listings`,
`developments`, in the API's shape). `turnstileSiteKey()` answers
`FIXTURE_TURNSTILE_SITE_KEY` (a stand-in widget that never loads Turnstile)
unless the fixture sets `turnstile_site_key`. It sends no enquiry:
`handleEnquiry` refuses it, so answer a fixture-mode form yourself.

A fixture listing or unit may carry its texts in other languages:

```json
{ "title": "Villa du lac", "translations": { "de": { "title": "Villa am See", "description": "<p>Seesicht</p>" } } }
```

With `locale`, the fixture client serves them as the API serves the CRM's
(`text_locale` included; a unit's description only when it has one), and it
never passes `translations` on.

## Tests

`createClient` takes `url`, `key` and `fetch` for tests only:

```ts
const ra = createClient({
  portals: { main: 'p1' },
  url: 'https://api.test',
  key: 'test',
  fetch: async () => Response.json({ id: 'o1', name: 'Demo Agency' }),
});
```

```sh
cd sdk && pnpm test    # node --test, no network
cd rest-api && pnpm check    # includes the test that SDK types equal the /v3/public schemas
```

`rest-api/scripts/sites-sdk-smoke.mjs` runs the SDK against a live API; CI
runs it on every branch preview.

## Reference

- REST contract: `rest-api/src/routes/public-schemas.ts`, served as OpenAPI at
  `/v3/openapi.json`.
- Types: [`src/types.ts`](src/types.ts).
- Client: [`src/index.ts`](src/index.ts).
