# Changelog

The SDK, kit-core, kit-astro and kit-react are released together, one version
for all four. This file ships inside `@realadvisor-sites/kit-core`, so a site
reads it at `node_modules/@realadvisor/sites-kit-core/CHANGELOG.md`.

Each version has an entry. An `### Upgrade` section lists what a site must
change when it moves to that version. When there is no Upgrade section, bumping
the versions is enough.

To upgrade a site, read every entry newer than the site's current version,
oldest first, and apply each Upgrade step in order.

## Unreleased

- The packages now ship the rules and critic files the sites read. Sites
  install the published kit, and until now it left out `kit-core/TASTE.md`,
  `kit-core/critic/` (so `sites-kit critic` failed), `kit-react/AGENTS.md` and
  `kit-astro/AGENTS.md`, all of which the starters' `CLAUDE.md` imports. A
  kit-core test now fails when a starter imports, or a kit tool reads, a file
  its package does not ship.
- ListingsSearch (both kits): the result cards no longer set
  `content-visibility: auto`. It implies paint containment, which clipped any
  ink outside a card (an italic price's last glyph, focus rings, shadows) and
  stopped cards from using `grid-template-rows: subgrid`. A page shows at most
  24 cards, so little layout was saved. `--rs-card-h` is no longer used.
- `sites-kit screenshot` also shoots 1024x768 and 1800x1100 (`@1024`,
  `@1800`; 1440 and 390 unchanged) and, on a page with the listing search, its
  map view at 1440 and 1800 (`@1440-map`, `@1800-map`). Two new checks run at
  every width and on the map view, and fail the command like the others:
  `clipped text` (text whose ink, italic overhang included, is cut by an
  ancestor that clips: overflow, `contain: paint`, `content-visibility: auto`,
  clip-path; line-clamp, ellipsis, visually hidden text and scrollers are
  skipped) and `cards in one row not aligned` (heading, divider, price or last
  line more than 4px apart across cards side by side).

- kit-react: the dev server now serves the kit's CSS. `import '…/styles/kit.css'`
  in root.tsx reached no dev page (React Router collects a page's CSS without
  loading modules, and the virtual module's imports were never found), so forms,
  search, pager, map and consent were unstyled in every dev preview. The Vite
  plugin now rewrites that import into the kit's CSS parts, in order.
- `sites-kit screenshot`: a page with an SVG link no longer crashes the crawl,
  and the card-row check compares a price only when a card has one (a named
  price, or a single currency text), not in unit tables or stacking plans.
- kit-core: four display helpers for CRM data, framework-neutral, each a part
  (`@realadvisor/sites-kit-core/<part>`, AGENTS.md section 2) with tests:
  `title` (`cleanTitle(title, locale, { places, max })`: a leading
  "EN EXCLUSIVITÉ :"-style marker becomes an `exclusive` flag, shouting caps
  and Title Case become sentence case with acronyms and places kept, m2 → m²,
  " - " → " – ", French spacing, a long title stops at its first strong
  separator; words are never added, spelling never corrected), `typo`
  (`typo`, `typoHtml`: curly apostrophes, the language's quotation marks and
  spaces), `photos` (`pickPhoto(listing, 'card' | 'hero', { overrides })`
  skips floor plans and labelled or bannered photos, a hero prefers an
  exterior; `lotPhotos(listings)` keeps one image from showing twice side by
  side; `photoKey`, `isLabelledPhoto`) and `market` (`marketListings(listings,
  { currency, countries, sort })`, `sortByPrice` that never compares two
  currencies, `byCurrency`).
- AGENTS.md: listing titles, texts and photos go through those helpers;
  "brief truth" (no headcount, offices, years, reviews or ratings without a
  source; stock photos captioned and never shown as a property or the office);
  seller-first agency sites keep the valuation call to action, marked
  `data-primary-cta`, on the first screen at 1440x900, 1024x768, 768x1024 and
  390x844, and the valuation form in the sell page's hero; listing pages have a
  photo viewer and an approximate-area map (the kits' `PhotoViewer` and
  `ListingArea`); a `/credits` page for stock photos. DESIGN.md: card rules
  (fixed line counts, subgrid or a bottom-pinned price, italic numbers padded),
  image weight (srcset, lazy below the fold, one priority hero, at most about
  2x the drawn size), the stock dose, and a new section 12 (motifs only on flat
  grounds; drawn maps from Natural Earth or swisstopo, credited).
- `sites-kit screenshot`: three more checks, which fail the command like the
  others. `primary CTA not on the first screen` (a page with
  `[data-primary-cta]` whose shown CTA ends below the screen at 1440x900,
  1024x768, 768x1024 or 390x844, with the measured y), `repeated image in a
  row` / `in a grid` (the same image, size parameters ignored, in two cards
  side by side or three cards of one grid) and `decorative line or motif over
  a photo` (an aria-hidden SVG or `[data-motif]`, 64px or more, lying more
  than 20% on a photo, unless an opaque panel between them is its ground).
- Critic: a Distinctiveness score /10 ("would this pass for another agency's
  site or for the example it started from? does the signature feel owned?")
  and an Overall score /10, fixes marked MUST or SHOULD, and a checklist
  (motif over photos, crude maps, generic stock dose, sellers first on the
  home, facts without a source, repeated photos, raw titles, zoom into prices
  and italics). The stop rule: overall >= 8.5, distinctiveness >= 7.5 and no
  MUST open (`stopProblems` in `tools/critic-calibrate.mjs`; calibration cases
  can expect `overall` and `distinctiveness`).
- Examples: listing, agent, document and type cards in every example keep their
  rows aligned (fixed line counts for eyebrow and title, subgrid where the
  markup allows), and the stacking plans keep their unit labels whole on phones.

## 0.5.1

- kit-react: the dev server can always be framed by the CRM preview, whatever
  `SITE_MODE` says. The CRM sandbox runs dev with `SITE_MODE=production` (so
  preview enquiries send), which made the React kit send
  `X-Frame-Options: DENY` and the preview stayed blank. Published sites keep
  their headers unchanged.

## 0.5.0

- React Router is the default: `template/` is now a React Router 7 starter,
  the Astro starter moved to `template-astro/`.
- The rules split in three: `kit-core/AGENTS.md` (every site),
  `kit-react/AGENTS.md` and `kit-astro/AGENTS.md` (the framework).
- Taste judge: `kit-core/TASTE.md` (13-line rubric against the chosen
  example), `kit-core/critic/CRITIC.md` and `sites-kit critic` (inputs for a
  separate critic), `sites-kit critic calibrate`, and `taste:` checks in
  `pnpm screenshot` (header height, logo by shape, saturated fields, accent
  hues, line length, body size, soft photos, lede styles, font families,
  grid).
- Logo size by shape: a tall or square mark is 40–72px tall; a wide
  wordmark keeps the 100px minimum width, at most 72px tall.
- kit-react: `RaImage` preloads with a hoisted `<link>` (no `react-dom`
  import, which the dev server loaded as raw CommonJS); dev-only preview
  bridge through `SITES_PREVIEW_BRIDGE`.
- `sites-kit fixture` writes `app/data/fixture.json` on a React Router site.

### Upgrade

1. Astro site: in `CLAUDE.md`, after the line
   `@node_modules/@realadvisor/sites-kit-core/AGENTS.md`, add
   `@node_modules/@realadvisor/sites-kit-astro/AGENTS.md`; after
   `@node_modules/@realadvisor/sites-kit-core/DESIGN.md`, add
   `@node_modules/@realadvisor/sites-kit-core/TASTE.md`.
2. React Router site: in `CLAUDE.md`, after the line
   `@node_modules/@realadvisor/sites-kit-core/AGENTS.md`, add
   `@node_modules/@realadvisor/sites-kit-react/AGENTS.md` (when missing);
   after `@node_modules/@realadvisor/sites-kit-core/DESIGN.md`, add
   `@node_modules/@realadvisor/sites-kit-core/TASTE.md`.
3. Run `pnpm screenshot` and fix any new `taste:` line, or name the reason
   to keep it in `DESIGN-NOTES.md`.

## 0.4.2

- This changelog, shipped in kit-core.

## 0.4.1

- First release through the Publish workflow: staged on npm with provenance,
  approved by a maintainer with 2FA.
- `bin` paths without `./`.

## 0.4.0

- The kit is split into `kit-core` (framework-neutral) and `kit-astro` (the
  Astro integration). `@realadvisor-sites/kit` is deprecated.

### Upgrade

1. In `package.json`, replace `@realadvisor/sites-kit` with two packages, both at
   the same version as the SDK:
   ```json
   "@realadvisor/sites-kit-core": "npm:@realadvisor-sites/kit-core@0.4.0",
   "@realadvisor/sites-kit-astro": "npm:@realadvisor-sites/kit-astro@0.4.0"
   ```
2. Rename the imports. `@realadvisor/sites-kit/astro`, `/middleware`, `/ra` and
   `/components/*` move to `@realadvisor/sites-kit-astro/...`. Every other
   `@realadvisor/sites-kit/<x>` becomes `@realadvisor/sites-kit-core/<x>`.
3. In `CLAUDE.md`, load the rules from
   `node_modules/@realadvisor/sites-kit-core/AGENTS.md`.

## 0.3.0

- First version on npm.

### Upgrade

For a site that depends on the kit by path (`file:../kit`, from the monorepo
before `realadvisor/sites`):

1. Pin the published packages instead of `file:` paths (see 0.4.0 for the
   names).
2. SDK fields are snake_case: `first_name`, `property_type`, and so on, not
   `firstName`, `propertyType`.
3. A list is `{ data, pagination }`. Read `page.data` instead of `page.items`,
   and `page.pagination.total` instead of `page.total`.
