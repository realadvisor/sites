# @realadvisor/sites-kit

The platform core of a RealAdvisor agency site, plus the listings search.
A site depends on it and never copies it: a published version from npm
(`"@realadvisor/sites-kit": "npm:@realadvisor-sites/kit@^0.3.0"`), or the
version crm-chat-api ships (`"file:../kit"`). Every part
except the core (data, middleware, security headers, deploy check) is an
optional helper: the coding agent writes the rest of the site itself.

| Import | What |
| --- | --- |
| `@realadvisor/sites-kit` | The data SDK re-exported (`@realadvisor/sites-sdk`, a peer: `createClient`, `createFixtureClient`, `handleEnquiry`, the snake_case types), `Agency`, `SiteFixture`, `sanitizeHtml` and the other HTML helpers (`lib/html.ts`), `listingIdFromSlug`. |
| `@realadvisor/sites-kit/astro` | `sitesKit()`, the Astro integration: middleware, security headers, data env, `site.json`. |
| `@realadvisor/sites-kit/<module>` | `ra`, `agency`, `enquiry`, `fixture`, `env`, `format`, `i18n`, `image`, `legal`, `search`, `seo`, `developments`, `render-error`, `security` (`lib/`). |
| `@realadvisor/sites-kit/components/<Name>.astro` | `ListingsSearch`, `ListingsMap`, `ListingsPager`, `EnquiryForm`, `RaImage`, `LegalContent`, `ConsentBanner`, `form/*` (`Input`, `Select`, `Combobox`, `Button`). |
| `@realadvisor/sites-kit/client/<name>` | Browser scripts behind the listing search and the map. |
| `@realadvisor/sites-kit/styles/form.css` | The form controls' shared look. |
| `@realadvisor/sites-kit/contract` | For crm-chat-api: check finding codes, site settings. |

`sites-kit <command>` (the site's `pnpm kit <command>`): `fixture`,
`screenshot`, `check deploy`, `test map`. The site's package scripts run the
usual ones (`pnpm fixture`, `pnpm screenshot`, `pnpm check:deploy`).

The rules the coding agent follows are `AGENTS.md` (engineering) and
`DESIGN.md` (design); a site's `CLAUDE.md` loads both from `node_modules`.

Sources are TypeScript and Astro, compiled by the site's Vite (no build
step). `astro.mjs`, `site-config.mjs`, `lib/security.mjs` and `tools/` are
plain JS: Astro loads its config's dependencies, and Node runs the tools,
without compiling them. The browser tools use the site's `playwright` (peer
dependency).

Sample data: `fixtures/demo-agency.json` (the fictional Demo Agency, 10
listings) and `fixtures/development-residence-exemple.json` (one development,
8 units), both SDK fixtures (the API's records) written by
`scripts/build-demo-fixture.mjs`.

Tests: `pnpm test`.
