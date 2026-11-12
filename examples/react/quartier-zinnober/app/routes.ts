import { type RouteConfig, index, route } from '@react-router/dev/routes';

// Same URLs as the Astro version (src/pages/).
export default [
  index('routes/home.tsx'),
  route('wohnungen', 'routes/wohnungen.tsx'),
  route('wohnungen/:slug', 'routes/unit.tsx'),
  route('kontakt', 'routes/kontakt.tsx'),
  route('lage', 'routes/lage.tsx'),
  route('galerie', 'routes/galerie.tsx'),
  route('news', 'routes/news.tsx'),
  route('dokumente', 'routes/dokumente.tsx'),
  route('legal', 'routes/legal.tsx'),
  route('privacy', 'routes/privacy.tsx'),
  route('api/enquiry', 'routes/api.enquiry.ts'),
  route('sitemap.xml', 'routes/sitemap.ts'),
  route('robots.txt', 'routes/robots.ts'),
  route('*', 'routes/404.tsx', { id: 'not-found' }),
] satisfies RouteConfig;
