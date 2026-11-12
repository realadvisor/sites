import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site, url }) =>
  new Response(`User-agent: *\nAllow: /\nSitemap: ${new URL('/sitemap.xml', site ?? url).href}\n`, {
    headers: { 'content-type': 'text/plain' },
  });
