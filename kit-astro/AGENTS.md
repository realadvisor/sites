# AGENTS.md (Astro): the files, imports and code of an Astro site

The framework half of the rules. The shared rules are in
`node_modules/@realadvisor/sites-kit-core/AGENTS.md` (read it first), the
design in `DESIGN.md` next to it. This file shows how an Astro 5 site on a
Cloudflare Worker does what they ask. Reference sites:
`examples/astro/<name>`.

## Files

```
site.json               country, locale, locales, developmentsPath, redirects (301s). Set it first.
astro.config.mjs        cloudflare() + sitesKit(). Keep sitesKit() in integrations.
wrangler.jsonc          Worker config. No secrets here.
src/layouts/Base.astro  <head>: title, description, canonical, hreflang, OG, JSON-LD; consent banner.
src/pages/              Routes. The pages are bare wiring examples: replace their markup.
src/pages/api/enquiry.ts  POST endpoint behind EnquiryForm. Keep it.
src/pages/legal.astro, privacy.astro, [lang]/  Legal notice and privacy policy. Keep the content.
src/pages/sitemap.xml.ts, robots.txt.ts  Keep; add new static pages to STATIC_PATHS.
src/data/*.json         Fixture data (dev, build time). Production reads live data.
```

Kit parts (`@realadvisor/sites-kit-astro/<part>`):

```
ra                      THE data client.
components/ListingsSearch.astro  /listings: filters, chips, count, sort, list/map, pagination, empty states.
components/ListingsMap.astro, ListingsPager.astro  The listings map (no library) and pager; ListingsSearch wires both.
components/EnquiryForm.astro  THE enquiry form.
components/PhotoViewer.astro  A listing's photos: gallery and full-screen viewer.
components/ListingArea.astro  A listing's approximate area on the kit's map.
components/RaImage.astro  Photos: resized, srcset, sizes, lazy, `priority` for the LCP image.
components/LegalContent.astro  Body of the legal pages.
components/ConsentBanner.astro  Analytics consent; Base renders it when ANALYTICS_ID is set.
components/form/        Input, Select, Combobox, Button (styles/form.css).
```

Imports: `import { ra } from '@realadvisor/sites-kit-astro/ra'`,
`import RaImage from '@realadvisor/sites-kit-astro/components/RaImage.astro'`,
`import type { Listing } from '@realadvisor/sites-kit-core'`.

Plain CSS: scoped `<style>` plus one global file with tokens. No React,
Vue or Svelte components in an Astro site. `pnpm check` is `astro check` +
production build.

## Data

```ts
import { ra, allListings } from '@realadvisor/sites-kit-astro/ra';
const agency = await ra.agency();       // name, logo, phone, email, address, brand, socials, description, legal
const agents = await ra.agents();
const { data, pagination } = await ra.listings({ offer_type: 'buy', status: 'available', limit: 24, offset: 0 });
const listing = await ra.listing(slugOrId);   // or null
const devs = await ra.developments();         // without units
const dev = await ra.development(idOrSlug);   // with units, or null
```

A `development-<slug>.json` in `src/data/` adds its development to
`ra.developments()`. Never import `ra` in a client `<script>`.

HTML from data: `<div class="prose" set:html={sanitizeHtml(listing.description)} />`
(`sanitizeHtml` from `@realadvisor/sites-kit-core`). Any other `set:html`
with data fails check:deploy.

## Rendering and errors

- Pages that show listings, agents, developments or a form set
  `export const prerender = false;`; static text pages may stay
  prerendered. No `getStaticPaths` for listings.
- Unknown listing or development: keep the not-found block of
  `src/pages/listings/[slug].astro` (`Astro.rewrite('/404')`, 410 for a
  listing that left); `src/pages/404.astro` stays `prerender = false`.

## Enquiries

```astro
<EnquiryForm listingId={listing.id} agentId={listing.agent?.id} agentName={listing.agent?.first_name}
  message={t('interested', { title: listing.title, ref: listingRef(listing) })} />
<EnquiryForm contactReason="other" />                     <!-- contact page -->
<EnquiryForm id="valuation" contactReason="valuation" />  <!-- a second form: its own id -->
<EnquiryForm developmentId={dev.id} units={unitOptions(dev.units)} selectedUnit={lotFromUrl} />
<EnquiryForm developmentId={dev.id} lotId={unit.id} />    <!-- one unit -->
```

Its page renders on request.

## Listings search

```astro
const params = parseSearch(Astro.url.searchParams);
const result = runSearch(await allListings(), params, { locale: LOCALE });
<h1 data-rs-sync="h1">{heading}</h1>
<ListingsSearch result={result} contactHref="/contact" valuationHref="/contact#valuation">
  {(l, i) => <ListingCard listing={l} priority={i === 0} />}
</ListingsSearch>
```

(`runSearch` from `@realadvisor/sites-kit-core/search`; the card is the
default slot, `empty` a named slot.)

## A listing page's must-haves

A listing page has PhotoViewer and ListingArea:

```astro
<PhotoViewer photos={listing.photos} alt={`${typeLabel}, ${city}`} />   <!-- layout="strip", locale, labels -->
{listing.address.lat != null && listing.address.lng != null && (
  <ListingArea lat={listing.address.lat} lng={listing.address.lng} />   <!-- zoom, radius, locale, labels -->
)}
```

- **PhotoViewer**: the gallery (`layout="1+4"` mosaic, a swipe strip on the
  phone; or `"strip"`) and a full-screen viewer on a native `<dialog>`
  (every photo whole, "3 / 13", prev / next, ← → Home End, Escape, swipe,
  focus back to the tile, page scroll locked). Without JavaScript the
  tiles link to a `<noscript>` photo list. `alt`: a string ("<alt>, Photo
  3") or `(i) => string`; a photo's own `alt` wins. Theme it with
  `--pv-ratio`, `--pv-gap`, `--pv-bg`, `--pv-tile-bg`.
- **ListingArea**: the approximate area (a ~1.5 km circle at town zoom,
  never a pin) on the kit's map, locked until the visitor taps «Activer la
  carte», mounted when near the screen, a static tile map without
  JavaScript, the © OpenStreetMap credit and an "Open in OpenStreetMap"
  link. Height `--la-h`; circle `--la-fill`, `--la-line`.
- Both take `locale` (default: the site's) and `labels` (any string
  overridden), and bring their own script and CSS. Do not write your own
  gallery, lightbox or location map.

## SEO and languages

Every page uses `Base` (directly or through your layout) with `title`,
`description`, `image` and `jsonLd`. Multi-language sites: every page
passes `alternates` and `locale` to `Base`; legal pages per language in
`src/pages/[lang]/`.

## Scripts

Plain `<script>` only (bundled by Astro). Never `is:inline` with a body,
`define:vars` or `on*=` attributes (the CSP is `script-src 'self'`: no
nonce, no hashes on Astro sites); never `client:*` directives.

## Do not (Astro)

- Remove `sitesKit()` from astro.config.mjs.
- Copy the kit's `ra`, the middleware or `EnquiryForm.astro` into the site;
  change `src/pages/api/enquiry.ts`.
