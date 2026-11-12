# @realadvisor/sites-kit-astro

The Astro 5 kit for RealAdvisor sites on Cloudflare Workers, built on
`@realadvisor/sites-kit-core`. A site installs both, the same version:

```json
"@realadvisor/sites-kit-astro": "npm:@realadvisor-sites/kit-astro@^0.5.0",
"@realadvisor/sites-kit-core": "npm:@realadvisor-sites/kit-core@^0.5.0",
"@realadvisor/sites-sdk": "npm:@realadvisor-sites/sdk@^0.5.0"
```

In this repo the template and examples use paths instead (`file:../kit-astro`).

| Import | What |
| --- | --- |
| `@realadvisor/sites-kit-astro` | `sitesKit()`, the Astro integration: middleware, security headers, data env, `site.json`, `virtual:sites-kit/site` and `virtual:sites-kit/fixtures`. |
| `@realadvisor/sites-kit-astro/ra` | `ra`, the site's one data client: live with `SITES_API_URL` + `SITES_API_KEY`, else the fixture in `src/data/`. Server side only. |
| `@realadvisor/sites-kit-astro/components/<Name>.astro` | `ListingsSearch`, `ListingsMap`, `ListingsPager`, `EnquiryForm`, `RaImage`, `LegalContent`, `ConsentBanner`, `form/*` (`Input`, `Select`, `Combobox`, `Button`). |
| `@realadvisor/sites-kit-astro/middleware` | Added by the integration; never imported by a site. |

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import sitesKit from '@realadvisor/sites-kit-astro';

export default defineConfig({
  adapter: cloudflare({ imageService: 'passthrough', platformProxy: { enabled: true } }),
  integrations: [sitesKit()],
});
```

Everything shared with the React kit (i18n, formatting, legal texts, SEO,
search, images, security headers, browser scripts, the `sites-kit` tools and
the agent's rules in `AGENTS.md` and `DESIGN.md`) is in the core.

Sources are TypeScript and Astro, compiled by the site's Vite. `astro.mjs`
and `tools/keep-assets.mjs` are plain JS: Astro loads its config's
dependencies without compiling them.
