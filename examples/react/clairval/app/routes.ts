import { type RouteConfig, index, route } from '@react-router/dev/routes';

// Same URLs as the Astro version (src/pages/): English unprefixed, French under
// /fr with French paths (lib/routes.ts ROUTES). One module per page type; the
// loader reads the language from the path (langOfPath).
type Lang = 'en' | 'fr';
const page = (paths: Record<Lang, string>, file: string, id: string) =>
  (['en', 'fr'] as const).map((l) =>
    paths[l] === '' ? index(`routes/${file}`, { id: `${l}-${id}` }) : route(paths[l], `routes/${file}`, { id: `${l}-${id}` }),
  );
const sub = (base: Record<Lang, string>, tail: string) =>
  Object.fromEntries(Object.entries(base).map(([l, p]) => [l, p ? `${p}/${tail}` : tail])) as Record<Lang, string>;

const R = {
  home: { en: '', fr: 'fr' },
  buy: { en: 'buy', fr: 'fr/acheter' },
  rent: { en: 'rent', fr: 'fr/louer' },
  listing: { en: 'property', fr: 'fr/bien' },
  sell: { en: 'sell', fr: 'fr/vendre' },
  sold: { en: 'sold', fr: 'fr/vendus' },
  team: { en: 'team', fr: 'fr/equipe' },
  offices: { en: 'offices', fr: 'fr/bureaux' },
  destinations: { en: 'destinations', fr: 'fr/destinations' },
  journal: { en: 'journal', fr: 'fr/journal' },
  about: { en: 'about', fr: 'fr/a-propos' },
  contact: { en: 'contact', fr: 'fr/contact' },
  legal: { en: 'legal', fr: 'fr/legal' },
  privacy: { en: 'privacy', fr: 'fr/privacy' },
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
  ...page(R.destinations, 'destinations.tsx', 'destinations'),
  ...page(sub(R.destinations, ':slug'), 'destination.tsx', 'destination'),
  ...page(R.journal, 'journal.tsx', 'journal'),
  ...page(sub(R.journal, ':slug'), 'post.tsx', 'post'),
  ...page(R.about, 'about.tsx', 'about'),
  ...page(R.contact, 'contact.tsx', 'contact'),
  ...page(R.legal, 'legal.tsx', 'legal'),
  ...page(R.privacy, 'legal.tsx', 'privacy'),
  route('api/enquiry', 'routes/api.enquiry.ts'),
  route('sitemap.xml', 'routes/sitemap.ts'),
  route('robots.txt', 'routes/robots.ts'),
  route('*', 'routes/404.tsx', { id: 'not-found' }),
] satisfies RouteConfig;
