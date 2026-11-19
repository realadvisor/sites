# Changelog

The SDK, kit-core, kit-astro and kit-react are released together, one version
for all four. This file ships inside `@realadvisor-sites/kit-core`, so a site
reads it at `node_modules/@realadvisor/sites-kit-core/CHANGELOG.md`.

Each version has an entry. An `### Upgrade` section lists what a site must
change when it moves to that version. When there is no Upgrade section, bumping
the versions is enough.

To upgrade a site, read every entry newer than the site's current version,
oldest first, and apply each Upgrade step in order.

## 0.5.3

- A published production site (`SITE_MODE=production`) keeps its data reads
  in the colo's Cache API. A page served again makes no request to the data
  API for 60 seconds. After that the stale copy answers at once and refreshes
  in the background, for up to 24 hours. A listing or development not found
  is kept 60 seconds. Previews and dev read live.
- When the data API times out or answers a 5xx, the stale copy answers
  instead of the 500 page.
- A data read gives up after 3 seconds, down from 8. An enquiry keeps 8.
- SDK: `createClient({ cache })` turns the cache on (`true`, or
  `{ waitUntil, store }`). It is off by default.
- kit-core: `withRequestContext(ctx, fn)` and `dataCache(prodBuild)` in
  `env`. The Astro middleware and the React Worker call the first.

## 0.5.2

- Every page that fails to render, and every enquiry refused for its site
  key, writes one JSON line to the Worker logs with `"event": "site_error"`,
  `source` (`page` or `enquiry`), `code` (`site_key` when the data API refused
  the key, else the API's code or `render`), `status`, `api_status`, `site`
  and `worker` (from `SITE_SLUG` and `SITE_WORKER` when the publish sets
  them), `host` and `path`. A monitor matches `event`. The site key never
  appears in it.
- The kit's 500 page answers in the language of the path (`/en/...` on a
  multilingual site), else the site's (`site.json` `locale`), else English.
- kit-react: `handleError` in `entry.server` logs a failed loader or render
  as that line. Without it, the Worker still logs each 500 answer, with less
  detail.
- The examples' `ServerError` pages take their text from `serverErrorText()`
  instead of copy written in one language.

### Upgrade

- React Router site: in `app/entry.server.tsx`, export `handleError` too:
  `export { default, handleError, streamTimeout } from '@realadvisor/sites-kit-react/entry.server';`
- React Router site: if `ServerError` in `app/routes/404.tsx` has its text
  written out, take it from
  `serverErrorText(lang(usePageLocale()))` (`@realadvisor/sites-kit-core/render-error`).

## 0.5.1

- kit-react: the dev server can always be framed by the CRM preview, whatever
  `SITE_MODE` says. The CRM sandbox runs dev with `SITE_MODE=production` (so
  preview enquiries send), which made the React kit send
  `X-Frame-Options: DENY` and the preview stayed blank. Published sites keep
  their headers unchanged.

## 0.5.0

- React Router is the default: `template/` is now a React Router 7 starter,
  the Astro starter moved to `template-astro/`.
- The rules split in three: `kit-core/AGENTS.md` (every site),
  `kit-react/AGENTS.md` and `kit-astro/AGENTS.md` (the framework).
- Taste judge: `kit-core/TASTE.md` (13-line rubric against the chosen
  example), `kit-core/critic/CRITIC.md` and `sites-kit critic` (inputs for a
  separate critic), `sites-kit critic calibrate`, and `taste:` checks in
  `pnpm screenshot` (header height, logo by shape, saturated fields, accent
  hues, line length, body size, soft photos, lede styles, font families,
  grid).
- Logo size by shape: a tall or square mark is 40–72px tall; a wide
  wordmark keeps the 100px minimum width, at most 72px tall.
- kit-react: `RaImage` preloads with a hoisted `<link>` (no `react-dom`
  import, which the dev server loaded as raw CommonJS); dev-only preview
  bridge through `SITES_PREVIEW_BRIDGE`.
- `sites-kit fixture` writes `app/data/fixture.json` on a React Router site.

### Upgrade

1. Astro site: in `CLAUDE.md`, after the line
   `@node_modules/@realadvisor/sites-kit-core/AGENTS.md`, add
   `@node_modules/@realadvisor/sites-kit-astro/AGENTS.md`; after
   `@node_modules/@realadvisor/sites-kit-core/DESIGN.md`, add
   `@node_modules/@realadvisor/sites-kit-core/TASTE.md`.
2. React Router site: in `CLAUDE.md`, after the line
   `@node_modules/@realadvisor/sites-kit-core/AGENTS.md`, add
   `@node_modules/@realadvisor/sites-kit-react/AGENTS.md` (when missing);
   after `@node_modules/@realadvisor/sites-kit-core/DESIGN.md`, add
   `@node_modules/@realadvisor/sites-kit-core/TASTE.md`.
3. Run `pnpm screenshot` and fix any new `taste:` line, or name the reason
   to keep it in `DESIGN-NOTES.md`.

## 0.4.2

- This changelog, shipped in kit-core.

## 0.4.1

- First release through the Publish workflow: staged on npm with provenance,
  approved by a maintainer with 2FA.
- `bin` paths without `./`.

## 0.4.0

- The kit is split into `kit-core` (framework-neutral) and `kit-astro` (the
  Astro integration). `@realadvisor-sites/kit` is deprecated.

### Upgrade

1. In `package.json`, replace `@realadvisor/sites-kit` with two packages, both at
   the same version as the SDK:
   ```json
   "@realadvisor/sites-kit-core": "npm:@realadvisor-sites/kit-core@0.4.0",
   "@realadvisor/sites-kit-astro": "npm:@realadvisor-sites/kit-astro@0.4.0"
   ```
2. Rename the imports. `@realadvisor/sites-kit/astro`, `/middleware`, `/ra` and
   `/components/*` move to `@realadvisor/sites-kit-astro/...`. Every other
   `@realadvisor/sites-kit/<x>` becomes `@realadvisor/sites-kit-core/<x>`.
3. In `CLAUDE.md`, load the rules from
   `node_modules/@realadvisor/sites-kit-core/AGENTS.md`.

## 0.3.0

- First version on npm.

### Upgrade

For a site that depends on the kit by path (`file:../kit`, from the monorepo
before `realadvisor/sites`):

1. Pin the published packages instead of `file:` paths (see 0.4.0 for the
   names).
2. SDK fields are snake_case: `first_name`, `property_type`, and so on, not
   `firstName`, `propertyType`.
3. A list is `{ data, pagination }`. Read `page.data` instead of `page.items`,
   and `page.pagination.total` instead of `page.total`.
