# @realadvisor/sites-kit-core

The framework-neutral core of a RealAdvisor site, shared by the Astro kit
(`@realadvisor/sites-kit-astro`) and the React kit
(`@realadvisor/sites-kit-react`). A site installs it next to one kit, the same
version, and never copies it:

```json
"@realadvisor/sites-kit-core": "npm:@realadvisor-sites/kit-core@^0.4.0",
"@realadvisor/sites-kit-astro": "npm:@realadvisor-sites/kit-astro@^0.4.0",
"@realadvisor/sites-sdk": "npm:@realadvisor-sites/sdk@^0.4.0"
```

In this repo the template and examples use paths instead (`file:../kit-core`).

| Import | What |
| --- | --- |
| `@realadvisor/sites-kit-core` | The data SDK re-exported (`@realadvisor/sites-sdk`, a peer: `createClient`, `createFixtureClient`, `handleEnquiry`, the snake_case types), `Agency`, `SiteFixture`, `sanitizeHtml` and the other HTML helpers (`lib/html.ts`), `listingIdFromSlug`. |
| `@realadvisor/sites-kit-core/<module>` | `agency`, `enquiry`, `fixture`, `env`, `format`, `i18n`, `image`, `legal`, `search`, `seo`, `developments`, `page-locale`, `render-error`, `security` (`lib/`). |
| `@realadvisor/sites-kit-core/client/<name>` | Browser scripts behind the listing search and map, the enquiry form, consent and the combobox. |
| `@realadvisor/sites-kit-core/styles/form.css` | The form controls' shared look. |
| `@realadvisor/sites-kit-core/site-config` | `site.json`: read and validate. |
| `@realadvisor/sites-kit-core/contract` | For crm-chat-api: check finding codes, site settings. |

The modules that need the site's config import `virtual:sites-kit/site`; each
kit's build plugin provides it. The data client `ra` is in the Astro kit
(`@realadvisor/sites-kit-astro/ra`); the React kit has its own.

`sites-kit <command>` (the site's `pnpm kit <command>`): `fixture`,
`screenshot`, `check deploy`, `test map`. The site's package scripts run the
usual ones (`pnpm fixture`, `pnpm screenshot`, `pnpm check:deploy`).

The rules the coding agent follows are `AGENTS.md` (engineering) and
`DESIGN.md` (design); a site's `CLAUDE.md` loads both from `node_modules`.

Sources are TypeScript, compiled by the site's Vite (no build step).
`site-config.mjs`, `lib/security.mjs` and `tools/` are plain JS: Astro loads
its config's dependencies, and Node runs the tools, without compiling them.
The browser tools use the site's `playwright` (peer dependency).

Sample data: `fixtures/demo-agency.json` (the fictional Demo Agency, 10
listings) and `fixtures/development-residence-exemple.json` (one development,
8 units), both SDK fixtures (the API's records) written by
`scripts/build-demo-fixture.mjs`.

Tests: `pnpm test`.
