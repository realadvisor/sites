# AGENTS.md — how to build a RealAdvisor agency site

You are building the public website of one real estate agency, deployed as
a Cloudflare Worker. The site is a **React Router 7** site (`app/`,
`react-router.config.ts`: the default) or an **Astro 5** site (`src/`,
`astro.config.mjs`); look at the site root and keep the framework it has.
Never convert a site to the other framework unless the user asks.

Three files tell you how to build it. Read all three before you write markup:

- this file: the rules every site follows, whatever the framework;
- your kit's `AGENTS.md`: the files, imports, commands and code of your
  framework (`node_modules/@realadvisor/sites-kit-react/AGENTS.md` or
  `node_modules/@realadvisor/sites-kit-astro/AGENTS.md`). Where this file
  says "your kit", it means that one;
- `DESIGN.md`: the design half of the job.

The shared kit (`DESIGN.md`, `fixtures/`, the sources) is in
`node_modules/@realadvisor/sites-kit-core/`. Twelve finished example sites
are in `/vercel/sandbox/examples`, each built twice, in `react/<name>` and
`astro/<name>` (start with its `README.md`): read the version in your
framework, adapt its code, never copy its data or text.

The bar: the agency owner opens the site on desktop and phone and believes a
good studio built it, with their real listings, real agents and a contact
form that lands in their CRM. Nothing is placeholder. Nothing is broken.

You work alone and nobody will answer questions. Make reasonable decisions,
finish the whole site and verify it yourself (section 10).

**You are free to write any code.** The kit gives you the platform (data,
the Worker, security headers, the deploy gate) and a few ready parts
(listings search and map, enquiry form, legal pages, images). The rules
below that say MUST are about data, law, security and enquiries; everything
else (layout, components, sections, interactions) is yours to build.

## How to work fast (every request)

- **Small, local change** (text, a colour, a size, one element): read only
  the file(s) you need in one batch, edit them, and stop. No `pnpm check`,
  no screenshots unless layout changed (`pnpm screenshot -- <path>`). The
  preview reloads by itself, and `pnpm check:deploy` runs at every publish.
  Reply in one short sentence.
- Put independent Reads, Globs and Greps in one message; do not re-read a
  file you just edited.

## 0. Progress the agent sees

Your todo list (TodoWrite) is what the real estate agent sees in the CRM:
3 to 8 steps they understand ("Build the home page" / "Building the home
page"), no file names, commands or technical words, exactly one item
`in_progress`. First build: Reading your agency and listings; (Looking at
your current website); Choosing a design that fits your brand; Building the
home page; Building listing and search pages; Connecting the contact form
to your CRM; Checking mobile; Final checks.

## 1. Brand discovery (first build only)

When `agency.website` is set (or the run names an existing site), look at
its home page once: `pnpm screenshot -- --url <site> --out reference /`
(1440 and 390 PNGs), or read it with curl / WebFetch. GET only: never
submit its forms. If it is unreachable, do not retry; use `agency.logo` and
`agency.brand` from the CRM.

Write `BRAND.md` at the site root: logo file, brand colours (hex), fonts,
tone. Save the logo (the best version: SVG, else the largest PNG, else
`agency.logo`) to `public/brand/`. Take short phrases from their site at
most; never copy paragraphs, HTML, CSS or JS, never hotlink their images,
and never take listings, people or numbers from it: those come from the
data client (section 3).

## 2. Project layout

The site holds only its own files; shared code is in the packages
`@realadvisor/sites-kit-core` (both frameworks), `@realadvisor/sites-kit-react`
or `@realadvisor/sites-kit-astro` (your kit) and `@realadvisor/sites-sdk`
(the data types). Import their parts, never copy them. To change how a kit
component looks, theme it (tokens, props, classes); if a page needs a
different version, copy that one component into the site and own it.

`site.json` (country, locale, locales, developmentsPath, redirects as 301s)
is the same in both frameworks: set it first. Your kit's `AGENTS.md` lists
the other files, the imports and the commands.

Shared parts (`@realadvisor/sites-kit-core/<part>`):

```
agency                  agencyOf(organisation, team): the agency record of legal, JSON-LD and footer.
env                     Worker env per request (SITE_MODE, data API, ANALYTICS_ID). Set by the kit's Worker.
i18n                    Strings (form, legal, consent, map, labels) in de/fr/it/es/en; t(), count(), *Label(), legalPath().
legal                   Legal notice and privacy text from agency data.
format                  formatPrice, formatSurface, formatAmount, listingUrl, LOCALE.
image                   img() / srcset(): resized photo URLs (for og:image, logo, <picture>).
search                  parseSearch, searchHref: the state behind the listings search.
seo                     canonicalUrl, safeJsonLd, agencyJsonLd, listingJsonLd, listingTitle, listingRef.
developments            Unit labels, prices, status, options and URLs for development pages (section 9).
security                Allowed hosts and security headers. There is no way to add hosts.
```

Ready parts in both kits, same names, markup, classes and `data-*` hooks:
`ListingsSearch` (with `ListingsMap`, `ListingsPager`), `EnquiryForm`,
`RaImage`, `LegalContent`, `ConsentBanner`, `form/*` (`Input`, `Select`,
`Combobox`, `Button`).

Plain CSS: one global file with the tokens, plus one stylesheet per
component or page. No Tailwind, CSS-in-JS, Vue, Svelte or UI kits; add a
dependency only when you truly need one (`@fontsource/*` fonts are fine).

| Command | What |
| --- | --- |
| `pnpm dev` | Dev server on http://localhost:4321 |
| `pnpm check` | Types + production build. Must pass. |
| `pnpm screenshot` | Every route at 1440 and 390, a contact sheet and a problem report (your eyes) |
| `pnpm fixture <name>` | Switch the sample data (the fixture) |
| `pnpm kit test map` | Browser test of the listings map against a running site |
| `pnpm check:deploy` | The safety gate publish runs: security headers, hosts, forms, scripts, iframes, unsafe HTML, 404s, legal links. A FAIL blocks publishing. |

## 3. Data: only through the data client

The site has one data client, server side: `sites` (React Router,
`app/lib/data.server.ts`) or `ra` (Astro, `@realadvisor/sites-kit-astro/ra`).
Both have the SDK's methods (your kit's `AGENTS.md` shows the calls):

```ts
organisation(), teams(), agents()       // whose site this is (the template's agency() combines them)
listings({ offer_type: 'buy', status: 'available', limit: 24, offset: 0 })  // { data, pagination }
allListings(q)                          // every page of listings(q)
listing(slugOrId)                       // or null
developments()                          // without units
development(idOrSlug)                   // with units, or null
```

Field reference (the API's snake_case): `node_modules/@realadvisor/sites-sdk/src/types.ts`.

Where data comes from (you never configure it): production uses
`SITES_API_URL` + `SITES_API_KEY`, set at publish (live, cached 60 s by the
RealAdvisor API); the CRM preview uses the same two from `.dev.vars` (a
placeholder key: never print, log or send it anywhere else); everything
else reads the fixture (`pnpm dev`, `pnpm check` copy the CRM's data or the
kit's Demo Agency there when it is empty): `app/data/fixture.json` on
React Router, `src/data/` on Astro.

Rules:

- Read data **only** through the data client, server side (React Router:
  loaders; Astro: page frontmatter). Never `fetch` the API yourself, never
  read the fixture file directly, never import the data client into
  browser code, never hardcode listings, prices, names, phones or emails.
  The same code must work on live data with different listings.
- `listings()` returns at most 200 items; `allListings(q)` pages for you
  (search, sitemap, agent pages).
- Listings and units carry the CRM's facts (energy class, year built,
  outdoor surfaces, floor, orientation, charges, parkings, move-in date,
  ...; sdk/README.md lists them) and developments their developer,
  architect and general contractor: read them from the record. Show codes
  (`heating`, `orientation`, `minergie`) in words.
- **Every optional field can be missing**: render nothing (not "undefined",
  "NaN", "0" or an empty box). `photos` and `features` are arrays but may
  be empty: `l.photos[0]?.url`, and a neutral tile when there is no photo.
  One unguarded listing breaks every page that lists it.
- **HTML from data** (`description` of listings, developments and units):
  the SDK already sanitized it (markdown converted). Render it only the
  way your kit's `AGENTS.md` shows (React Router: `<SafeHtml>`; Astro:
  `set:html={sanitizeHtml(...)}`); any other raw HTML with data fails
  check:deploy. For cards and meta descriptions use `description_text`
  (plain), clamped with CSS. Never strip tags yourself.
- Codes are never shown: `propertyTypeLabel`, `offerTypeLabel`,
  `featureLabel` from `i18n`; the reference is `listingRef(listing)`, never
  `listing.id`; prices `formatPrice(l)` (hidden and on-request included).
- **Words match the query**: a heading that says "for sale" comes from an
  `offer_type: 'buy'` query with that query's `pagination.total`. A live site can have
  only rentals, only sales or nothing: drop or switch a section that would
  be empty; never "See all 0 properties".
- **Whose site this is: the organisation, its teams and its agents from
  the data client, nothing else.**
  Never take the agency's name or contacts from a listing, a development,
  another site or memory. When the data is the kit's fictional Demo Agency
  (example.com emails, +41 00 000 00 0x), build on it as it is and say so.
- **Never invent data**: no testimonials, awards, years, rankings, "#1",
  percentages, client counts or fake agents. Copy comes from the data.

## 4. Rendering and errors

- Pages that show listings, agents, developments or a form render on
  request, never at build time: no `Cache-Control` headers, no static
  paths for listings (your kit's `AGENTS.md` says how).
- Unknown listing or development: a real 404 (410 for a listing that left)
  with the site's 404 page. Keep the not-found code of the template's
  listing page. check:deploy requests missing pages.
- A page that throws answers a logged 500 (the kit's Worker), never an
  empty 200.

## 5. Pages and legal

Every agency site has, linked from the header or footer: `/` (home),
`/listings` (search), `/listings/[slug]` (listing: photos, price, facts,
description, agent, enquiry form), `/team` (agents with `tel:` and
`mailto:`), `/contact` (address, phone, email, enquiry form), `/legal`,
`/privacy`, `/404`, and `/developments` + `/developments/[slug]` when
`developments()` is not empty (no developments: do not link it).

**Legal: never write your own text.** No invented company numbers, VAT or
register entries, disclaimers, cookie lists or terms. `/legal` and
`/privacy` show what `@realadvisor/sites-kit-core/legal` builds from the agency
data, through `LegalContent`; wrap them in your layout and restyle, never
change the words. A missing number stays missing (the agency completes it
in the CRM). The footer of every page links `/legal` and `/privacy` with
`t('legalNotice')` and `t('privacyPolicy')` (multi-language:
`legalPath(locale)`, `privacyPath(locale)` and labels in that language;
check:deploy fails a page linking another language's legal page).

Cookies and analytics: the site sets no cookies of its own and loads no
analytics, tag manager, chat or tracking script. Analytics is a RealAdvisor
setting (`ANALYTICS_ID`) and loads only after consent, through
`ConsentBanner` (the template's document shell renders it). Keep it; never
write your own banner.

## 6. Enquiries

**Every form that sends a message to the agency MUST be the kit's
`EnquiryForm`.** Never another form, a third-party form service or
`mailto:` as a form: check:deploy fails them and publish deploys nothing.
Your kit's `AGENTS.md` shows the calls; the props are the same in both:

- `id`, `listingId`, `agentId`, `agentName`, `contactReason` (`buy` |
  `sell` | `valuation` | `other`), `message`, `developmentId`, `lotId`,
  `units`, `selectedUnit`, `submitLabel`, `locale`, a class. A listing page
  passes `listingId`, `agentId`, `agentName` and
  `message={t('interested', { title, ref: listingRef(listing) })}`; a
  contact page `contactReason="other"`; a second form on one page its own
  `id`.
- A development enquiry always passes `developmentId`, plus `lotId` or the
  required `units` select (`unitOptions(dev.units)`, `selectedUnit` from
  `?lot=`; check:deploy fails a development form without them). Never a
  plain form with the development's name in the message.
- It already validates, posts to `/api/enquiry`, works without JS, carries
  Turnstile bot protection (never add another captcha or a honeypot) and
  links the privacy page. Preview sites never send ("Preview: not sent"):
  that is expected. Keep the site's `/api/enquiry` route as it is.
- Style it with the form tokens (DESIGN.md); never change its fields or
  script.

The `form/*` controls (`Input`, `Select`, `Combobox`, `Button`) share one
height and focus style through tokens (`--control-h`, `--radius-btn`,
`--line`, `--accent`). Use them or your own controls; keep labels
accessible either way.

## 7. Listings search and map

`/listings` renders `ListingsSearch` over one pool (`allListings()`) and
the search state (`parseSearch` of the URL); the template's listings page
is the wiring, your kit's `AGENTS.md` the code.

It is the whole search: GET filters that work without JS, chips, count,
sort, list and map views (`?view=map`, moving the map filters by `?bbox=`),
pagination, sold listings, empty states. Pass your own card as its child
(a render function of the listing and its index); theme it with its tokens
(`--accent`, `--text`, `--surface`, `--line`, `--rs-columns`, ...: the list
is in the component's header). Props: `result`, `base` (a renamed path such
as `/proprietes`), `locale`, `contactHref`, `valuationHref`, `tellUsHref`,
`listingHref`, `price`, `filters`, `sold`, `empty`. The page owns the `h1`
(with `data-rs-sync="h1"`) and title, built from every active filter
(section 8).

You may build another search, but keep its URLs GET and crawlable, its
counts true and its empty states real. For any listings map use
`ListingsMap` (OSM tiles, no library): never Leaflet, Mapbox, MapLibre,
Google Maps JS or a map iframe (the CSP blocks them). For one address, a
link to Google Maps / OpenStreetMap or your own static tile image is fine.
After changing the search or map, run `pnpm kit test map` against
`pnpm dev`.

## 8. SEO, routes and i18n

- Every page goes through the site layout with `title`, `description` and
  `image` (`img(url, { w: 1200, h: 630 })` of the page's main photo); the
  layout writes canonical, OG and JSON-LD (`jsonLd`, escaped by
  `safeJsonLd`) with the kit's SEO part (your kit's `AGENTS.md`).
- Titles are unique on every URL, filtered and paged ones included: build
  title, `h1` and description from every active filter ("Mieten in Morges
  – Seite 2 | Demo Agency"). Listing pages:
  `` `${listingTitle(listing, sameCity)} | ${formatPrice(listing)}` ``.
- One `<h1>` per page, headings in order, `alt` on every image (from the
  data; `alt=""` only for decoration). Listing pages pass
  `listingJsonLd`, home and contact `agencyJsonLd`.
- Add every new route to `STATIC_PATHS` in the sitemap route. Internal
  links are real `<a href>`.
- A redesign of an agency that already has a site keeps its main URL paths
  working: rename routes to match or add 301s in `redirects` in site.json.
- Language: the agency's (from `agency.address.country` and the agents'
  languages); set `locale` and `country` in site.json. Format every number
  with `format`; counts with `count(key, n)`; a number and its label are
  separate words.
- Multi-language sites (only when asked): one URL per language
  (`/fr/...`, `/de/...`), `locales` in site.json (default first), every
  page passes `alternates` (all versions) to the layout, and the legal pages
  exist per language (the template's `:lang` / `[lang]` routes). The data
  client then reads listing and unit texts in the page's language by itself
  (the CRM's translations, else the original): put `lang={l.text_locale}`
  on the element that shows them.

## 9. One-development site

When the run names one development (its id and title), the whole site is
that development; the agency markets it.

- Load it by the id from the prompt: one constant
  (`export const DEVELOPMENT_ID = '<id>'`) and
  `development(DEVELOPMENT_ID)` on every page. Never `developments()[0]`,
  never a slug guessed from the name.
- Pages: `/` (the development), `/lots/[id]` (one unit; `noindex` when
  sold), `/contact` (enquiry form with `developmentId` and the unit select,
  the broker), `/legal`, `/privacy`, `/404`, `/sitemap.xml` (`/`,
  `/contact`, legal pages, every unit not sold). Delete the template's
  listings and developments routes and their links; keep `/api/enquiry`.
- Helpers from `@realadvisor/sites-kit-core/developments`: `sortUnits`,
  `unitLabel`, `unitPrice` (sold and reserved units never show a price),
  `unitStatusLabel`, `unitOptions` (for EnquiryForm), `unitEnquiryUrl`,
  `formatRooms`, `formatFloor`, `developmentStatus`, `priceFrom`,
  `unitListingUrl`. Write the gallery, unit table and other components
  yourself.
- Units have no lot numbers: identify a unit by rooms, floor and surface.
  Facts the CRM lacks (architect, milestones, places nearby) come only from
  the user's message; a section without data is left out, never shown
  empty. No urgency claims ("only 2 left").
- The agency of a development is the site's organisation and team (the
  template's `agency()`). Sample data:
  `pnpm fixture development-residence-exemple`.

An agency site's development pages use the same helpers and the same
enquiry rules.

## 10. Self-check (first build, new page or layout change)

Build every page first, then check once, fix once, confirm. About 12
minutes for a new site.

1. `pnpm check` exits 0.
2. `pnpm screenshot` once: fix every problem it prints (console errors,
   failed requests, broken images, HTTP errors, overflow at 390, image
   ratio and resolution, controls, clicks blocked by an invisible overlay).
   Read `screenshots/contact-sheet.png` once; at most 3
   `screenshots/sheet-<route>.png` for detail.
3. Judge the screenshots for taste with `TASTE.md` (next to this file):
   the ten rubric lines against the chosen style's screenshots, and every
   `taste:` line `pnpm screenshot` printed. Fix what scores under 2.
4. One fix round, then `pnpm check` and `pnpm screenshot -- <changed paths>`
   once more.
5. `pnpm check:deploy` once: a FAIL means the site cannot be published.
6. Run `git diff --stat` and name the files you changed; never claim a fix
   you did not make. Finish with a short summary: pages built, design
   direction, anything you could not do.

## 11. Do not

- Commit secrets, add `.env` values, or put any key in browser code; add a
  service binding, secret or API key (publish sets `SITES_API_URL` and
  `SITES_API_KEY`).
- Weaken the security headers: no new hosts, no `unsafe-eval`, no
  `'unsafe-inline'` in script-src; keep the kit's plugin or integration in
  the build config.
- Inline scripts or `on*=` attributes: browser code is one bundled script
  (your kit's `AGENTS.md`). No iframes, frames, embeds or objects.
- Load anything from hosts outside the kit's `security` list: photos go
  through `RaImage` / `img()` (never an original photo URL in `src`), fonts
  are self-hosted (`@fontsource/*`), no CDNs.
- Raw HTML from data other than the kit's sanitized way (section 3) and
  JSON-LD through the kit.
- Copy the kit's data client, `env`, `legal`, the Worker or `EnquiryForm`
  into the site; change the `/api/enquiry` route or `wrangler.jsonc` unless
  something is broken; touch the CRM preview's injected scripts.
- Deploy, push, or call external services (RealAdvisor publishes), or leave
  wiring-example markup and placeholder labels.
