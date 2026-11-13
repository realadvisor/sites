# RealAdvisor Sites

The building blocks of RealAdvisor agency and new-build websites: the data
SDK, a shared kit core, an Astro kit, a React Router kit, the starter template and twelve example
sites. RealAdvisor's site agent builds client sites from these parts, and they
work the same for a developer building a site by hand.

| Folder | Imported as (on npm) | What |
| --- | --- | --- |
| `sdk/` | `@realadvisor/sites-sdk` (`@realadvisor-sites/sdk`) | The data client: an agency's organisation, teams, agents, listings and developments from the RealAdvisor API, plus enquiries. No dependencies, web standards only. Fixture mode for work without an API key. |
| `kit-core/` | `@realadvisor/sites-kit-core` (`@realadvisor-sites/kit-core`) | What both kits share: data helpers, i18n, formatting, legal texts, SEO, search, images, security headers, the browser scripts, the `sites-kit` tools (fixture, screenshot, deploy check) and the rules a site follows (`AGENTS.md`, `DESIGN.md`). |
| `kit-astro/` | `@realadvisor/sites-kit-astro` (`@realadvisor-sites/kit-astro`) | The Astro 5 kit for Cloudflare Workers: integration, middleware, the `ra` data client, components (images, legal, consent, enquiry form, listings search and map). |
| `kit-react/` | `@realadvisor/sites-kit-react` (`@realadvisor-sites/kit-react`) | The React Router 7 kit: a Worker with a per-request CSP nonce, the same parts and the same deploy check. |
| `template/` | | The starter a new Astro site is copied from. |
| `examples/` | | Twelve fictional sites, each in Astro and React Router. See `examples/README.md`. |

Every name, person, address and text in the fixtures and examples is invented.
Photos are free Pexels photos (see License).

## Work on it

Node 22.18 or later and pnpm 10.

```bash
pnpm test                 # SDK and kit-core tests
pnpm check:template       # template: install, astro check and build, deploy check
pnpm check:examples       # all 24 example sites (slow)
```

In this repo the template and examples depend on the packages by path
(`file:../kit-core`, `file:../kit-astro`, `file:../sdk`), so a change to a package shows in a site at its
next `pnpm install`. A site outside this repo installs a published version
from npm and pins it in its lockfile. The packages are published under the
`@realadvisor-sites` scope and installed under the names the code imports,
with npm aliases. An Astro site:

```json
"@realadvisor/sites-kit-astro": "npm:@realadvisor-sites/kit-astro@^0.4.0",
"@realadvisor/sites-kit-core": "npm:@realadvisor-sites/kit-core@^0.4.0",
"@realadvisor/sites-sdk": "npm:@realadvisor-sites/sdk@^0.4.0"
```

A React Router site takes `@realadvisor/sites-kit-react` instead of the Astro kit.

## Release

The four packages are published to npm together, one version for all four.
Read [AGENTS.md](AGENTS.md) before changing them: every version needs an
entry in [kit-core/CHANGELOG.md](kit-core/CHANGELOG.md), which sites read to
upgrade.

```bash
node scripts/set-version.mjs 0.4.0   # versions and the peer ranges between the packages
# add "## 0.4.0" to kit-core/CHANGELOG.md, with Upgrade steps if sites must change
node scripts/check-pack.mjs          # every export and bin is in the tarball, no tests
```

Merge that change, then tag the merge commit `v0.4.0` and push the tag. The
Publish workflow checks the tag against the versions, runs the tests and the
template check, and **stages** the SDK, the core, the Astro kit and the React
kit, in that order, with npm provenance. A version already on npm is skipped.

A staged version is not live yet: a maintainer of `@realadvisor-sites` approves
each one on npmjs.com, or with `npm stage list` and `npm stage approve <id>`,
which asks for 2FA. Only then can sites install it. Approve the SDK and the
core before the kits, which name them as peers.

The workflow uses npm trusted publishing: on npmjs.com each package trusts
`realadvisor/sites` and `.github/workflows/publish.yaml`, allowed to stage
only, so no npm token is stored and no version reaches sites without a human
approval. A package must exist before it can trust a workflow, so the first
version of a new package is published by hand (`npm publish
--provenance=false` in its folder, logged in as `realadvisor-sites`).

Live data needs a site key from RealAdvisor (`SITES_API_URL`, `SITES_API_KEY`).
Without one, every site runs on its fixture.

## License

The code in this repo (the SDK, the kits, the template and the example
sites) is MIT licensed, see [LICENSE](LICENSE). The photos the fixtures and
examples link to are free photos from [Pexels](https://www.pexels.com) under
the [Pexels license](https://www.pexels.com/license/), not MIT: use them only
as that license allows. RealAdvisor names and logos are not covered by the
MIT license.
