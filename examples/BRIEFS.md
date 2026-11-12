# Example sites: briefs

Six full examples, built by hand as the quality bar for the sites kit. The kit
is extracted from them afterwards. 

Every example builds **every page of its product**, default and optional. Real
client sites start with the default pages only; the examples are the reference
each optional page's skill recipe points to.

Data comes from `@realadvisor/sites-sdk` (`sdk`, snake_case, teams). A
field the API does not have is marked **fixture only** in the fixture and in
this file, and is never presented as API data.

Quality gate for each example: side by side with its three references at 1440
and 390 px, Lighthouse mobile >= 95 on every page type, `check:deploy` clean,
no console errors, keyboard and contrast checks, then review.

## Page sets

**Agency.** Default: Home, Buy, Rent (search + map), Listing, Sell
(valuation), Team, Contact, legal, privacy, 404. Optional: Developments,
Development page and unit pages, Sold, area pages (one per city with 3+
listings), agent pages, Offices and office pages (2+ teams), About, Blog
(content collection in the site repo).

**New-build.** Default: Home, Units (stacking plan + table), Unit page,
Contact / register interest, legal, privacy, 404. Optional: Location,
Gallery, Documents, News, programmes list (developer with several).

## 1. Boutique agency, editorial

- Market: CH, German (Zürich, Zug). One team.
- Family: Editorial. References: The Modern House, Inigo, JamesEdition.
- Home: 60/40 split hero, stacked collections (new, featured, sold), valuation band, journal band.
- Listing: key-facts card that turns sticky, 1 + 4 gallery, agent on the form, "let's talk" band.
- Optional pages it shows best: Sold, Blog, About, agent pages.

## 2. One development, quiet luxury

- Market: CH, French (Lausanne region). 18 units, one building, 6 floors.
- Family: Quiet luxury. References: Marylebone Square, Loam House, ERA Residence.
- Home: lead form beside the hero, key figures, unit-type strip, gallery collage.
- Units: stacking plan with table, type strip and "only available"; unit page with plan first.
- Optional pages it shows best: Location, Gallery, Documents.

## 3. Multi-office network

- Market: CH, French and German (Geneva, Lausanne, Zürich). Three teams.
- Family: Corporate network. References: Sotheby's, CBRE, Engel & Völkers.
- Home: search band with Buy / Rent / Developments / Sell tabs, figures strip, featured carousel.
- Optional pages it shows best: Offices and office pages, area pages, Developments.

## 4. Mediterranean agency

- Market: ES, Spanish and English (Costa Brava) or IT (Tuscany). One team.
- Family: Mediterranean. References: Mejuma Tuscany, Stewart & Co.
- Listing cards with a spec table, overlaid result grid, process list on About.
- Optional pages it shows best: area pages, About, Blog.

## 5. Large rental development, bold colour

- Market: CH, German (Winterthur). 60 rental units, three buildings.
- Family: Bold colour. References: Zwhatt, DUOS Wynwood, Neptune Wharf.
- Units: one stacking plan per building with a building picker, monthly rents, move-in dates.
- Optional pages it shows best: News (construction timeline), Location.

## 6. Developer with several programmes, cinematic

- Market: FR, French (Annecy, Lyon). Three programmes, 30+ units in the largest.
- Family: Cinematic. References: Chelsea Barracks, Azimute, ERA Residence.
- Programmes list with status tags, then each programme on the new-build page set.
- Optional pages it shows best: programmes list, Gallery, Documents.

## Data needed

What the examples need beyond today's demo fixture (one agency, three agents,
ten listings, one development of eight units).

| Need | For | In the API today |
| --- | --- | --- |
| 6 fictional agencies (one per example), each with teams, agents with photos and bios | all | yes (`teams`, `agents`) |
| 2 to 3 teams with their own address, phone, description | 3 | yes |
| 20 to 40 listings per agency, buy and rent, several property types | 1, 3, 4 | yes |
| sold listings | 1, 3 | yes (`status: sold`) |
| 3+ listings in the same city, in several cities | 3, 4 | yes (`city`) |
| developments with 18, 30+ and 60 units | 2, 5, 6 | yes |
| floor, floor label, rooms, surfaces, status, price per unit | 2, 5, 6 | yes |
| development site plan | 2, 5 | yes (`site_plan`) |
| rent per unit and move-in date | 5 | rent via `offer_type: rent` + `price`; move-in date: **fixture only** |
| unit number, building, position on the floor, orientation | 2, 5, 6 | **fixture only** |
| floor plan image per unit | 2, 5, 6 | **fixture only** |
| documents (brochure, plans) per development | 2, 6 | **fixture only** (the old kit SDK had `documents`) |
| developer and architect names | 2, 6 | **fixture only** (the old kit SDK had `developer`) |
| energy class per listing | 1, 3 | **fixture only** |
| blog posts (title, date, author, cover, city, body) | 1, 4 | content collection in the site, not API |
| construction news / timeline | 5 | content collection in the site, not API |

All names, emails (example.com), phones (+41 00 000 00 0x), streets and
texts are invented; photos come from the generic RealAdvisor image pool, as
in `scripts/build-demo-fixture.mjs`.
