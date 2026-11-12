/**
 * `@realadvisor/sites-kit-core`: the data SDK (`@realadvisor/sites-sdk`: clients,
 * types, errors, enquiries), the kit's own types and the HTML helpers. Pages
 * read data through `ra` (`@realadvisor/sites-kit-astro/ra`).
 */
export * from '@realadvisor/sites-sdk';
export type * from './types.ts';
export { decodeEntities, htmlToText, looksLikeMarkdown, markdownToHtml, richText, sanitizeHtml } from './lib/html.ts';

const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Listing id from an id or a slug that ends with the id (`nice-flat-<uuid>`): a 410 for a listing that left. */
export const listingIdFromSlug = (idOrSlug: string): string | null => idOrSlug.match(UUID_RE)?.[0].toLowerCase() ?? null;
