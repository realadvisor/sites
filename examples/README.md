# Example sites

Twelve fictional sites built with the sites kit, each in Astro (`astro/<slug>`)
and React Router (`react/<slug>`, same pages and design). They are the quality
bar for every site and the reference RealAdvisor's site agent reads. Look for
the closest pattern here before building one from scratch, then adapt it to
the site's own design and data.

**Never copy an example's data, names, text or photos into a real site.** All
of it is invented (agencies, people, addresses, descriptions) and only fits the
example. Copy structure and code, not content.

## The examples

| Slug                  | Kind                                        | Languages  | Style                  | Worth looking at                                                                                                     |
| --------------------- | ------------------------------------------- | ---------- | ---------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `studio-vey`          | Agency, Zürich                              | de         | Editorial serif, paper | `OfferTabs` (buy/rent tabs), `Collection`, `SoldList`, `ValuationBand`, `JournalCard`, `CroppedPhoto`                |
| `terrasses-du-signal` | New build, 18 units, Lutry                  | fr         | Quiet luxury           | `StackingPlan`, `TypeStrip`, SVG plans (`scripts/plans.mjs`), PDFs (`scripts/documents.mjs`)                         |
| `alder-roux`          | Network, 3 offices                          | fr, de     | Navy and gold          | `SearchBand` (tabs over search), `OfficeCard`, `StackingPlan`, `lib/routes.ts` (localized routes)                    |
| `cala-moreta`         | Agency, Costa Brava                         | es, en     | Mediterranean          | `ListingCard` with spec table, `Gallery`, `PostCard`, area pages                                                     |
| `quartier-zinnober`   | New build, 60 rentals, 3 houses             | de         | Bold colour            | `StackingPlan` per house with live filters, `BuildingTiles`, `TypeStrip`, rent with reserved/let states              |
| `arvel-promotion`     | Developer, 3 programmes                     | fr         | Cinematic dark         | `ProgrammePanel`, `UnitTable`, `FloorPlan`, `Lightbox`, construction timeline                                        |
| `ballatoio`           | Design-led agency, Milan                    | it, en     | Magazine               | Listing page as a story (`views/ListingPage.astro`), `lib/districts.ts`                                              |
| `vellane`             | Search-first network, 4 agencies            | fr         | Marketplace            | `SearchPill`, `SaveButton` (favourites, saved searches), `PaymentEstimate`, sticky section tabs                      |
| `archi-del-bre`       | New build, 22 units, 2 houses, Lugano       | it, de     | Warm and light         | `IsoDrawing` (building drawing linked to the unit table), shortlist and compare (`views/Compare.astro`)              |
| `casa-de-les-rajoles` | New build, 28 units, Valencia               | es, en     | Heritage serif, coral  | `FloorPlate` (floor rail and plan by m²), typology tabs (`views/Plans.astro`), `TabBar` on phones                    |
| `clairval`            | Luxury agency, Geneva, Gstaad, Saint-Tropez | en, fr     | International luxury   | 1+4 `Gallery` with dialog, sticky agent card, phone Message/Call bar, CHF and EUR prices                             |
| `halderhof`           | Corporate network with a development        | de, fr, en | Corporate green        | `SearchPanel`, `Affordability` calculator (Swiss rules), "Preise und Verfügbarkeit" list (`lib/dev.ts`), `TownTable` |

Every example has legal and privacy pages from the kit, cookie consent, the
kit enquiry form, a sitemap, favicons drawn from the brand font
(`_tools/favicon-svg.py`) and passes `pnpm check:deploy`.

## Data

Each Astro site reads `src/data/fixture.json` through the SDK's fixture client
(`createFixtureClient`), which has the same interface as the live client, so
the same pages run on live data. The React port reads its Astro sibling's
fixture. Fields the API does not have yet are read through `fixtureOnly()` and
marked `// fixture only:` in code. Photos are free Pexels photos in the
RealAdvisor image bucket.

## Work on the examples

```bash
cd examples && pnpm install
pnpm documents                 # brochures, price lists, plans (PDFs are not committed)
cd astro/<slug> && pnpm check && pnpm check:deploy && pnpm preview
```

Ports: Astro 4411 to 4422, React 4511 to 4522, in the table's order.
