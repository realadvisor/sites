import { type RouteConfig, index, route } from '@react-router/dev/routes';

// Same URLs as the Astro version (src/pages/).
export default [
  index('routes/home.tsx'),
  route('appartements', 'routes/appartements.tsx'),
  route('appartements/:slug', 'routes/unit.tsx'),
  route('situation', 'routes/situation.tsx'),
  route('galerie', 'routes/galerie.tsx'),
  route('documents', 'routes/documents.tsx'),
  route('contact', 'routes/contact.tsx'),
  route('legal', 'routes/legal.tsx'),
  route('privacy', 'routes/privacy.tsx'),
  route('api/enquiry', 'routes/api.enquiry.ts'),
  route('sitemap.xml', 'routes/sitemap.ts'),
  route('robots.txt', 'routes/robots.ts'),
  route('*', 'routes/404.tsx', { id: 'not-found' }),
] satisfies RouteConfig;
