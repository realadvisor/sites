// @ts-check
// Everything the kit needs (middleware, security headers, data env, dev
// server settings) comes from its integration; add only what this site adds.
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import sitesKit from '@realadvisor/sites-kit/astro';

export default defineConfig({
  adapter: cloudflare({
    imageService: 'passthrough', // remote photos go through imgproxy (@realadvisor/sites-kit/image)
    platformProxy: { enabled: true },
  }),
  integrations: [sitesKit()],
});
