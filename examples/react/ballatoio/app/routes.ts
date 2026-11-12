import { type RouteConfig, index, route } from '@react-router/dev/routes';

// Same URLs as the Astro version (src/pages/): Italian unprefixed, English under /en.
// One module per page type; the loader reads the language (and offer, legal page) from the path.
const page = (it: string | null, en: string, file: string, id: string) => [
  it === null ? index(`routes/${file}`, { id: `it-${id}` }) : route(it, `routes/${file}`, { id: `it-${id}` }),
  route(en, `routes/${file}`, { id: `en-${id}` }),
];

export default [
  ...page(null, 'en', 'home.tsx', 'home'),
  ...page('comprare', 'en/buy', 'search.tsx', 'buy'),
  ...page('affittare', 'en/rent', 'search.tsx', 'rent'),
  ...page('vendere', 'en/sell', 'sell.tsx', 'sell'),
  ...page('venduti', 'en/sold', 'sold.tsx', 'sold'),
  ...page('team', 'en/team', 'team.tsx', 'team'),
  ...page('team/:slug', 'en/team/:slug', 'agent.tsx', 'agent'),
  ...page('contatti', 'en/contact', 'contact.tsx', 'contact'),
  ...page('chi-siamo', 'en/about', 'about.tsx', 'about'),
  ...page('quartieri', 'en/neighbourhoods', 'areas.tsx', 'areas'),
  ...page('quartieri/:slug', 'en/neighbourhoods/:slug', 'area.tsx', 'area'),
  ...page('journal', 'en/journal', 'journal.tsx', 'journal'),
  ...page('journal/:slug', 'en/journal/:slug', 'post.tsx', 'post'),
  ...page('immobili/:slug', 'en/homes/:slug', 'listing.tsx', 'listing'),
  ...page('legal', 'en/legal', 'legal.tsx', 'legal'),
  ...page('privacy', 'en/privacy', 'legal.tsx', 'privacy'),
  route('api/enquiry', 'routes/api.enquiry.ts'),
  route('sitemap.xml', 'routes/sitemap.ts'),
  route('robots.txt', 'routes/robots.ts'),
  route('*', 'routes/404.tsx', { id: 'not-found' }),
] satisfies RouteConfig;
