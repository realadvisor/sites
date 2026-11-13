import { type RouteConfig, index, route } from '@react-router/dev/routes';

// One entry per URL. A multi-language site adds each language's paths
// (`/en/listings` → the same module with its own id) and the `:lang/legal`
// and `:lang/privacy` routes below cover the legal pages (kit-react AGENTS.md).
export default [
  index('routes/home.tsx'),
  route('listings', 'routes/listings.tsx'),
  route('listings/:slug', 'routes/listing.tsx'),
  route('developments', 'routes/developments.tsx'),
  route('developments/:slug', 'routes/development.tsx'),
  route('legal', 'routes/legal.tsx', { id: 'legal' }),
  route(':lang/legal', 'routes/legal.tsx', { id: 'legal-lang' }),
  route('privacy', 'routes/privacy.tsx', { id: 'privacy' }),
  route(':lang/privacy', 'routes/privacy.tsx', { id: 'privacy-lang' }),
  route('api/enquiry', 'routes/api.enquiry.ts'),
  route('sitemap.xml', 'routes/sitemap.ts'),
  route('robots.txt', 'routes/robots.ts'),
  route('*', 'routes/404.tsx', { id: 'not-found' }),
] satisfies RouteConfig;
