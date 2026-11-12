/** Types of the Astro and kit virtual modules the kit's own files import. */
declare module 'virtual:sites-kit/site' {
  const site: import('@realadvisor/sites-kit/site-config').SiteConfig;
  export default site;
}
declare module 'virtual:sites-kit/fixtures' {
  const fixtures: Record<string, { default: unknown }>;
  export default fixtures;
}
declare module 'astro:env/server' {
  export const SITES_API_KEY: string | undefined;
  export const SITES_API_URL: string | undefined;
  export const SITES_FIXTURE: string | undefined;
}
