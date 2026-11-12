import { type RouteConfig, index, route } from '@react-router/dev/routes';

// Same URLs as the Astro version (src/pages/).
export default [
  index('routes/home.tsx'),
  route('programmes', 'routes/programmes.tsx'),
  route('programmes/:slug', 'routes/programme.tsx'),
  route('programmes/:slug/logements', 'routes/units.tsx'),
  route('programmes/:slug/logements/:lot', 'routes/lot.tsx'),
  route('programmes/:slug/situation', 'routes/situation.tsx'),
  route('programmes/:slug/galerie', 'routes/gallery.tsx'),
  route('programmes/:slug/documents', 'routes/documents.tsx'),
  route('a-propos', 'routes/a-propos.tsx'),
  route('contact', 'routes/contact.tsx'),
  route('legal', 'routes/legal.tsx'),
  route('privacy', 'routes/privacy.tsx'),
  route('api/enquiry', 'routes/api.enquiry.ts'),
  route('sitemap.xml', 'routes/sitemap.ts'),
  route('robots.txt', 'routes/robots.ts'),
  route('*', 'routes/404.tsx', { id: 'not-found' }),
] satisfies RouteConfig;
