import { type RouteConfig, index, route } from '@react-router/dev/routes';

// Same URLs as the Astro version (src/pages/): Spanish unprefixed, English under /en.
// One route module per page; the language comes from the path (lib/i18n langOfPath).
export default [
  index('routes/home.tsx', { id: 'home-es' }),
  route('en', 'routes/home.tsx', { id: 'home-en' }),
  route('viviendas', 'routes/units.tsx', { id: 'units-es' }),
  route('en/homes', 'routes/units.tsx', { id: 'units-en' }),
  route('viviendas/:slug', 'routes/unit.tsx', { id: 'unit-es' }),
  route('en/homes/:slug', 'routes/unit.tsx', { id: 'unit-en' }),
  route('planos', 'routes/plans.tsx', { id: 'plans-es' }),
  route('en/floor-plans', 'routes/plans.tsx', { id: 'plans-en' }),
  route('barrio', 'routes/area.tsx', { id: 'area-es' }),
  route('en/neighbourhood', 'routes/area.tsx', { id: 'area-en' }),
  route('galeria', 'routes/gallery.tsx', { id: 'gallery-es' }),
  route('en/gallery', 'routes/gallery.tsx', { id: 'gallery-en' }),
  route('documentos', 'routes/docs.tsx', { id: 'docs-es' }),
  route('en/documents', 'routes/docs.tsx', { id: 'docs-en' }),
  route('contacto', 'routes/contact.tsx', { id: 'contact-es' }),
  route('en/contact', 'routes/contact.tsx', { id: 'contact-en' }),
  route('legal', 'routes/legal.tsx', { id: 'legal-es' }),
  route(':lang/legal', 'routes/legal.tsx', { id: 'legal-lang' }),
  route('privacy', 'routes/privacy.tsx', { id: 'privacy-es' }),
  route(':lang/privacy', 'routes/privacy.tsx', { id: 'privacy-lang' }),
  route('api/enquiry', 'routes/api.enquiry.ts'),
  route('sitemap.xml', 'routes/sitemap.ts'),
  route('robots.txt', 'routes/robots.ts'),
  route('*', 'routes/404.tsx', { id: 'not-found' }),
] satisfies RouteConfig;
