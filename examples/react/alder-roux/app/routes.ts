import { type RouteConfig, index, route } from '@react-router/dev/routes';
import { LANGS, ROUTES, type RouteKey } from './lib/routes';

// Same URLs as the Astro version (src/pages/): French unprefixed, German under /de.
// One module per view, mounted once per language (the loader reads the language from the path).
const both = (key: RouteKey, file: string, sub = '', name: string = key) =>
  LANGS.map((l) => {
    const path = `${ROUTES[key][l].replace(/^\//, '')}${sub}`;
    const id = `${name}-${l}`;
    return path === '' ? index(file, { id }) : route(path, file, { id });
  });

export default [
  ...both('home', 'routes/home.tsx'),
  ...both('buy', 'routes/search.tsx'),
  ...both('rent', 'routes/search.tsx'),
  ...both('listing', 'routes/listing.tsx', '/:slug'),
  ...both('sell', 'routes/sell.tsx'),
  ...both('sold', 'routes/sold.tsx'),
  ...both('team', 'routes/team.tsx'),
  ...both('team', 'routes/agent.tsx', '/:slug', 'agent'),
  ...both('offices', 'routes/offices.tsx'),
  ...both('offices', 'routes/office.tsx', '/:slug', 'office'),
  ...both('areas', 'routes/areas.tsx'),
  ...both('areas', 'routes/area.tsx', '/:slug', 'area'),
  ...both('developments', 'routes/developments.tsx'),
  ...both('developments', 'routes/development.tsx', '/:slug', 'development'),
  ...both('developments', 'routes/unit.tsx', '/:slug/:unit', 'unit'),
  ...both('about', 'routes/about.tsx'),
  ...both('contact', 'routes/contact.tsx'),
  ...both('legal', 'routes/legal.tsx'),
  ...both('privacy', 'routes/legal.tsx'),
  route('api/enquiry', 'routes/api.enquiry.ts'),
  route('sitemap.xml', 'routes/sitemap.ts'),
  route('robots.txt', 'routes/robots.ts'),
  route('*', 'routes/404.tsx', { id: 'not-found' }),
] satisfies RouteConfig;
