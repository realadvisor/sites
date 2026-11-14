# @realadvisor/sites-kit-react

The React Router kit for RealAdvisor sites: React Router 7 (framework mode,
SSR) on a Cloudflare Worker, with the same guarantees as the Astro kit
(`@realadvisor/sites-kit-astro`). Both are built on the shared core
(`@realadvisor/sites-kit-core`), which a site installs next to this kit. It
reuses the core for every rule, string and browser script it can (`lib/` format, i18n, legal, search, seo,
image, env, render-error; `client/` enquiry, consent, combobox, listings
search and map; the check:deploy rules; `AGENTS.md` / `DESIGN.md` still
apply) and adds only what React needs. Reference site:
`examples/react/studio-vey`.

| Import | What |
| --- | --- |
| `@realadvisor/sites-kit-react/vite` | `sitesKit({ inlineCss? })`: `virtual:sites-kit/site` (site.json), the site's bundled browser script, `build/client/_headers`, build settings. `inlineCss: true` (opt-in): the Worker inlines each page's built stylesheets as `<style>` (no render-blocking CSS request; style-src already allows it). |
| `…/worker` | `createSiteWorker(build)`: env, 301s, cross-site form check, per-request CSP nonce, full render before answering (500 never a cut 200), 404/410, security headers. |
| `…/entry.server` | `renderToReadableStream` with the nonce, waits for `allReady`. |
| `…/server/data` | `siteClient({ fixture })`: one `SitesClient` (SDK interface), live with SITES_API_URL + SITES_API_KEY, else the fixture. |
| `…/server/kit` | `kitData()` for the root loader (mode, analytics id, Turnstile key, SITE_URL), `canonical(request)`, `pageLocale(request)`. |
| `…/server/enquiry` | `enquiryAction(request, sites)`: the Astro `/api/enquiry` contract, sent through the SDK's `handleEnquiry`. |
| `…/server/seo` | `sitemap(paths)`, `robots()`, `legalPaths()`, `notFound(gone?)`. |
| `…/components/*` | `Document` (`KitProvider`, `KitScripts`, `Seo`, `JsonLd`, `NonceContext`, `usePageLocale`, `useGone`), `SafeHtml` (`sanitized()`), `RaImage`, `EnquiryForm`, `LegalContent`, `ConsentBanner`, `ListingsSearch`, `ListingsMap`, `ListingsPager`, `Island`, `LanguageSwitch`, `form/*`. Same markup, classes and `data-*` hooks as the Astro components. |
| `…/components/PhotoViewer` | A listing's photos: the 1+4 mosaic (or a strip) and a full-screen `<dialog>` viewer (keys, swipe, focus, scroll lock, no-JS list). |
| `…/components/ListingArea` | A listing's approximate area (~1.5 km circle) on the kit's map: locked until «Activer la carte», mounted lazily, static tiles without JS. |
| `…/lib/*` | `records` (`agencyOf`, `price(l, locale)`, `listingRef`), `search` (`searchListings`), `image` (`imgUrl` with crop). |
| `…/client` | `kit()` (loads each browser part only where the page has it), `islands({...})`. |
| `…/styles/*` | `kit.css`: every kit part's CSS (the Astro kit's form.css, search, pager, map, consent, photo-viewer, listing-area), same tokens; or the parts one by one. Import order: see CSS order. |
| `sites-kit-react check deploy` | The deploy gate (`pnpm check:deploy`). |
| `sites-kit-react preview --port N` | `pnpm preview`: build/ on `wrangler dev`, restarted when a new build lands (plain `wrangler dev --config build/server/wrangler.json` keeps serving the build it started with). |

## Scripts and the CSP nonce

Approved for React Router sites only (2026-11-11): a per-request nonce in
`script-src`; everything else is the Astro kit's `lib/security.mjs`.

- The Worker makes 16 random bytes (base64) per request, passes them as
  `loadContext.nonce` and writes `script-src 'self' 'nonce-…' <kit hosts>`
  on HTML responses only. Static files get the kit's headers from
  `build/client/_headers` (no nonce).
- `entry.server` passes it to `renderToReadableStream({ nonce })`,
  `<ServerRouter nonce>` and `NonceContext`; `<KitScripts>` gives it to
  `<Scripts>`, `<ScrollRestoration>` and the site script; `<JsonLd>` too.
- **Static by default.** A route renders HTML plus one bundled module
  (`app/client.ts`: `kit()`, the site's small behaviours, `islands()`); no
  React Router runtime, no inline script. A route that needs full hydration
  exports `handle = { hydrate: true }`: then React Router's scripts render,
  all with the nonce, and `app/entry.client.tsx` imports `./client`.
- **Islands (opt-in)**: `<Island name component props when>` renders a
  component on the server and hydrates it alone; `islands({ Name: () =>
  import(...) })` in app/client.ts loads React (~90 KB) only on a page that
  has one. Use it for real React interactivity only: small behaviours (tabs,
  menus, lightboxes) are plain functions in app/client.ts, as on Astro
  (studio-vey: menu, offer tabs, gallery, ~5 KB). Props are JSON; never
  import server code into an island.
- Pages that the search script updates (`ListingsSearch`) stay static.
- **Bytes, as on Astro.** `kit()` loads each kit part (enquiry, consent,
  combobox, search, map) only on a page that renders it, as its own chunk,
  when the page loads. Vite wraps every dynamic `import()` of the browser
  build in its ~2 KB preload helper (`build.modulePreload: false` does not
  remove it): the kit's plugin replaces it with a ~300-byte one (same
  contract: a chunk's CSS first, its imports preloaded). A page without a kit
  part loads the site chunk only (studio-vey: menu, tabs, gallery); a site
  with no behaviours of its own ships well under 1 KB.

## A site

```
site.json, wrangler.jsonc (main: workers/app.ts), vite.config.ts, react-router.config.ts
workers/app.ts           createSiteWorker(() => import('virtual:react-router/server-build'))
app/entry.server.tsx     export { default, streamTimeout } from '@realadvisor/sites-kit-react/entry.server'
app/root.tsx             loader { kit: await kitData() }, <KitProvider>, <ConsentBanner>, <KitScripts>, ErrorBoundary -> 404/410 page
app/client.ts            kit(); islands({...}); site behaviours
app/lib/data.server.ts   export const sites = siteClient({ fixture })
app/routes/api.enquiry.ts  export const action = ({ request }) => enquiryAction(request, sites)
app/routes/sitemap.ts, robots.ts, legal.tsx, privacy.tsx, 404.tsx (splat)
```

tsconfig `include` lists `node_modules/@realadvisor/sites-kit-react/env.d.ts`.
Rules for loaders: read data only through `sites`, throw `notFound()` (404)
or `notFound(true)` (410), keep loader data to what the page renders.
`dangerouslySetInnerHTML` only with `sanitizeHtml(...)` written inside it, or
`sanitized()` in the loader and `<SafeHtml html={…}>` in the page (check:deploy).

### Recipe: root.tsx

```tsx
import './styles/global.css';                 // 1. the site's CSS first
import '@realadvisor/sites-kit-react/styles/kit.css'; // 2. then the kit's (Astro order)
import { KitProvider, KitScripts, usePageLocale } from '@realadvisor/sites-kit-react/components/Document';
import { ConsentBanner } from '@realadvisor/sites-kit-react/components/ConsentBanner';
import NotFound, { ServerError } from './routes/404';

export function Layout({ children }) {
  const data = useRouteLoaderData('root');
  return (
    <html lang={usePageLocale()}>              {/* the path's language: /fr/… -> fr-CH */}
      <head>…<Meta /><Links /></head>
      <body>
        <KitProvider value={data?.kit}>{children}<ConsentBanner /></KitProvider>
        <KitScripts />
      </body>
    </html>
  );
}
export function ErrorBoundary() {
  const error = useRouteError();
  if (isRouteErrorResponse(error) && (error.status === 404 || error.status === 410)) return <NotFound />;
  return <ServerError />;
}
// routes/404.tsx
export default function NotFound() {
  const gone = useGone();                      // never a prop: React Router drops a route default export's props
  …
}
```

### Languages

A multi-language site lists its locales in site.json (`locales`, the default
first; the others under `/fr/…`, `/en/…`). The page's locale comes from its
path: `usePageLocale()` in components, `pageLocale(request)` in loaders.
`Seo` (og:locale), `ConsentBanner`, `EnquiryForm`, `ListingsSearch`,
`ListingsPager` and `ListingsMap` default to it; `<html lang>` takes
`usePageLocale()`. `searchListings(pool, params, { url: request })` sorts the
facets in the page's language (or pass `locale`).

### Prices and currency

`formatPrice(listing, { locale })` and `price(record, locale)` (lib/records)
write the listing's own `currency` with the page's words ("/ mois", "Price on
request"): the country's currency in the country's form (`CHF 1'250'000`,
`1 250 000 €`), another one in the page language's (`€1,250,000` on an
English page of a Swiss site). `formatAmount(n, { currency, locale })` for a
bare amount. The search's price filter works in one currency (`currency`,
else the one most of the pool is in): amounts are never converted, so a
listing in another currency is left out of a price filter and of the price
steps. An agency with CHF and EUR listings filters in one of them, or leaves
`price` out of `filters`.

### CSS order

Astro writes CSS in import order: a layout that imports its global.css and
then the kit's ConsentBanner (the template, halderhof, clairval…) gets the
kit's form.css after the site's, so the kit wins at equal specificity
(`--control-h: 48px`, `.enquiry form { gap }`); a layout that imports the
kit's components first (quartier-zinnober, ballatoio…) gets the opposite.
The React kit keeps that rule: import `styles/kit.css` once in root.tsx,
**after the site's global CSS** for a new site, or at the place the Astro
layout imports ConsentBanner for a port. The kit's plugin turns the import
into one import per part (no `@import`, which the CSS bundler would hoist to
the top of the bundle), so the rules sit exactly there. Do not restate the
kit's values in a later stylesheet to fix the order: move the import. Theme
the kit with its tokens (`--accent`, `--line`, `--radius-btn`…) or with
selectors scoped to the part (`.enquiry { … }`).

### Images

`RaImage` adds an AVIF `<source>` (and so a `<picture>`) to the `priority`
image only, as the Astro kit: a lazy photo is a plain `<img>`, so CSS that
sizes `.card > img` holds. `avif` forces it either way. `data-*` attributes
go on the `<img>` (`data-hero`).

### Loader data and the client chunk

Loaders run on the server only. A page component that imports a fixture or
a data helper, though, compiles it (the whole fixture JSON) into the route's
client chunk, which `check:deploy`'s secret scan reads and a hydrated route
downloads. Read fixture-only fields (the API does not have them yet) in the
loader and pass them as an `extras` object:

```ts
// routes/listing.tsx
export async function loader({ params }) {
  const listing = await sites.listing(params.slug);
  if (!listing) throw notFound(true);
  return { listing, extras: listingExtras(listing.id) }; // fixture only: energy class, year built
}
```

Never import `app/data/fixture.json` or `*.server.ts` into a component.

### Porting an Astro site

- **Whitespace**: JSX drops the line break between inline elements that
  Astro keeps as a space: `<strong>{n}</strong>{' '}<span>rooms</span>`.
  Compare the text, not only the screenshot.
- **Specificity**: Astro's scoped styles (`.card[data-astro-cid-x]`) beat the
  global CSS that the port turns them into. Scope a page's styles by a page
  class on `<main>` (`.page-listing .facts { … }`) instead of raising
  selectors one by one.
- **CSS order**: kit.css where the Astro layout imports the kit's
  components (above); a port does not restate the kit's values.
- **404 / 410**: `useGone()` in the 404 page (above).
- **Images**: `RaImage` = Astro's (AVIF on the priority image only, `data-*`).

## check:deploy

`pnpm check:deploy` builds, serves `build/` with wrangler and runs the Astro
kit's rules (imported from `kit/tools/check-deploy.mjs`) on one page
of every route in the sitemap, the map view of every search page, legal
pages and three missing pages, plus: one nonce per response, new per
request, on every `<script>`, CSP otherwise equal to the kit's, `_headers`
on static files, the enquiry endpoint contract, `dangerouslySetInnerHTML`
in `app/`, secrets in `build/`. The browser tools of the Astro kit work on a
running React site: `sites-kit screenshot --url …`, `sites-kit test map --url … --path /kaufen`.

## Develop

`pnpm preview` (`sites-kit-react preview`) restarts wrangler on each `pnpm
build`; a site still on `wrangler dev --config build/server/wrangler.json`
must be restarted by hand after a build.

Sites install the kit as `file:../../kit-react` (pnpm hard-links it): run
`pnpm install` in the site after adding a file to the kit.
