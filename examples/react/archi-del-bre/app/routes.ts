import { type RouteConfig, index, route } from '@react-router/dev/routes';

// Same URLs as the Astro version (src/pages/): Italian unprefixed, German under /de.
// One module per page; the language comes from the path (lib/routes.ts langOf).
const both = (it: string, de: string, file: string, id: string) => [route(it, file, { id: `${id}-it` }), route(de, file, { id: `${id}-de` })];

export default [
  index('routes/home.tsx', { id: 'home-it' }),
  route('de', 'routes/home.tsx', { id: 'home-de' }),
  ...both('appartamenti', 'de/wohnungen', 'routes/units.tsx', 'units'),
  ...both('appartamenti/confronto', 'de/wohnungen/vergleich', 'routes/compare.tsx', 'compare'),
  ...both('appartamenti/:slug', 'de/wohnungen/:slug', 'routes/unit.tsx', 'unit'),
  ...both('posizione', 'de/lage', 'routes/location.tsx', 'location'),
  ...both('galleria', 'de/galerie', 'routes/gallery.tsx', 'gallery'),
  ...both('documenti', 'de/dokumente', 'routes/documents.tsx', 'documents'),
  ...both('contatti', 'de/kontakt', 'routes/contact.tsx', 'contact'),
  ...both('legal', 'de/legal', 'routes/legal.tsx', 'legal'),
  ...both('privacy', 'de/privacy', 'routes/legal.tsx', 'privacy'),
  route('api/enquiry', 'routes/api.enquiry.ts'),
  route('sitemap.xml', 'routes/sitemap.ts'),
  route('robots.txt', 'routes/robots.ts'),
  route('*', 'routes/404.tsx', { id: 'not-found' }),
] satisfies RouteConfig;
