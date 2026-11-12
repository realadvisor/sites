/**
 * Types of the kit's virtual modules and plain-JS kit files. A site's
 * tsconfig includes it: "include": ["node_modules/@realadvisor/sites-kit-react/env.d.ts", ...].
 */
declare module 'virtual:sites-kit/site' {
  const site: import('@realadvisor/sites-kit-core/site-config').SiteConfig;
  export default site;
}
declare module 'virtual:sites-kit-react/client' {
  /** The site's bundled browser script and its static imports. */
  const client: { src: string; preload: string[] };
  export default client;
}
declare module 'virtual:sites-kit-react/css' {
  /** Built stylesheets by URL when sitesKit({ inlineCss: true }), else empty. */
  const css: Record<string, string>;
  export default css;
}
interface ImportMetaEnv {
  readonly SITE_URL?: string;
}
// The Astro kit's files the React kit reads also import these (types only here).
declare module 'astro:env/server' {
  export const SITES_API_URL: string | undefined;
  export const SITES_API_KEY: string | undefined;
  export const SITES_FIXTURE: string | undefined;
}
declare module 'virtual:sites-kit/fixtures' {
  const fixtures: Record<string, { default: import('@realadvisor/sites-kit-core').SiteFixture }>;
  export default fixtures;
}
declare module '@realadvisor/sites-kit-core/security' {
  export const ALLOWED_HOSTS: { img: string[]; script: string[]; connect: string[]; frame: string[] };
  export function csp(preview: boolean): string;
  export function securityHeaders(preview: boolean): Record<string, string>;
}
