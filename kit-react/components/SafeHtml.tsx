/**
 * Rich text (listing, team, development descriptions) sanitized where the
 * data is read, typically in the loader, and rendered with a type that says so:
 *
 *   // loader (server): the client chunk gets the clean HTML, not the raw field
 *   return { description: sanitized(listing.description) };
 *   // page
 *   <SafeHtml html={loaderData.description} className="prose" />
 *
 * `SanitizedHtml` comes out of `sanitized()` (the kit's sanitizeHtml), so
 * tsc rejects a raw string (never build one by hand), and check:deploy needs no sanitizeHtml(...) call
 * written inside `dangerouslySetInnerHTML` (it still flags any other
 * `dangerouslySetInnerHTML` in app/). It is a plain object, so it passes
 * through loader data (JSON) unchanged.
 */
import { sanitizeHtml } from '@realadvisor/sites-kit';

/** HTML that went through sanitizeHtml: make it with `sanitized()` only (a string brand: it survives loader serialization). */
export type SanitizedHtml = { readonly kind: 'sanitized-html'; readonly sanitizedHtml: string };

export const sanitized = (html: string | null | undefined): SanitizedHtml => ({ kind: 'sanitized-html', sanitizedHtml: html ? sanitizeHtml(html) : '' });

type Tag = 'div' | 'section' | 'article' | 'span' | 'p' | 'blockquote';

export function SafeHtml({ html, as: As = 'div', className, id }: { html: SanitizedHtml | null | undefined; as?: Tag; className?: string; id?: string }) {
  if (!html?.sanitizedHtml) return null;
  return <As className={className} id={id} dangerouslySetInnerHTML={{ __html: html.sanitizedHtml }} />;
}

export default SafeHtml;
