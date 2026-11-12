/**
 * Every built file a page or script asks for ships in dist/.
 *
 * Astro deletes a stylesheet it inlines into the page (`build.inlineStylesheets`
 * 'always', or 'auto' under the size limit), but a client script that loads it
 * with a dynamic import (`await import('leaflet/dist/leaflet.css')`) still
 * preloads `/_astro/<name>.css`: on the Worker that is a 404 HTML page,
 * "Refused to apply style ... MIME type text/html", "Unable to preload CSS",
 * and the import (a map, a carousel) never runs.
 *
 * This integration keeps a copy of every asset Vite emits (client and server
 * builds) and, after the build, writes back each one that a built .js / .mjs /
 * .css / .html file references under `_astro/` but that is missing from dist/.
 * Keep it in astro.config.mjs (`integrations`).
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const REF = /_astro\/[A-Za-z0-9._@~-]+\.[A-Za-z0-9]+/g;
const TEXT = /\.(m?js|css|html)$/;

const walk = (dir) =>
  existsSync(dir)
    ? readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)]))
    : [];

/** `_astro/...` paths referenced by built text files in `dist` and missing from it. */
export function missingAssets(dist) {
  const missing = new Map(); // path -> first file that references it
  for (const file of walk(dist).filter((f) => TEXT.test(f))) {
    for (const [ref] of readFileSync(file, 'utf8').matchAll(REF)) {
      if (!missing.has(ref) && !existsSync(join(dist, ref))) missing.set(ref, file.slice(dist.length + 1));
    }
  }
  return missing;
}

/** @returns {import('astro').AstroIntegration} */
export function keepReferencedAssets() {
  const emitted = new Map(); // fileName -> source
  return {
    name: 'ra-keep-referenced-assets',
    hooks: {
      'astro:config:setup': ({ updateConfig }) => {
        updateConfig({
          vite: {
            plugins: [
              {
                name: 'ra-keep-referenced-assets',
                // Before Astro's inline-stylesheets step deletes them from the bundle.
                generateBundle: {
                  order: 'pre',
                  handler(_options, bundle) {
                    for (const out of Object.values(bundle)) if (out.type === 'asset') emitted.set(out.fileName, out.source);
                  },
                },
              },
            ],
          },
        });
      },
      'astro:build:done': ({ dir, logger }) => {
        const dist = fileURLToPath(dir).replace(/\/$/, '');
        for (const [ref, from] of missingAssets(dist)) {
          const source = emitted.get(ref);
          if (source == null) {
            // The server manifest also names module ids (entryModules) that are no files.
            if (!from.startsWith('_worker.js/')) logger.warn(`${ref} is referenced by ${from} but was not emitted by the build`);
            continue;
          }
          mkdirSync(dirname(join(dist, ref)), { recursive: true });
          writeFileSync(join(dist, ref), source);
          logger.info(`restored ${ref} (inlined by Astro, still loaded by ${from})`);
        }
      },
    },
  };
}
