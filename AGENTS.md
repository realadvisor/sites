# Working on the SDK and the kits

Live customer sites pin a version of these packages and keep it until someone
upgrades them on purpose. Every change here has to keep those sites working,
and has to tell the next upgrade what to do.

## Rules

1. **Every release has a changelog entry.** Add `## <version>` to
   [kit-core/CHANGELOG.md](kit-core/CHANGELOG.md) in the same PR that sets the
   version. CI and the Publish workflow fail without it.
2. **Write the upgrade steps.** If a site's code, `package.json` or `CLAUDE.md`
   has to change, add an `### Upgrade` section: numbered, exact names, old and
   new. The site agent applies them as written, so leave nothing implied.
3. **Breaking changes go in a new major version** (a minor version while we are
   on 0.x). A breaking change is a removed or renamed export, prop, field or
   bin, or a change of behaviour a site relies on. Add a codemod in
   `scripts/` when the change is mechanical, and name it in the Upgrade
   section.
4. **The SDK follows the API.** `/v3/public` only grows: never remove or rename
   a field the SDK reads. Mark a field deprecated in the SDK types first, and
   drop it only in a major version.
5. **Test on the examples.** `pnpm test`, `pnpm check:template` and
   `pnpm check:examples` pass, and the examples run on the new version.
6. **Release all four together** with `scripts/set-version.mjs`, as the README
   describes.

## Raising the supported minimum

The Sites service refuses to build or publish a site whose kit is below its
supported range. Raise that minimum only in the same release as a changelog
entry whose Upgrade section takes a site past it.
