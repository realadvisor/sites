import { type RouteConfig, route } from '@react-router/dev/routes';

// Same URLs as the Astro version (src/pages/): Spanish unprefixed, English
// under /en. One route module per page type serves both languages (the
// language comes from the path: lib/i18n langOfPath).
const both = (es: string, en: string, file: string, id: string) => [
  route(es, file, { id: `${id}-es` }),
  route(en, file, { id: `${id}-en` }),
];

export default [
  ...both('', 'en', 'routes/home.tsx', 'home'),
  ...both('comprar', 'en/buy', 'routes/search.tsx', 'buy'),
  ...both('alquilar', 'en/rent', 'routes/search.tsx', 'rent'),
  ...both('inmueble/:slug', 'en/property/:slug', 'routes/listing.tsx', 'listing'),
  ...both('vender', 'en/sell', 'routes/sell.tsx', 'sell'),
  ...both('vendidas', 'en/sold', 'routes/sold.tsx', 'sold'),
  ...both('equipo', 'en/team', 'routes/team.tsx', 'team'),
  ...both('equipo/:slug', 'en/team/:slug', 'routes/agent.tsx', 'agent'),
  ...both('contacto', 'en/contact', 'routes/contact.tsx', 'contact'),
  ...both('zonas', 'en/areas', 'routes/areas.tsx', 'areas'),
  ...both('zonas/:town', 'en/areas/:town', 'routes/area.tsx', 'area'),
  ...both('nosotros', 'en/about', 'routes/about.tsx', 'about'),
  ...both('blog', 'en/blog', 'routes/blog.tsx', 'blog'),
  ...both('blog/:slug', 'en/blog/:slug', 'routes/post.tsx', 'post'),
  ...both('legal', 'en/legal', 'routes/legal.tsx', 'legal'),
  ...both('privacy', 'en/privacy', 'routes/legal.tsx', 'privacy'),
  route('api/enquiry', 'routes/api.enquiry.ts'),
  route('sitemap.xml', 'routes/sitemap.ts'),
  route('robots.txt', 'routes/robots.ts'),
  route('*', 'routes/404.tsx', { id: 'not-found' }),
] satisfies RouteConfig;
