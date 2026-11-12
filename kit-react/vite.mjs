/**
 * The kit's Vite plugin for a React Router site: everything the site's
 * vite.config.ts needs from the kit, so it stays three plugins.
 *
 *   import { reactRouter } from '@react-router/dev/vite';
 *   import { cloudflare } from '@cloudflare/vite-plugin';
 *   import sitesKit from '@realadvisor/sites-kit-react/vite';
 *   export default defineConfig({
 *     plugins: [cloudflare({ viteEnvironment: { name: 'ssr' } }), reactRouter(), sitesKit()],
 *   });
 *
 * It adds:
 * - `virtual:sites-kit/site` (site.json with its defaults), the module the
 *   Astro kit's lib/ (format, i18n, legal, search, developments) reads: the
 *   React kit reuses those files as they are;
 * - `virtual:sites-kit-react/client`: the URL of the site's one browser
 *   script (`app/client.ts`: the kit's behaviours and the site's islands),
 *   bundled as its own chunk; `<KitScripts>` loads it (never inline);
 * - `inlineCss: true` (opt-in): the Worker inlines the page's stylesheets
 *   (`<style>`, allowed by the kit's style-src) instead of linking them, so
 *   the first paint waits for no CSS request (`virtual:sites-kit-react/css`);
 * - the kit's ~300-byte preload helper in place of Vite's ~2 KB one (PRELOAD);
 * - `import '…/styles/kit.css'` from JS = one import per part (KIT_CSS):
 *   the kit's CSS sits exactly where root.tsx imports it, as in Astro;
 * - build/client/_headers: security headers for static files (no nonce:
 *   static files have no inline script);
 * - the settings the CSP and the CRM preview depend on (no inlined JS, every
 *   host for the sandbox preview, the kit sources compiled like the site's).
 *
 * Plain JS on purpose: vite.config loads it natively.
 */
import { existsSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readSiteConfig, SITE_CONFIG_FILE } from '@realadvisor/sites-kit-core/site-config';
import { securityHeaders } from '@realadvisor/sites-kit-core/security';

const SITE_ID = 'virtual:sites-kit/site';
const CLIENT_ID = 'virtual:sites-kit-react/client';
const CSS_ID = 'virtual:sites-kit-react/css';
const resolved = (id) => `\0${id}`;
const KIT_PACKAGES = ['@realadvisor/sites-kit-core', '@realadvisor/sites-kit-react', '@realadvisor/sites-sdk'];

/**
 * PRELOAD: Vite wraps every dynamic `import()` of the browser build in its
 * preload helper (~2 KB: link bookkeeping, CSP nonce lookup, error events),
 * and `build.modulePreload: false` does not remove it. Astro pages without a
 * kit part ship ~0 KB; so the kit loads this one under Vite's own virtual
 * module id instead: the same contract (the chunk's CSS loads before it runs,
 * its JS imports preload in parallel), about 350 bytes.
 */
const PRELOAD_ID = '\0vite/preload-helper.js';

/**
 * KIT_CSS: `import '@realadvisor/sites-kit-react/styles/kit.css'` from a JS
 * module becomes one JS import per part (the Astro kit's form.css, then
 * search, pager, map, consent): no `@import` for the CSS bundler to hoist,
 * so the kit's rules sit exactly where root.tsx imports kit.css (Astro: where
 * the layout imports ConsentBanner), and a site that imports a part itself
 * gets it once.
 */
const KIT_CSS_ID = '\0sites-kit-react/kit.css.js';
const KIT_DIR = fileURLToPath(new URL('.', import.meta.url));
const KIT_PARTS = ['search', 'pager', 'map', 'consent'].map((p) => join(KIT_DIR, 'styles', `${p}.css`));
const isKitCss = (id) => id === '@realadvisor/sites-kit-react/styles/kit.css' || resolve(id) === join(KIT_DIR, 'styles', 'kit.css');
const preloadHelper = (base) => `const base = ${JSON.stringify(base)};
export const __vitePreload = (load, deps) => {
  if (!deps || !deps.length) return load();
  return Promise.all(deps.map((dep) => {
    const href = base + dep;
    const css = dep.endsWith('.css');
    if (document.querySelector('link[href="' + href + '"]')) return;
    const link = document.createElement('link');
    link.rel = css ? 'stylesheet' : 'modulepreload';
    link.href = href;
    document.head.append(link);
    if (css) return new Promise((done) => { link.onload = link.onerror = done; });
  })).then(load);
};
`;

/**
 * @param {{ client?: string; inlineCss?: boolean }} [opts] `client`: the site's browser entry, relative to the root (default `app/client.ts`).
 *   `inlineCss`: inline every stylesheet of a page into it (default false).
 * @returns {import('vite').Plugin}
 */
export default function sitesKit(opts = {}) {
  const clientEntry = opts.client ?? 'app/client.ts';
  let root = process.cwd();
  let base = '/';
  let command = 'serve';
  /** The built client entry, set by the client build (React Router builds it before the server). */
  const built = { src: '', preload: /** @type {string[]} */ ([]) };
  /** Built stylesheets by URL (inlineCss). */
  const css = /** @type {Record<string, string>} */ ({});
  let clientId = '';

  return {
    name: 'sites-kit-react',
    // Before Vite's resolver: kit.css (KIT_CSS) and the preload helper (PRELOAD) are the kit's.
    enforce: 'pre',
    config() {
      return {
        // Sandbox previews are served on *.vercel.run; host: every interface.
        server: { host: true, allowedHosts: true },
        // The kits ship TypeScript sources: Vite compiles them like the site's own.
        ssr: { noExternal: KIT_PACKAGES },
        optimizeDeps: { exclude: KIT_PACKAGES },
        build: {
          // Never inline a script as a data: URL: every script is a file of this site ('self').
          assetsInlineLimit: (file) => (file.endsWith('.js') || file.endsWith('.ts') ? false : undefined),
        },
      };
    },
    configResolved(c) {
      root = c.root;
      base = c.base || '/';
      command = c.command;
      // Fails the build early on a broken site.json, naming the field.
      readSiteConfig(root);
    },
    configureServer(server) {
      server.watcher.add(join(root, SITE_CONFIG_FILE));
      server.watcher.on('change', (f) => {
        if (resolve(f) === resolve(root, SITE_CONFIG_FILE)) server.restart();
      });
    },
    async buildStart() {
      if (command !== 'build' || this.environment?.name !== 'client') return;
      const file = resolve(root, clientEntry);
      if (!existsSync(file)) return;
      clientId = file;
      this.emitFile({ type: 'chunk', id: file, name: 'site' });
    },
    resolveId(id, importer) {
      if (id === SITE_ID || id === CLIENT_ID || id === CSS_ID) return resolved(id);
      // From JS only: an @import inside a stylesheet stays plain CSS.
      if (importer && !/\.(css|scss|sass|less)(\?|$)/.test(importer) && isKitCss(id.split('?')[0])) return KIT_CSS_ID;
      return undefined;
    },
    async load(id) {
      if (id === KIT_CSS_ID) {
        const form = await this.resolve('@realadvisor/sites-kit-core/styles/form.css', join(KIT_DIR, 'components', 'EnquiryForm.tsx'));
        return [form?.id ?? '@realadvisor/sites-kit-core/styles/form.css', ...KIT_PARTS].map((f) => `import ${JSON.stringify(f)};`).join('\n');
      }
      // The browser build: the kit's small preload helper instead of Vite's (see PRELOAD).
      if (id === PRELOAD_ID && command === 'build' && this.environment?.config.consumer === 'client' && base.startsWith('/')) return preloadHelper(base);
      if (id === resolved(SITE_ID)) return `export default ${JSON.stringify(readSiteConfig(root))};`;
      if (id === resolved(CSS_ID)) return `export default ${JSON.stringify(command === 'build' && opts.inlineCss ? css : {})};`;
      if (id === resolved(CLIENT_ID)) {
        if (command === 'serve') {
          const file = resolve(root, clientEntry);
          const src = existsSync(file) ? `${base}${relative(root, file).split('\\').join('/')}` : '';
          return `export default ${JSON.stringify({ src, preload: [] })};`;
        }
        return `export default ${JSON.stringify(built)};`;
      }
      return undefined;
    },
    generateBundle(_out, bundle) {
      if (this.environment?.name !== 'client') return;
      if (opts.inlineCss) {
        for (const f of Object.values(bundle)) {
          if (f.type === 'asset' && f.fileName.endsWith('.css')) css[`${base}${f.fileName}`] = String(typeof f.source === 'string' ? f.source : new TextDecoder().decode(f.source));
        }
      }
      if (!clientId) return;
      const chunk = Object.values(bundle).find((c) => c.type === 'chunk' && c.facadeModuleId === clientId);
      if (!chunk || chunk.type !== 'chunk') return;
      built.src = `${base}${chunk.fileName}`;
      built.preload = chunk.imports.map((f) => `${base}${f}`);
    },
    writeBundle(out) {
      if (this.environment?.name !== 'client' || !out.dir) return;
      // Static files (assets, favicon): preview-safe frame-ancestors, as the Astro kit writes them.
      const lines = Object.entries(securityHeaders(true)).map(([k, v]) => `  ${k}: ${v}`);
      writeFileSync(join(out.dir, '_headers'), `/*\n${lines.join('\n')}\n  strict-transport-security: max-age=31536000; includeSubDomains\n`);
    },
  };
}
