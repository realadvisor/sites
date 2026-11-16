# DESIGN.md — design rules for a real estate agency site

Engineering rules live in `AGENTS.md`. This file holds the design rules
that are about the brand, readability, real estate conventions and the kit
parts you theme. The look itself (layout, type scale, sections, motion) is
yours: design it for this agency, with a clear point of view.

The bar: an agency owner opens the site on a phone and thinks a good local
studio built it. Photos are the product. Nothing looks like a template.

## 1. Brand first

The new site is **the same agency, made modern**, not a new brand. A client
who knows the old site recognises it within two seconds. Your sources, in
this order: `BRAND.md` (AGENTS.md section 1), `agency.logo`,
`agency.brand`.

- **Logo**: keep it exactly (the file in `public/brand/` or
  `agency.logo`); never redraw, recolour or stretch it.
- **Brand colour**: keep the exact hex as `--accent`, in the same roles (a
  navy footer stays navy). Darken it only if white text on it fails 4.5:1.
- **Neutrals** keep their temperature (cool stays cool, warm stays warm).
- **Fonts**: keep the brand's font when it is a decent web font; replace it
  only when it is a system font, unusable or without a web licence. Keep
  serif vs sans.
- **Tone**: keep the form of address (Sie / vous / usted) and the agency's
  short phrases; never copy paragraphs.
- Replace stock photos with real listing photos and real agent portraits.

No current website or BRAND.md says "CRM data only": use `agency.logo` and
`agency.brand` as the brand. Do not guess the old site's look.

## 2. Tokens

Put colours, fonts, radii and spacing in one tokens file
(`app/styles/tokens.css` on React Router, `src/styles/tokens.css` on Astro) and use
only tokens in components. The kit parts read these (all have fallbacks):

```css
:root {
  --bg: …; --paper: …; --surface: …; --text: …; --muted: …; --line: …;
  --accent: <brand>; --accent-strong: …; --danger: …;
  --radius-card: …; --radius-btn: …; --control-radius: …; --control-h: 48px;
  --header-h: …;   /* sticky offset for the listings search */
}
```

- Text contrast >= 4.5:1 (3:1 for text >= 24px), white text on `--accent`
  included.
- Use `clamp()` for type between phone and desktop.
- Colour restraint: mostly neutrals, one accent in small doses. A vivid
  brand colour (an electric blue, a signal red) goes in small marks only;
  bands, buttons and large fields take a deep or muted shade of it, the ink
  colour or a neutral surface. TASTE.md is how the result is judged.

## 3. Fonts

Self-hosted only, with `@fontsource/<family>` imported where the document
shell is (React Router: `app/root.tsx`; Astro: the layout frontmatter; the
CSP blocks Google Fonts links and font CDNs). At most 2 families and 2
weights per family (a variable font counts as one), latin subset,
`font-display: swap`, and the above-the-fold font preloaded.

Choose the pair against the logo, not only from the example: the type
echoes the logo's character (weight, width, construction, mood) or
contrasts with it on purpose, and DESIGN-NOTES.md names which (TASTE.md
line 6). Swapping the example's fonts is expected when the logo is of
another kind; any open font on @fontsource is allowed.

Import and preload:

```tsx
// app/root.tsx
import '@fontsource/lato/latin-400.css';
import lato900 from '@fontsource/lato/files/lato-latin-900-normal.woff2?url';
<link rel="preload" as="font" type="font/woff2" crossOrigin="" href={lato900} />  {/* in <head> */}
```

```astro
---
import '@fontsource/lato/latin-400.css';
import lato900 from '@fontsource/lato/files/lato-latin-900-normal.woff2?url';
---
<link slot="head" rel="preload" as="font" type="font/woff2" crossorigin href={lato900} />
```

## 4. Logo

- The `<img data-logo>` sets only its height (or only its width), the
  other side `auto`: no fixed box, no `object-fit: cover`, no
  `aspect-ratio`. Size it by its shape: a wide wordmark at 1440 at least
  100px wide and 32px tall (140–180px wide for a script or detailed logo),
  at most 72px tall; a tall or square mark (a monogram, a stacked numeral) 40–72px tall.
  At 390 at least 28px tall. The header stays slim: at most 12% of the
  screen. `pnpm screenshot` flags a logo off its file's ratio or outside
  these sizes.
- Sharp: request 2x the rendered width,
  `img(agency.logo.url, { w: 360, fit: 'fit', quality: 90 })` for a 180px
  logo; an SVG in `public/brand/` as is.
- An opaque JPEG/PNG logo sits on pure white or uses
  `mix-blend-mode: multiply`; never a visible white box.
- No text wordmark next to a logo that already spells the name.

## 5. Photos

- Every photo is `<RaImage>` with `width`, `height` and `sizes` that match
  the rendered slot; exactly one `priority` image per page (the LCP).
- Never squashed or soft: tiles keep the photo's ratio (crop at most about
  10%) or use justified rows; a lightbox shows the whole photo
  (`object-fit: contain`). A tall box on phones gets RaImage's `mobile`
  crop (`mobile={{ width: 800, height: 1000 }}`).
- Text on a photo needs a scrim or panel that keeps it at 4.5:1;
  `pnpm screenshot` measures text over the `[data-hero]` photo.
- No CSS `background-image` for content photos. Photos under 1200px wide
  never go full-bleed.
- No photo: a neutral tile with the property type, never a broken image.
- Which photo: `pickPhoto` / `lotPhotos` (`@realadvisor/sites-kit-core/photos`,
  AGENTS.md section 2), never `photos[0]` by default: the first photo is often
  a floor plan or a "Reserved" banner, and lots of one development share their
  renders. The same image never shows twice side by side (`pnpm screenshot`
  prints `repeated image`).
- **Weight.** Every photo has a responsive `srcset` (RaImage does it) sized
  so the file is never more than about 2× the drawn width (a 400px card
  takes 800w at most); below the fold `loading="lazy"`; the hero, and only
  the hero, `priority` (eager, `fetchpriority="high"`). Site images in
  `public/` get the same treatment: several widths in webp, never the
  original camera file. Heavy pages are slow pages on a phone.
- **Stock photos** (a landscape, the region): a striking free-licence
  photograph of the agency's real place may open the home page and break
  sections when it is the strongest picture available; an ordinary one never
  replaces the agency's own. Always the real place, captioned with it (in the
  page's language), never presented as a property or the agency's office,
  and listed on `/credits` with author, source and licence. Choose for light
  and composition, not for the postcard view: the most-used views of a region
  are the least distinctive images. At most two stock photographs on a page
  besides the hero.

## 6. Overlays and navigation

- Closed menus, sheets, modals and lightboxes use
  `visibility: hidden; pointer-events: none` (opened with a class such as
  `.is-open`), never `opacity: 0` alone and never only the `hidden`
  attribute: an invisible fixed layer blocks every click below it.
- Mobile menu: a `<button aria-expanded aria-controls>` (44x44), closes on
  Escape and on link click, locks body scroll while open.
- Scroll-reveal animations never leave content at `opacity: 0` until a
  scroll: screenshots and crawlers do not scroll. Respect
  `prefers-reduced-motion`.
- Language switcher: text codes ("FR · DE · EN"), never flags.

## 7. Listings search, forms

- `ListingsSearch` (AGENTS.md section 7): theme it with its tokens
  (`--accent`, `--text`, `--paper`, `--surface`, `--line`, `--muted`,
  `--control-radius`, `--header-h`, `--map-h`, `--rs-columns`, `--rs-gap`,
  `--rs-active`, `--rs-on-active`, `--rs-pill-radius`, `--rs-sheet-radius`,
  `--rs-heading-weight`) and your card in its slot.
  `:global(.rs-…)` overrides are for spacing details, never to hide a
  part.
- Forms: labels above the fields (never placeholder-only), required fields
  marked, errors in `--danger` under the field, a visible focus ring, no
  raw browser chrome. Controls in one row share one height
  (`--control-h`); every select shows its longest option in full.
- Submit labels say what happens ("Envoyer ma demande"), never "Submit".

## 8. Real estate conventions

Format with `@realadvisor/sites-kit-core/format`; never `toLocaleString` or
hand-made separators. Prices and surfaces use tabular numerals and never
wrap.

| | Switzerland | France | Spain | Italy |
| --- | --- | --- | --- | --- |
| Price | `CHF 1'250'000` | `1 250 000 €` | `1.250.000 €` | `1.250.000 €` |
| Rent | `CHF 3'200 / mois` | `1 450 € / mois` | `1.450 € / mes` | `1.450 € / mese` |
| Rooms | `3.5 pièces`, `4.5 Zimmer` (a dot, never rounded) | `4 pièces · 3 chambres` | `3 dormitorios · 2 baños` | `4 locali · 2 bagni` |

- No price or `price_on_request`: "Prix sur demande" / "Preis auf Anfrage" /
  "Precio a consultar" / "Prezzo su richiesta" (`formatPrice` does it).
  Never "0" or "NaN".
- Surfaces: `145 m²` with a non-breaking space; never `m2` or `sqm`.
- Status: "Vendu" / "Verkauft" / "Vendido" / "Venduto", rentals "Loué" /
  "Vermietet" / "Alquilado" / "Affittato"; at most one badge per card.
  Sold listings are not mixed into the default list.
- Energy class: in France DPE and GES are legally required on a listing
  (A–G scale with the listing's class and value; "DPE en cours" or "Non
  soumis au DPE" as the data says; never invent a class). Spain
  "Certificado energético", Italy "Classe energetica", Switzerland
  CECB/GEAK when the data has it.
- Reference ("Réf. 12345", `listingRef`), small and muted on detail pages.
- Phones formatted by country, always a `tel:` link; emails `mailto:`.
- All UI text in the site language (`@realadvisor/sites-kit-core/i18n` labels
  for property types, offer types, features and counts).

## 9. Accessibility

- Body text >= 16px, tap targets >= 44px, one `h1`, headings in order.
- Landmarks: `<header>`, `<nav aria-label>`, `<main>`, `<footer>`, and a
  skip link to `#main`.
- Every interactive element is reachable and visible with the keyboard
  (`:focus-visible`); no information only on hover.
- Meaningful `alt` from the data ("Appartement 4.5 pièces à Lausanne,
  photo 2"); `alt=""` only for decoration.
- No layout shift: every image has `width`/`height` or `aspect-ratio`.

## 10. Craft defaults

Defaults for everything the direction in BRIEF.md does not decide. Where
the direction does something else on purpose, the direction wins; an
example is a measure of finish (TASTE.md section 1), not a layout to keep; `pnpm screenshot` measures the ones marked (measured).

- **Scales, not values.** Spacing, type sizes, radii, borders and shadows
  each come from one scale in the tokens file. No one-off `margin: 37px`.
  A type scale has clear steps: two sizes of one family within 7% of each
  other on the same page read as a mistake.
- **One grid.** Lay sections out on CSS grid or the `.wrap` container with
  the same gutters; every block starts or ends on an edge another block
  uses. A block aligned to nothing (a link floating in an empty field) is a
  mistake (measured).
- **Text blocks.** Body text left-aligned with a ragged right edge, never
  justified (measured). Caps only for labels of four words or fewer, never
  for sentences (measured). Emphasis by one means at a time: weight or
  colour or size.
- **Near-black, not black.** Text and ink in a near-black with a slight
  hue (`#141517`, `#1b1a17`); `#000` only inside the logo or a photo.
- **Shadows mean raised.** A shadow only on something that floats or
  responds (a menu sheet, a hovered card), one light direction, from the
  shadow scale. Flat surfaces stay flat.
- **Typographic details** in the page's language:
  - quotation marks „…“ (de), « … » with a thin space (fr), «…» (it, es),
    “…” (en): never straight `"` in text (measured);
  - an en dash for ranges (2–4 Zimmer, 9–18 Uhr), with no spaces;
  - a non-breaking space between a number and its unit or currency
    (`CHF 1'100'000`, `257 m²`, `4.5 Zimmer`): the kit's `formatPrice()`
    and `formatSurface()` already do it;
  - tabular figures (`font-variant-numeric: tabular-nums`) for prices and
    counts in lists, so columns of numbers line up.
- **States.** Empty, loading and error states are designed like the rest
  (AGENTS.md section 3): a sentence and a way on, never a blank box.
- **Cards.** Cards side by side keep their rows aligned, whatever the data:
  - fixed line counts for the eyebrow (1 line) and the title (2 lines:
    `-webkit-line-clamp: 2` plus `min-height: 2lh`), so a short title does
    not lift its price; the title comes from `cleanTitle`, so it is cut at a
    word or a separator, never ending on a small word ("de", "the") or a
    number;
  - the card is a grid with `grid-template-rows: subgrid` over the list's
    rows, or a flex column with the price pinned to the bottom
    (`margin-top: auto`);
  - an italic number or price gets `padding-inline-end: 0.15em`: its last
    glyph overhangs its box and a clipping card cuts it.
  `pnpm screenshot` prints `cards in one row not aligned` and `clipped text`
  at every width (1440, 1024, 390, 1800).

## 11. Never

- Invented content: lorem ipsum, testimonials, awards, statistics, agents,
  stock handshakes. No data, no section.
- English UI strings on a non-English site, or placeholder labels.
- Raw `<img>` for a photo, anything hotlinked, a Google Fonts link.
- Auto-rotating hero carousels.

## 12. Signature: motifs and maps

- **Motifs and decorative lines** (a ridge, a hatching, a contour) are
  drawn only on flat grounds: dividers, bands, the footer edge, an opaque
  panel. Never over a photo: an `object-fit: cover` photo moves under the
  line at every width, so it reads as a glitch. Mark them `aria-hidden` (or
  `data-motif` for a CSS one); `pnpm screenshot` prints `decorative line or
  motif over a photo`.
- **Drawn maps** (the region, the localities) come from real open geodata:
  Natural Earth (public domain) or swisstopo (open data, credit required),
  converted once at build time into a small JSON or SVG in the site and
  simplified, never hand-traced shapes. Credit the source on `/credits`.
  Labels in the page's language, never crossed by an outline
  (`paint-order: stroke`); dots are links with an accessible name. For a
  listings map use `ListingsMap` (AGENTS.md section 7).
- **A motif is not a signature.** A thin line used as a divider is the most
  common "signature" there is. The signature is what the page does with its
  layout: what carries the first screen, the order of the home page, and one
  section only this agency could have (section 13). A motif may support it.

## 13. Direction before code

Left alone, a model builds the most common agency site: a split first
screen with a photo on one half and a headline on the other, or a full-width
landscape with a centred headline and a search bar; then three listing cards
in a row, a stats strip and a thin decorative line. That is the average of
the category, not a decision. Forbidding one common choice only brings the
next most common one. So the direction is decided, in writing, before any
code, from what this agency has.

Write it in BRIEF.md under "Signature", in about 200 words:

- **Owned material.** The one thing only this agency has that the site is
  built on: its name set large, the shape in its logo, its place (from the
  real locations in the data), its second profession, its method, a real
  number. Found in their material, never invented for them.
- **Idea.** One sentence. It would be false on a competitor's site.
- **Layout.** Decided first and on its own: what carries the first screen
  at 1440 and at 390, what is biggest, what the fold cuts, the order of the
  home page. Draw the first screen as a small text wireframe. New colours on
  an example's skeleton are not a direction.
- **Own section.** One section on the home page that no other agency could
  have, filled with real data.
- **Type.** The voice against the logo (TASTE.md line 6) and one decision
  that is not the default: a very large size, a very light weight, an italic
  for prices.
- **Colour.** The strategy before the hues: where the brand colour is a
  large field, where a small mark, what the grounds are (section 2).
- **Photos.** Which photo carries the first screen and why that one. The
  first listing's first photo is never the answer by default.
- **Refuses.** The conventions of agency sites this one drops.

When several directions are possible, write five in one go, say for each
how often you would produce it unprompted, and do not take the likeliest by
default: the less likely ones are where an agency's own site is. Let
something outside your preference choose among those that fit (a script, a
second reader, the user).

Then test the direction: swap in another agency's name. If it still fits,
rewrite the line that let it. Build exactly what the direction says. Spend
the boldness in one place, the first screen or the own section, and keep
the rest calm; restraint in the details (sections 2 to 10) is what makes a
bold layout look expensive instead of loud.

The fixed points are not part of the direction and never give way to it:
the agency's logo and brand colour (section 1), the valuation call to action
on the first screen at every width, readable text on photos (section 5), and
the kit's parts for search, forms, maps and the photo viewer.
