/**
 * The kit's Astro integration: everything a RealAdvisor site needs from its
 * config, so the site's astro.config.mjs is three lines.
 *
 *   import { defineConfig } from 'astro/config';
 *   import cloudflare from '@astrojs/cloudflare';
 *   import sitesKit from '@realadvisor/sites-kit-astro';
 *
 *   export default defineConfig({
 *     adapter: cloudflare({ imageService: 'passthrough', platformProxy: { enabled: true } }),
 *     integrations: [sitesKit()],
 *   });
 *
 * It adds:
 * - the middleware (Worker env per request, full render before answering,
 *   301s from site.json, security headers);
 * - `virtual:sites-kit/site` (site.json with its defaults) and
 *   `virtual:sites-kit/fixtures` (src/data/*.json) for the kit modules;
 * - the data env (SITES_API_URL, SITES_API_KEY, SITES_FIXTURE);
 * - dist/_headers (security headers for prerendered pages and assets);
 * - keepReferencedAssets (a stylesheet Astro inlines but a script still loads ships too);
 * - dev server and build settings the CRM preview and the CSP depend on.
 *
 * Plain JS on purpose: Astro loads astro.config's dependencies natively.
 */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { readSiteConfig, SITE_CONFIG_FILE } from '@realadvisor/sites-kit-core/site-config';
import { securityHeaders } from '@realadvisor/sites-kit-core/security';
import { keepReferencedAssets } from './tools/keep-assets.mjs';

const PKG = '@realadvisor/sites-kit-astro';
const CORE = '@realadvisor/sites-kit-core';
const SITE_ID = 'virtual:sites-kit/site';
const FIXTURES_ID = 'virtual:sites-kit/fixtures';
const resolved = (id) => `\0${id}`;

const TYPES = `declare module '${SITE_ID}' {
  const site: import('${CORE}/site-config').SiteConfig;
  export default site;
}
declare module '${FIXTURES_ID}' {
  const fixtures: Record<string, { default: import('${CORE}').SiteFixture }>;
  export default fixtures;
}
`;

/** @returns {import('vite').Plugin} */
function sitesKitVite(root) {
  return {
    name: 'sites-kit',
    resolveId(id) {
      if (id === SITE_ID || id === FIXTURES_ID) return resolved(id);
      return undefined;
    },
    load(id) {
      if (id === resolved(SITE_ID)) {
        return `export default ${JSON.stringify(readSiteConfig(fileURLToPath(root)))};`;
      }
      if (id === resolved(FIXTURES_ID)) {
        // Root-relative: the site's src/data, wherever the kit is installed.
        return "export default import.meta.glob('/src/data/*.json', { eager: true });";
      }
      return undefined;
    },
  };
}

/** @returns {import('astro').AstroIntegration} */
export default function sitesKit() {
  return {
    name: PKG,
    hooks: {
      'astro:config:setup': ({ config, updateConfig, addMiddleware, addWatchFile }) => {
        // Fails the build early on a broken site.json, naming the field.
        readSiteConfig(fileURLToPath(config.root));
        // A site.json change restarts the dev server, like a config change.
        addWatchFile(new URL(SITE_CONFIG_FILE, config.root));
        addMiddleware({ entrypoint: `${PKG}/middleware`, order: 'pre' });
        updateConfig({
          // Replaced at publish (SITE_URL); canonical URLs, OG and the sitemap use it.
          ...(config.site ? {} : { site: process.env.SITE_URL || 'https://example.realadvisor.site' }),
          integrations: [keepReferencedAssets()],
          // host: the sandbox preview URL reaches the dev server on every interface.
          // No port: the site's `astro dev --port` decides (default 4321).
          server: { host: true },
          // Keeps the dev toolbar out of screenshots and the CRM preview.
          devToolbar: { enabled: false },
          env: {
            schema: {
              SITES_API_URL: { type: 'string', context: 'server', access: 'public', optional: true },
              SITES_API_KEY: { type: 'string', context: 'server', access: 'secret', optional: true },
              SITES_FIXTURE: { type: 'string', context: 'server', access: 'public', optional: true },
            },
          },
          vite: {
            plugins: [sitesKitVite(config.root)],
            // Sandbox previews are served on *.vercel.run; without this Vite answers 403 "Blocked request".
            server: { allowedHosts: true },
            // The kit ships TypeScript and .astro sources: Vite compiles them like the site's own.
            ssr: { noExternal: [PKG, CORE] },
            optimizeDeps: { exclude: [PKG, CORE] },
            // Never inline <script> bundles: the CSP has no 'unsafe-inline' for scripts, so every
            // script is a /_astro/*.js file ('self'). Other assets keep Vite's default limit.
            build: { assetsInlineLimit: (file) => (file.endsWith('.js') ? false : undefined) },
          },
        });
      },
      'astro:config:done': ({ injectTypes }) => {
        injectTypes({ filename: 'sites-kit.d.ts', content: TYPES });
      },
      'astro:build:done': ({ dir }) => {
        // Preview-safe frame-ancestors: static files are shared by preview and production builds.
        const lines = Object.entries(securityHeaders(true)).map(([k, v]) => `  ${k}: ${v}`);
        writeFileSync(
          new URL('_headers', dir),
          `/*\n${lines.join('\n')}\n  strict-transport-security: max-age=31536000; includeSubDomains\n`,
        );
      },
    },
  };
}
