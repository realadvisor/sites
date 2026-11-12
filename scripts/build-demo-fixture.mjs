// Builds the kit's sample data: one fictional agency, "Demo Agency".
//
//   node --experimental-strip-types scripts/build-demo-fixture.mjs
//   # writes kit/fixtures/demo-agency.json and development-residence-exemple.json
//
// Both are SDK Fixtures (@realadvisor/sites-sdk createFixtureClient): the
// records as rest-api /v3/public answers them, plus the agency's `legal`.
//
// Everything here is invented: names, emails (example.com), phone numbers
// (+41 00 000 00 0x), streets, ids (seeded random UUIDs), texts. It is the
// only sample data in the kit: fixture mode, evals, SDK tests and the CRM's
// "agency could not be loaded" fallback all use it. Never put a real
// agency, broker, client or development in kit/fixtures: a site built on
// sample data must never show a real company's name or contact details.
//
// Photos: generic property photos (no people, no logos, no text) from the
// RealAdvisor image bucket, so the template's image pipeline and host
// checks see the same URLs as on a live site.
import { writeFileSync } from 'node:fs';
import { htmlToText, richText, sanitizeHtml } from '../kit-core/lib/html.ts';

const OUT = new URL('../kit-core/fixtures/', import.meta.url);
const BUCKET = 'https://storage.googleapis.com/img.realadvisor.ch/';

// Seeded PRNG: the same UUIDs on every run, so the files only change when
// this script does.
let seed = 0x5eed_de30;
const rand = () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const uuid = () =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.floor(rand() * 16);
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });

const slugify = (s) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/, '');

const POOL = [
  { kind: 'house', files: [
    'IMG_9277_2000px_sRGB_2.jpg',
    'IMG_9307_2000px_sRGB_2.jpg',
    'IMG_9321_2000px_sRGB_2.jpg',
    'IMG_9238_amenagement_2000px_sRGB.jpg',
    'IMG_9231_amenagement_2000px_sRGB.jpg',
    'IMG_9235_amenagement_2000px_sRGB.jpg',
    'IMG_9224_amenagement_2000px_sRGB.jpg',
    'IMG_9222_amenagement_2000px_sRGB.jpg',
  ] },
  { kind: 'house', files: [
    'DJI_20260720062941_0362_D.jpg',
    'DJI_20260720062608_0357_D.jpg',
    'DJI_20260720062903_0359_D.jpg',
    'DJI_20260720063341_0367_D.jpg',
    'DJI_20260720063045_0364_D.jpg',
    '040A0868.jpg',
    '040A0842.jpg',
    '040A0828.jpg',
  ] },
  { kind: 'house', files: [
    '040A0470_retouche_sRGB_2000px.jpg',
    '040A0477_retouche_sRGB_2000px.jpg',
    '040A0495_retouche_sRGB_2000px.jpg',
    '040A0529_retouche_sRGB_2000px.jpg',
    '040A0420_retouche_sRGB_2000px.jpg',
    '040A0651_retouche_sRGB_2000px.jpg',
    '040A0666.jpg',
    '040A0679.jpg',
  ] },
  { kind: 'apartment', files: [
    'ai-enhanced__9XnRe0yj8qU3Y47eY0TvS.jpg',
    'ai-enhanced__UO2NgHWuCZACrIwYDjvF-.jpg',
    'ai-enhanced__iVWn2paYrbbN_1PQ4hTmF.jpg',
    'ai-enhanced__WzteFNaMb73Lks25XU-Kf.jpg',
    'ai-enhanced__OeRBVO8nlKIWZXeJrHKVn.jpg',
    'ai-enhanced__MSS22boTwEHl6sRnl95mG.jpg',
    'ai-enhanced__lUKxAMZdUF24OWLHp8OI9.jpg',
    'ai-enhanced__CYw1aWAxn-vT885z1aoYS.jpg',
  ] },
  { kind: 'apartment', files: [
    '040A6269.jpg',
    'DJI_20260810104328_0425_D.jpg',
    '040A6074.jpg',
    '040A6105.jpg',
    '040A6121_1.jpg',
    '040A6164.jpg',
    '040A6170.jpg',
    '040A6143.jpg',
  ] },
  { kind: 'apartment', files: [
    '040A9864.jpg',
    '040A9794.jpg',
    '040A9836.jpg',
    '040A0047.jpg',
    '040A0058.jpg',
    '040A9948.jpg',
    '040A0004.jpg',
    '040A9916.jpg',
  ] },
  { kind: 'apartment', files: [
    'ai-enhanced__xx4lLDpKjcmuI9EaZRpyP.jpg',
    'ai-enhanced__4JFsl282b058cGWV7HpL1.jpg',
    'ai-enhanced__mJSJBEKC_maqXss-tQ01q.jpg',
    'ai-enhanced__TJHmAcCrfRBrG-1mu--0U.jpg',
    'ai-enhanced__WQeCQ-LYRJkf69GGKsgKe.jpg',
    'ai-enhanced__SPpYWlzvf5TllTiLD1ohF.jpg',
    'ai-enhanced__E9TEEhwgnlxm8sg0R8PeJ.jpg',
    'ai-enhanced__ozmf6O-bPeZIIFJy65NAW.jpg',
  ] },
  { kind: 'house', files: [
    '040A1070.JPG',
    'IMG_7763.JPG',
    '040A0905_2.JPG',
    '040A0871_1.JPG',
    '040A1143.JPG',
  ] },
  { kind: 'apartment', files: [
    '040A8145.JPG',
    '040A8217.JPG',
    '040A8280_OKI.jpg',
    '040A8185__CRZTCgdtumVj0RRApx-zk.JPG',
    '040A9402.JPG',
    '040A7068.JPG',
    '040A8405.JPG',
    '040A8472.JPG',
  ] },
  { kind: 'house', files: [
    'ai-enhanced__dsP10BKTBUvUzFLcy04BU.jpg',
    'ai-enhanced__QAQdPqDJpoSCDbZx130ub.jpg',
    'ai-enhanced__Z8_Pf9tI8hPjUXLEk2Rk4.jpg',
    'ai-enhanced__vBRrl9AuPoT8hR4EB6GuV.jpg',
    'ai-enhanced__HIXOV3snO0OHJcKBrpjCQ.jpg',
  ] },
  { kind: 'apartment', files: [
    'img_9941_2025-10-27-134943.jpg',
    'img_9925_2025-10-27-134943.jpg',
    'img_9926_2025-10-27-134943.jpg',
    'img_9928_2025-10-27-134943.jpg',
    'img_9932_2025-10-27-134943.jpg',
    'img_9933_2025-10-27-134943.jpg',
    'img_9934_2025-10-27-134943.jpg',
    'img_9935_2025-10-27-134943.jpg',
  ] },
  { kind: 'house', files: [
    '040a4451_2025-10-04-083259.jpg',
    '040a4487_2025-10-04-083259.jpg',
    '040a4547_2025-10-04-083259.jpg',
    '040a4474_2025-10-04-083259.jpg',
    '040a4601_2025-10-04-083259.jpg',
    '040a4558_2025-10-04-083259.jpg',
    '040a4574_2025-10-04-083259.jpg',
    '040a4628_2025-10-04-083259.jpg',
  ] },
  { kind: 'apartment', files: [
    'ai-enhanced__KV8iRuaT8CTiaGtq5qc8d.jpg',
    'ai-enhanced__4JhEwmMSKKa8_eQcY4LL3.jpg',
    'ai-enhanced__8T74eV0C2SoQNOlOaEDa2.jpg',
    'ai-enhanced__aKIS78xGg04V2_pc2v0U8.jpg',
    'ai-enhanced__Bkwf7VKG0h7gaT8kELe7x.jpg',
    'ai-enhanced__vFmThbNT065SAcTw3cXnm.jpg',
    'ai-enhanced__EQUdAmxUzw1nuwKKyNdsq.jpg',
    'ai-enhanced__uNRhqyrAg_FT1VWCDUUkF.jpg',
  ] },
  { kind: 'house', files: [
    'ai-enhanced__qPJRUEoOCaKnlY9SchoXB.jpg',
    'ai-enhanced__8LCRl-DkweMawscRGTmot.jpg',
    'ai-enhanced__ryBjEM2ObpeajgyUhdGGy.jpg',
    'ai-enhanced__jgSd9PXXnaheuypB_EOoR.jpg',
    'ai-enhanced___50AxyThH-FwgEo0w-csI.jpg',
    'ai-enhanced__pi8sjCOaNZRS9SxiGcnkA.jpg',
    'ai-enhanced__salB7SRv9LPdxVpOb9HGe.jpg',
    'ai-enhanced__-2MoxfgiEfo9jXpVvtRqE.jpg',
  ] },
];
const houses = POOL.filter((p) => p.kind === 'house');
const flats = POOL.filter((p) => p.kind === 'apartment');
/** `description` (sanitized HTML) and `description_text` from text, markdown or HTML. */
function withText(src) {
  const { html, text } = richText(src);
  return { description: html, description_text: text };
}
const photos = (set, from, n, alt) =>
  [...set.files.slice(from), ...set.files.slice(0, from)].slice(0, n).map((f) => ({ url: BUCKET + f, alt }));

const AGENCY_ID = uuid();
const agencyAddress = {
    street: "Rue de l'Exemple 1",
    postcode: '1003',
    city: 'Lausanne',
    country: 'CH',
    lat: 46.5197,
    lng: 6.6323,
};
const organisation = {
  id: AGENCY_ID,
  name: 'Demo Agency',
  website: 'https://www.example.com',
  address: agencyAddress,
  brand: { primary: '#1f4e5f' },
};
// The office (primary team). Its id comes last of the UUIDs, so the others stay put.
const team = {
  id: '',
  name: 'Demo Agency',
  primary: true,
  phone: '+41000000000',
  email: 'info@example.com',
  address: agencyAddress,
  socials: {
    facebook: 'https://www.example.com/facebook',
    instagram: 'https://www.example.com/instagram',
    linkedin: 'https://www.example.com/linkedin',
  },
  ...withText(
    "Demo Agency est une agence immobilière fictive : ses biens, ses courtiers et ses coordonnées servent d'exemple quand les données réelles de l'agence ne sont pas disponibles.\n\nVente et location d'appartements et de maisons dans le canton de Vaud, estimation et accompagnement jusqu'à la signature chez le notaire.",
  ),
};
const legal = {
  company_name: 'Demo Agency SA',
  registration_number: 'CHE-000.000.000',
  representative: 'Léa Exemple',
};

const agents = [
  {
    id: uuid(),
    first_name: 'Léa',
    last_name: 'Exemple',
    title: 'Directrice',
    phone: '+41000000001',
    email: 'lea.exemple@example.com',
    languages: ['fr', 'en', 'de'],
    bio: "Léa Exemple dirige Demo Agency. Elle accompagne vendeurs et acheteurs de l'estimation à la signature, avec un suivi personnel à chaque étape.",
  },
  {
    id: uuid(),
    first_name: 'Marc',
    last_name: 'Démo',
    title: 'Courtier',
    phone: '+41000000002',
    email: 'marc.demo@example.com',
    languages: ['fr', 'it'],
    bio: 'Marc Démo conseille les propriétaires de la Riviera et du Lavaux, de la mise en valeur du bien aux visites.',
  },
  {
    id: uuid(),
    first_name: 'Sofia',
    last_name: 'Muster',
    title: 'Courtière location',
    phone: '+41000000003',
    email: 'sofia.muster@example.com',
    languages: ['fr', 'de', 'en'],
    bio: 'Sofia Muster gère les locations résidentielles et commerciales de Demo Agency, de la mise en location à la remise des clés.',
  },
];
const [lea, marc, sofia] = agents;

// Fictional streets in real towns (the maps need real coordinates).
const PLACES = {
  lausanne: { postcode: '1004', city: 'Lausanne', lat: 46.5247, lng: 6.6201 },
  pully: { postcode: '1009', city: 'Pully', lat: 46.5108, lng: 6.6617 },
  lutry: { postcode: '1095', city: 'Lutry', lat: 46.5034, lng: 6.6862 },
  morges: { postcode: '1110', city: 'Morges', lat: 46.5113, lng: 6.4985 },
  nyon: { postcode: '1260', city: 'Nyon', lat: 46.3833, lng: 6.2398 },
  rolle: { postcode: '1180', city: 'Rolle', lat: 46.4583, lng: 6.3361 },
  vevey: { postcode: '1800', city: 'Vevey', lat: 46.4628, lng: 6.8419 },
  montreux: { postcode: '1820', city: 'Montreux', lat: 46.4312, lng: 6.9107 },
  renens: { postcode: '1020', city: 'Renens', lat: 46.5399, lng: 6.5881 },
  epalinges: { postcode: '1066', city: 'Epalinges', lat: 46.5486, lng: 6.6694 },
  yverdon: { postcode: '1400', city: 'Yverdon-les-Bains', lat: 46.7785, lng: 6.6412 },
  aigle: { postcode: '1860', city: 'Aigle', lat: 46.3181, lng: 6.9689 },
};
const STREETS = [
  "Chemin de l'Exemple",
  'Rue du Modèle',
  'Avenue de la Démo',
  'Chemin des Essais',
  'Route du Prototype',
  "Rue de l'Échantillon",
];
const address = (place, i, withStreet = true) => {
  const p = PLACES[place];
  const jitter = ((i % 7) - 3) * 0.0011;
  return {
    ...(withStreet ? { street: `${STREETS[i % STREETS.length]} ${(i % 23) + 2}` } : {}),
    postcode: p.postcode,
    city: p.city,
    country: 'CH',
    lat: Number((p.lat + jitter).toFixed(6)),
    lng: Number((p.lng - jitter).toFixed(6)),
  };
};

const FEATURE_TEXT = { balcony: 'Balcon', elevator: 'Ascenseur', parking: 'Place de parc', garden: 'Jardin' };
const describe = (l, intro) => {
  const facts = [
    l.rooms != null && `${String(l.rooms).replace('.', ',')} pièces`,
    l.living_surface != null && `${l.living_surface} m² habitables`,
    l.land_surface != null && `Terrain de ${l.land_surface} m²`,
    l.bedrooms != null && `${l.bedrooms} chambre${l.bedrooms > 1 ? 's' : ''}`,
    l.bathrooms != null && `${l.bathrooms} salle${l.bathrooms > 1 ? 's' : ''} d'eau`,
    ...(l.features ?? []).map((f) => FEATURE_TEXT[f]),
  ].filter(Boolean);
  const html =
    `<p><strong>${l.title}</strong></p><p>${intro}</p>` +
    `<ul>${facts.map((f) => `<li>${f}</li>`).join('')}</ul>` +
    "<p>Bien fictif de Demo Agency, publié à titre d'exemple.</p>";
  const description = sanitizeHtml(html);
  return { description, description_text: htmlToText(description) };
};

// [offer_type, property_type, status, price, rooms, beds, baths, living, land, place, agent, features, title, intro]
const SPECS = [
  ['buy', 'apartment', 'available', 1290000, 4.5, 3, 2, 112, null, 'lausanne', lea, ['balcony', 'elevator'], 'Appartement lumineux avec balcon', 'Au troisième étage d’un immeuble récent, un séjour traversant ouvert sur un balcon orienté sud-ouest.'],
  ['buy', 'house_detached', 'available', 1850000, 6.5, 4, 3, 185, 820, 'epalinges', lea, ['garden', 'parking'], 'Maison familiale avec jardin', 'Maison individuelle dans un quartier calme, jardin arboré et garage double.'],
  ['buy', 'house_multiple_dwelling', 'available', null, null, null, null, 420, 1100, 'nyon', lea, ['parking'], 'Immeuble de rendement', 'Immeuble de six logements, entièrement loué. Dossier sur demande.'],
  ['buy', 'apartment_penthouse', 'sold', 1980000, 4.5, 3, 2, 142, null, 'montreux', marc, ['elevator', 'balcony'], 'Attique face au lac', 'Attique avec terrasse continue et vue directe sur le lac et les montagnes.'],
  ['rent', 'apartment', 'available', 2450, 3.5, 2, 1, 82, null, 'lausanne', sofia, ['balcony', 'elevator'], 'Appartement à louer avec balcon', 'Appartement rénové, cuisine ouverte et balcon sur cour.'],
  ['rent', 'apartment_studio', 'available', 1180, 1, 0, 1, 31, null, 'renens', sofia, ['elevator'], 'Studio meublé', 'Studio meublé, idéal étudiant, à cinq minutes de la gare.'],
  ['rent', 'indus_office', 'available', null, null, null, null, 220, null, 'lausanne', sofia, ['elevator'], 'Bureaux en centre-ville', 'Plateau de bureaux modulable, proche du métro. Loyer sur demande.'],
];

// The CRM facts of each listing (SPECS order), as rest-api serves them. No rand(): the ids stay put.
const FACTS = [
  { floor: 3, building_floors: 5, orientation: ['south', 'west'], construction_year: 2016, energy_class: 'B', energy_certificate_version: 'CECB', heating: 'heat_pump', has_cellar: true, indoor_parkings: 1, charges: 380, available_from: '2027-01-01' },
  { building_floors: 2, orientation: ['south', 'east'], construction_year: 1988, renovation_year: 2019, energy_class: 'D', energy_certificate_version: 'CECB', heating: 'oil', has_cellar: true, garden_surface: 650, terrace_surface: 35, indoor_parkings: 2, outdoor_parkings: 1 },
  { building_floors: 4, construction_year: 1972, renovation_year: 2010, energy_class: 'E', heating: 'gas', has_cellar: true, outdoor_parkings: 6 },
  { floor: 5, building_floors: 5, orientation: ['south'], construction_year: 2008, energy_class: 'C', minergie: 'minergie', heating: 'district', terrace_surface: 64, indoor_parkings: 2 },
  { floor: 2, building_floors: 4, orientation: ['east'], construction_year: 1965, renovation_year: 2022, energy_class: 'D', heating: 'district', has_cellar: true, rent_extra: 220, available_from: '2026-12-01', pets_allowed: false },
  { floor: 1, building_floors: 6, construction_year: 1994, energy_class: 'C', heating: 'gas', rent_extra: 90, furnished: true, available_from: '2026-12-15' },
  { floor: 4, building_floors: 6, construction_year: 2001, heating: 'district', rent_extra: 600, indoor_parkings: 4, available_from: '2027-03-01' },
];

const listings = [];
let ref = 0;
const listingOf = ([offer_type, property_type, status, price, rooms, bedrooms, bathrooms, living_surface, land_surface, place, agent, features, title, intro], i, extra = {}) => {
  const id = uuid();
  const house = property_type.startsWith('house');
  const set = house ? houses[i % houses.length] : flats[i % flats.length];
  const l = {
    id,
    slug: `${slugify(title)}-${id}`,
    title,
    offer_type,
    property_type,
    status,
    ...(price == null ? { price_on_request: true } : { price }),
    currency: 'CHF',
    ...(rooms == null ? {} : { rooms }),
    ...(bedrooms == null ? {} : { bedrooms }),
    ...(bathrooms == null ? {} : { bathrooms }),
    ...(living_surface == null ? {} : { living_surface }),
    ...(land_surface == null ? {} : { land_surface }),
    address: address(place, i, i % 3 !== 0),
    photos: photos(set, i % 3, 5 + (i % 4), title),
    agent,
    features,
    published_at: new Date(Date.UTC(2026, 9, 28) - i * 3 * 86400000).toISOString(),
    reference: `DEMO-${String(++ref).padStart(4, '0')}`,
    ...(FACTS[i] ?? {}),
    ...extra,
  };
  return { ...l, ...describe(l, intro) };
};
// The office has no photos: pages must render a listing without any.
SPECS.forEach((s, i) => listings.push(listingOf(s, i, s[1] === 'indus_office' ? { photos: [] } : {})));

// The demo development: 8 units on five levels, Morges.
const DEV_ID = uuid();
const devTitle = 'Résidence Exemple';
const devAddress = { street: "Chemin de l'Exemple 4", postcode: '1110', city: 'Morges', country: 'CH', lat: 46.5131, lng: 6.4952 };
const devPhotos = [...flats[0].files, ...flats[1].files.slice(0, 5)].map((f) => ({ url: BUCKET + f, alt: devTitle }));
const FLOORS = ['Rez-de-jardin', '1er étage', '2e étage', '3e étage', 'Attique'];
// [rooms, beds, baths, living, balcony, floor, status, price]
const UNITS = [
  [2.5, 1, 1, 55, 7, 0, 'sold'],
  [4.5, 3, 2, 98, 19, 0, 'reserved', 1395000],
  [1.5, 1, 1, 38, 7, 1, 'sold'],
  [3.5, 2, 1, 75, 9, 1, 'sold'],
  [4.5, 3, 2, 108, 10, 2, 'available', 1425000],
  [2.5, 1, 1, 55, 7, 2, 'sold'],
  [3.5, 2, 1, 72, 6, 3, 'sold'],
  [3.5, 2, 2, 102, 32, 4, 'available', 1495000],
];
// The facts every unit of the building shares.
const BUILDING = { building_floors: 5, construction_year: 2028, energy_class: 'A', minergie: 'minergie_p', heating: 'heat_pump', has_cellar: true, indoor_parkings: 1, available_from: '2028-07-01' };
const ORIENTATION = [['south', 'west'], ['south', 'east'], ['north', 'west'], ['south']];
const units = UNITS.map(([rooms, bedrooms, bathrooms, living_surface, balcony_surface, floor, status, price], i) => {
  const name = `${String(rooms).replace('.', ',')} pièces · ${FLOORS[floor]}`;
  const features = floor === 0 ? ['balcony', 'garden', 'parking'] : ['elevator', 'balcony', 'parking'];
  const facts = {
    ...BUILDING,
    orientation: ORIENTATION[i % ORIENTATION.length],
    ...(floor === 0 ? { garden_surface: 60 + i * 20 } : {}),
    ...(floor === 4 ? { terrace_surface: 32 } : {}),
    charges: Math.round(living_surface * 3.2),
  };
  const unit = {
    id: uuid(),
    name,
    reference: `A${floor}.${(i % 2) + 1}`,
    status,
    offer_type: 'buy',
    property_type: 'apartment',
    rooms,
    bedrooms,
    bathrooms,
    living_surface,
    balcony_surface,
    floor,
    floor_label: FLOORS[floor],
    ...(price ? { price } : {}),
    currency: 'CHF',
    features,
    ...facts,
  };
  if (!price) return unit;
  // Units for sale are public listings too: same text and photos.
  const listing = listingOf(
    ['buy', 'apartment', 'available', price, rooms, bedrooms, bathrooms, living_surface, null, 'morges', lea, features,
      `${devTitle} – ${name}`,
      `Appartement neuf de la ${devTitle}, ${FLOORS[floor].toLowerCase()}, balcon de ${balcony_surface} m². Immeuble Minergie avec ascenseur, places de parc au sous-sol.`],
    SPECS.length + i,
    { address: devAddress, photos: photos(flats[1], i % 8, 6, name), floor, balcony_surface, ...facts },
  );
  listings.push(listing);
  return { ...unit, listing_slug: listing.slug, description: listing.description, description_text: listing.description_text, photos: listing.photos };
});
const range = (xs) => ({ min: Math.min(...xs), max: Math.max(...xs) });
const devDescription = sanitizeHtml(
  `<p>Huit appartements neufs sur cinq niveaux à Morges, du 1,5 au 4,5 pièces. Jardins privatifs au rez, balcons à chaque étage et un attique avec terrasse de 32 m².</p>` +
    '<ul><li>Immeuble Minergie</li><li>Ascenseur</li><li>Places de parc au sous-sol</li></ul>' +
    "<p>Promotion fictive de Demo Agency, publiée à titre d'exemple.</p>",
);
const development = {
  id: DEV_ID,
  slug: 'residence-exemple',
  title: devTitle,
  description: devDescription,
  description_text: htmlToText(devDescription),
  status: 'marketing',
  delivery_date: '2028-06-30',
  address: devAddress,
  photos: devPhotos,
  developer: { name: 'Exemple Promotion SA', website: 'https://www.example.com/promotion' },
  architect: { name: 'Atelier Modèle' },
  general_contractor: { name: 'Démo Construction SA' },
  stats: {
    units: units.length,
    available: units.filter((u) => u.status === 'available').length,
    reserved: units.filter((u) => u.status === 'reserved').length,
    sold: units.filter((u) => u.status === 'sold').length,
    price: range(units.filter((u) => u.price).map((u) => u.price)),
    rooms: range(units.map((u) => u.rooms)),
    living_surface: range(units.map((u) => u.living_surface)),
  },
  currency: 'CHF',
  agents: [lea],
  team_ids: [],
  units,
};

team.id = uuid();
for (const r of [...agents, ...listings, development]) r.team_ids = [team.id];

const write = (file, data) => writeFileSync(new URL(file, OUT), JSON.stringify(data, null, 2) + '\n');
write('demo-agency.json', { organisation, teams: [team], agents, listings, legal });
// A one-development site: the development, its broker and its units' listings.
const unitListings = listings.filter((l) => units.some((u) => u.listing_slug === l.slug));
write('development-residence-exemple.json', { organisation, teams: [team], agents: [lea], listings: unitListings, developments: [development], legal });
console.log('demo-agency.json:', listings.length, 'listings,', agents.length, 'agents');
console.log('development-residence-exemple.json:', development.stats);
