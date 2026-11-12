import { type RouteConfig, index, route } from '@react-router/dev/routes';

// Same URLs as the Astro version (src/pages/).
export default [
  index('routes/home.tsx'),
  route('kaufen', 'routes/kaufen.tsx'),
  route('mieten', 'routes/mieten.tsx'),
  route('verkaufen', 'routes/verkaufen.tsx'),
  route('verkauft', 'routes/verkauft.tsx'),
  route('ueber-uns', 'routes/ueber-uns.tsx'),
  route('kontakt', 'routes/kontakt.tsx'),
  route('team', 'routes/team.tsx'),
  route('team/:agent', 'routes/team-agent.tsx'),
  route('journal', 'routes/journal.tsx'),
  route('journal/:slug', 'routes/journal-post.tsx'),
  route('objekte/:slug', 'routes/listing.tsx'),
  route('orte/:city', 'routes/area.tsx'),
  route('legal', 'routes/legal.tsx'),
  route('privacy', 'routes/privacy.tsx'),
  route('api/enquiry', 'routes/api.enquiry.ts'),
  route('sitemap.xml', 'routes/sitemap.ts'),
  route('robots.txt', 'routes/robots.ts'),
  route('*', 'routes/404.tsx', { id: 'not-found' }),
] satisfies RouteConfig;
