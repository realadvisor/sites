/**
 * Typography for text the site does not write itself: CRM titles and
 * descriptions, agents' bios, kit strings. Display only; the data stays as
 * it is. No imports: safe in any module, server or browser.
 *
 *   typo('Le "Clos" d\'Orient', 'fr-CH')   // Le « Clos » d’Orient (narrow no-break spaces)
 *   typo('Das "Haus"', 'de-DE')            // Das „Haus“
 *   typoHtml(listing.description, locale)  // the same, only between tags
 *
 * - apostrophes: ' between letters or digits becomes ’ (l’entrée, 1’250’000);
 * - double quotes: straight "…" becomes the language's marks: « … » fr (with
 *   U+202F narrow no-break spaces), „…“ de (de-CH: «…», the Swiss form), “…” en,
 *   «…» it and es; existing guillemets get the French spaces in fr;
 * - French spacing: a narrow no-break space before ; : ! ? (never in a time
 *   "14:00" or a URL);
 * - "..." becomes …
 *
 * Never changes words, case or spelling.
 */

const NNBSP = ' ';

type Marks = [open: string, close: string];

function marks(locale: string): Marks {
  const l = locale.toLowerCase();
  if (l.startsWith('fr')) return [`«${NNBSP}`, `${NNBSP}»`];
  if (l === 'de-ch' || l.startsWith('de-ch')) return ['«', '»'];
  if (l.startsWith('de')) return ['„', '“'];
  if (l.startsWith('it') || l.startsWith('es')) return ['«', '»'];
  return ['“', '”'];
}

/** Typography of one plain text in the page's language (`fr-CH`, `de`, `en-GB`, ...). */
export function typo(text: string, locale: string): string {
  if (!text) return text;
  const fr = locale.toLowerCase().startsWith('fr');
  let s = text;
  // Apostrophes: between letters (l'entrée, it's) and in Swiss numbers (1'250'000).
  s = s.replace(/([\p{L}\d])'(?=[\p{L}\d])/gu, '$1’');
  // French elision with a stray space ("l' existant"): the apostrophe joins the word.
  if (fr) s = s.replace(/(^|[^\p{L}])([dlnjsmtc]|qu|jusqu|lorsqu|puisqu)['’] (?=\p{L})/giu, '$1$2’');
  // A closing apostrophe after a word (the agents' office).
  s = s.replace(/(\p{L})'(?=[\s.,;:!?)]|$)/gu, '$1’');
  // Double quotes: an opening mark at the start or after a space or bracket, else a closing one.
  const [open, close] = marks(locale);
  s = s.replace(/(^|[\s([{–—/])"\s*/gu, `$1${open}`).replace(/\s*"/g, close);
  if (fr) s = s.replace(/«[\s  ]*/g, `«${NNBSP}`).replace(/[\s  ]*»/g, `${NNBSP}»`);
  s = s.replace(/\.{3}/g, '…');
  // French high punctuation: a narrow no-break space before ; : ! ? that end a phrase.
  if (fr) s = s.replace(/(\S)[   ]?([;:!?])(?=\s|$|[»)])/gu, (m, a: string, p: string) => (a === '«' || /[;:!?]/.test(a) ? m : `${a}${NNBSP}${p}`));
  return s;
}

/**
 * `typo()` over the text of sanitized HTML (the SDK's descriptions carry no
 * attributes): only the text between tags changes, never a tag.
 */
export function typoHtml(html: string, locale: string): string {
  if (!html) return html;
  // Quotes the sanitizer wrote as entities are typeset too; the result has no < > or &.
  const plain = (t: string) => t.replace(/&quot;|&#34;|&#x22;/gi, '"').replace(/&#39;|&#x27;|&apos;/gi, "'");
  return html.replace(/(^|>)([^<]+)(?=<|$)/g, (_, gt: string, text: string) => gt + typo(plain(text), locale));
}
