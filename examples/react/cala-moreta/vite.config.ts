// Everything the kit needs (site.json, the bundled browser script, static
// security headers, build settings) comes from its plugin. inlineCss: each
// page's stylesheets inline (no CSS request before the first paint, like Astro).
import { reactRouter } from '@react-router/dev/vite';
import { cloudflare } from '@cloudflare/vite-plugin';
import sitesKit from '@realadvisor/sites-kit-react/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [cloudflare({ viteEnvironment: { name: 'ssr' } }), reactRouter(), sitesKit({ inlineCss: true })],
});
