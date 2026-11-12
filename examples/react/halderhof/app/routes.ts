import { type RouteConfig, index, route } from '@react-router/dev/routes';

// Same URLs as the Astro version (src/pages/): German unprefixed, French under /fr,
// English under /en (lib/routes.ts ROUTES). One module per page type; the loader
// reads the language from the path (langOfPath).
type Lang = 'de' | 'fr' | 'en';
const page = (paths: Record<Lang, string>, file: string, id: string) =>
  (['de', 'fr', 'en'] as const).map((l) =>
    paths[l] === '' ? index(`routes/${file}`, { id: `${l}-${id}` }) : route(paths[l], `routes/${file}`, { id: `${l}-${id}` }),
  );
const sub = (base: Record<Lang, string>, tail: string) =>
  Object.fromEntries(Object.entries(base).map(([l, p]) => [l, p ? `${p}/${tail}` : tail])) as Record<Lang, string>;

const R = {
  home: { de: '', fr: 'fr', en: 'en' },
  buy: { de: 'kaufen', fr: 'fr/acheter', en: 'en/buy' },
  rent: { de: 'mieten', fr: 'fr/louer', en: 'en/rent' },
  listing: { de: 'objekte', fr: 'fr/biens', en: 'en/properties' },
  sell: { de: 'verkaufen', fr: 'fr/vendre', en: 'en/sell' },
  sold: { de: 'verkauft', fr: 'fr/vendus', en: 'en/sold' },
  team: { de: 'team', fr: 'fr/equipe', en: 'en/team' },
  offices: { de: 'standorte', fr: 'fr/bureaux', en: 'en/offices' },
  areas: { de: 'regionen', fr: 'fr/regions', en: 'en/regions' },
  developments: { de: 'neubau', fr: 'fr/neuf', en: 'en/new-homes' },
  about: { de: 'ueber-uns', fr: 'fr/a-propos', en: 'en/about' },
  contact: { de: 'kontakt', fr: 'fr/contact', en: 'en/contact' },
  legal: { de: 'legal', fr: 'fr/legal', en: 'en/legal' },
  privacy: { de: 'privacy', fr: 'fr/privacy', en: 'en/privacy' },
} satisfies Record<string, Record<Lang, string>>;

export default [
  ...page(R.home, 'home.tsx', 'home'),
  ...page(R.buy, 'search.tsx', 'buy'),
  ...page(R.rent, 'search.tsx', 'rent'),
  ...page(sub(R.listing, ':slug'), 'listing.tsx', 'listing'),
  ...page(R.sell, 'sell.tsx', 'sell'),
  ...page(R.sold, 'sold.tsx', 'sold'),
  ...page(R.team, 'team.tsx', 'team'),
  ...page(sub(R.team, ':slug'), 'agent.tsx', 'agent'),
  ...page(R.offices, 'offices.tsx', 'offices'),
  ...page(sub(R.offices, ':slug'), 'office.tsx', 'office'),
  ...page(R.areas, 'regions.tsx', 'regions'),
  ...page(sub(R.areas, ':slug'), 'region.tsx', 'region'),
  ...page(R.developments, 'developments.tsx', 'developments'),
  ...page(sub(R.developments, ':slug'), 'development.tsx', 'development'),
  ...page(sub(R.developments, ':slug/:unit'), 'unit.tsx', 'unit'),
  ...page(R.about, 'about.tsx', 'about'),
  ...page(R.contact, 'contact.tsx', 'contact'),
  ...page(R.legal, 'legal.tsx', 'legal'),
  ...page(R.privacy, 'legal.tsx', 'privacy'),
  route('api/enquiry', 'routes/api.enquiry.ts'),
  route('sitemap.xml', 'routes/sitemap.ts'),
  route('robots.txt', 'routes/robots.ts'),
  route('*', 'routes/404.tsx', { id: 'not-found' }),
] satisfies RouteConfig;
