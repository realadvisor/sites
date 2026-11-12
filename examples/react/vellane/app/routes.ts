import { type RouteConfig, index, route } from '@react-router/dev/routes';

// Same URLs as the Astro version (src/pages/).
export default [
  index('routes/home.tsx'),
  route('acheter', 'routes/acheter.tsx'),
  route('louer', 'routes/louer.tsx'),
  route('vendre', 'routes/vendre.tsx'),
  route('vendus', 'routes/vendus.tsx'),
  route('agences', 'routes/agences.tsx'),
  route('agences/:slug', 'routes/agences-slug.tsx'),
  route('equipe', 'routes/equipe.tsx'),
  route('equipe/:slug', 'routes/equipe-slug.tsx'),
  route('villes', 'routes/villes.tsx'),
  route('villes/:slug', 'routes/villes-slug.tsx'),
  route('annonces/:slug', 'routes/annonces-slug.tsx'),
  route('a-propos', 'routes/a-propos.tsx'),
  route('contact', 'routes/contact.tsx'),
  route('favoris', 'routes/favoris.tsx'),
  route('legal', 'routes/legal.tsx'),
  route('privacy', 'routes/privacy.tsx'),
  route('api/enquiry', 'routes/api.enquiry.ts'),
  route('sitemap.xml', 'routes/sitemap.ts'),
  route('robots.txt', 'routes/robots.ts'),
  route('*', 'routes/404.tsx', { id: 'not-found' }),
] satisfies RouteConfig;
