# RealAdvisor Sites

The building blocks of RealAdvisor agency and new-build websites: the data
SDK, an Astro kit, a React Router kit, the starter template and twelve example
sites. RealAdvisor's site agent builds client sites from these parts, and they
work the same for a developer building a site by hand.

| Folder | Package | What |
| --- | --- | --- |
| `sdk/` | `@realadvisor/sites-sdk` | The data client: an agency's organisation, teams, agents, listings and developments from the RealAdvisor API, plus enquiries. No dependencies, web standards only. Fixture mode for work without an API key. |
| `kit/` | `@realadvisor/sites-kit` | The Astro 5 kit for Cloudflare Workers: integration, middleware, components (images, legal, consent, enquiry form, listings search and map), the deploy check and the rules a site follows (`AGENTS.md`, `DESIGN.md`). |
| `kit-react/` | `@realadvisor/sites-kit-react` | The React Router 7 version of the kit: a Worker with a per-request CSP nonce, the same parts and the same deploy check. |
| `template/` | | The starter a new Astro site is copied from. |
| `examples/` | | Twelve fictional sites, each in Astro and React Router. See `examples/README.md`. |

Every name, person, address and text in the fixtures and examples is invented.
Photos are free Pexels photos.

## Work on it

Node 22.18 or later and pnpm 10.

```bash
pnpm test                 # SDK and kit tests
pnpm check:template       # template: install, astro check and build, deploy check
pnpm check:examples       # all 24 example sites (slow)
```

Sites depend on the packages by path (`file:../kit`, `file:../sdk`), so a
change to a package shows in a site at its next `pnpm install`.

Live data needs a site key from RealAdvisor (`SITES_API_URL`, `SITES_API_KEY`).
Without one, every site runs on its fixture.
