# Changelog

The SDK, kit-core, kit-astro and kit-react are released together, one version
for all four. This file ships inside `@realadvisor-sites/kit-core`, so a site
reads it at `node_modules/@realadvisor/sites-kit-core/CHANGELOG.md`.

Each version has an entry. An `### Upgrade` section lists what a site must
change when it moves to that version. When there is no Upgrade section, bumping
the versions is enough.

To upgrade a site, read every entry newer than the site's current version,
oldest first, and apply each Upgrade step in order.

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
