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
`font-display: swap`, and the above-the-fold font preloaded:

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
  at most 72px tall; a tall or square mark (a monogram, 3³) 40–72px tall.
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
  `--rs-heading-weight`, `--rs-card-h`) and your card in its slot.
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

## 10. Never

- Invented content: lorem ipsum, testimonials, awards, statistics, agents,
  stock handshakes. No data, no section.
- English UI strings on a non-English site, or placeholder labels.
- Raw `<img>` for a photo, anything hotlinked, a Google Fonts link.
- Auto-rotating hero carousels.
