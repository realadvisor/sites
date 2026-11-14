/**
 * Listing titles for display. The CRM keeps the original; this only changes
 * how it is set:
 *
 *   cleanTitle('EN EXCLUSIVITE: MAGNIFIQUE VILLA DE 230 m2 - VUE LAC', 'fr-CH', { places: [l.address.city] })
 *   // { title: 'Magnifique villa de 230 m² – vue lac', exclusive: true, marker: 'EN EXCLUSIVITE' }
 *
 * - a leading marketing marker ("EN EXCLUSIVITÉ :", "EXKLUSIV -", "IN ESCLUSIVA:",
 *   "NEW!", "À SAISIR !") is removed; an exclusivity marker comes back as
 *   `exclusive: true` (show it as the card's one badge), the removed text as `marker`;
 * - shouting caps and Title Case become sentence case, keeping acronyms (PPE,
 *   CHF, DPE, ...), words with digits (T3, 4.5) and place names (`places`,
 *   and hyphenated capitalised names such as Saint-Exemple). When unsure a
 *   capital stays. German titles keep their case (nouns are capitalised);
 * - m2 / m3 / mq / sqm become m² / m³ after a no-break space, " - " becomes " – ",
 *   "!!" and "..." collapse, a trailing "!" or "." goes;
 * - a title longer than `max` (default 70) stops at its first strong separator
 *   (– — | : ; . ! ?) after 20 characters; without one it is kept whole
 *   (clamp it in CSS);
 * - then `typo()`: curly apostrophes and quotes, French spacing before : ; ! ?
 *
 * Words are only removed (the marker, a tail after a separator), never added;
 * spelling is never corrected (list typos for the agency to fix in the CRM).
 * Accents are restored only for a short list of common real estate words
 * written in caps (ETAGE, PIECES, PROPRIETE...).
 */
import { typo } from './typo.ts';

export type CleanTitle = {
  /** The title to show. */
  title: string;
  /** The title started with an exclusivity marker. */
  exclusive: boolean;
  /** The marker that was removed, as written ("EN EXCLUSIVITE"), if any. */
  marker?: string;
};

export type CleanTitleOptions = {
  /** Names to keep capitalised: the listing's city, its region, the agency's places. */
  places?: (string | null | undefined)[];
  /** More acronyms to keep in caps. */
  acronyms?: string[];
  /** Longer titles stop at their first strong separator. Default 70. */
  max?: number;
};

const EXCLUSIVE_WORDS = String.raw`(?:en\s+|in\s+)?exclusivit[eé]|exklusiv(?:ität)?|(?:in\s+)?esclusiva|(?:en\s+)?exclusiva|exclusive|exclusivity`;
const OTHER_WORDS = String.raw`nouveau(?:t[eé])?|nouvelle|[àa]\s+saisir|rare|coup\s+de\s+c(?:oe|œ)ur|neu(?:heit)?|nuovo|novit[àa]|nuevo|novedad|new|urgent`;
const MARKER = new RegExp(String.raw`^\s*(${EXCLUSIVE_WORDS}|${OTHER_WORDS})\s*([:!\-–—|]+)?\s*`, 'iu');
const IS_EXCLUSIVE = new RegExp(String.raw`^(?:${EXCLUSIVE_WORDS})$`, 'iu');

// Kept in caps. Only unambiguous ones: no code that is also a word (BE, IT, ES, APE...).
const ACRONYMS = new Set([
  'PPE', 'CHF', 'EUR', 'SIA', 'CECB', 'GEAK', 'CFF', 'SBB', 'FFS', 'TPG', 'RER', 'TGV', 'DPE', 'GES', 'HLM', 'SCI', 'LMNP', 'BBC',
  'PLU', 'ZAC', 'IVA', 'IBI', 'VPO', 'WC', 'TV', 'UK', 'USA', 'EU', 'CH',
  'VD', 'GE', 'VS', 'JU', 'FR', 'TI', 'ZH', 'ZG', 'BS', 'BL', 'AG', 'GR', 'TG', 'SZ', 'NW', 'OW',
]);
// Common real estate words written in caps whose lower case needs an accent.
const ACCENTS: Record<string, Record<string, string>> = {
  fr: {
    ETAGE: 'étage', ETAGES: 'étages', PIECE: 'pièce', PIECES: 'pièces', DEPENDANCE: 'dépendance', DEPENDANCES: 'dépendances',
    PROPRIETE: 'propriété', RENOVE: 'rénové', RENOVEE: 'rénovée', RENOVES: 'rénovés', RENOVEES: 'rénovées', RESIDENCE: 'résidence',
    EXCLUSIVITE: 'exclusivité', PROXIMITE: 'proximité', ENSOLEILLE: 'ensoleillé', ENSOLEILLEE: 'ensoleillée', DEGAGEE: 'dégagée',
    DEGAGE: 'dégagé', AMENAGE: 'aménagé', AMENAGEE: 'aménagée', EQUIPE: 'équipé', EQUIPEE: 'équipée', PRIVILEGIE: 'privilégié',
    PRIVILEGIEE: 'privilégiée', AGREABLE: 'agréable', REVE: 'rêve', SECURISE: 'sécurisé', SECURISEE: 'sécurisée', ETE: 'été',
  },
  es: { ATICO: 'ático', DUPLEX: 'dúplex', JARDIN: 'jardín', HABITACION: 'habitación', HABITACIONES: 'habitaciones' },
  it: { CITTA: 'città', ATTICO: 'attico' },
};

const isCaps = (w: string) => /\p{Lu}/u.test(w) && w === w.toLocaleUpperCase();
const letters = (w: string) => w.replace(/[^\p{L}]/gu, '');
const WORD = /[\p{L}\d][\p{L}\d’'.-]*/gu;

/** Sentence case for shouting caps and Title Case; a word `keep` accepts stays as it is. German keeps its case. */
function sentenceCase(s: string, lang: string, keep: (w: string) => boolean): string {
  if (lang === 'de') return s;
  const words = (s.match(WORD) ?? []).filter((w) => letters(w).length >= 4 && !/\d/.test(w) && !keep(w));
  const shouting = words.length >= 2 && words.filter(isCaps).length / words.length > 0.6;
  const rest = words.slice(1);
  const titleCase = !shouting && rest.length >= 3 && rest.filter((w) => /^\p{Lu}/u.test(w) && !isCaps(w)).length / rest.length > 0.5;
  const accents = ACCENTS[lang] ?? {};
  return s.replace(WORD, (w) => {
    if (/\d/.test(w) || keep(w)) return w;
    const caps = isCaps(w);
    // Shouting or Title Case: every word; else only a long word in caps inside a normal title.
    const lower = shouting || titleCase ? /^\p{Lu}/u.test(w) : caps && letters(w).length >= 4;
    if (!lower) return w;
    if (caps) return accents[w] ?? w.toLocaleLowerCase(lang);
    return w.charAt(0).toLocaleLowerCase(lang) + w.slice(1);
  });
}

/** A display title for a CRM listing title, in the page's language (`fr-CH`, `en`, ...). */
export function cleanTitle(raw: string, locale: string, opts: CleanTitleOptions = {}): CleanTitle {
  const lang = locale.slice(0, 2).toLowerCase();
  let s = (raw ?? '').replace(/\s+/g, ' ').trim();
  let exclusive = false;
  let marker: string | undefined;
  const m = s.match(MARKER);
  // Only a marker in front of a real title, followed by punctuation or (for
  // exclusivity) written in caps: "Nouveau quartier à ..." keeps its first word.
  if (m && s.length - m[0].length >= 8 && (m[2] || (IS_EXCLUSIVE.test(m[1]!.trim()) && isCaps(m[1]!)))) {
    marker = m[1]!.trim();
    exclusive = IS_EXCLUSIVE.test(marker);
    s = s.slice(m[0].length);
  }

  const places = new Set<string>();
  for (const p of opts.places ?? []) for (const w of (p ?? '').split(/[\s()/,]+/)) if (letters(w).length >= 3) places.add(w.toLocaleLowerCase(lang));
  const acronyms = new Set([...ACRONYMS, ...(opts.acronyms ?? []).map((a) => a.toUpperCase())]);
  const keep = (w: string) =>
    acronyms.has(w) ||
    // A place name as written (in caps it is restored from `places` below).
    (places.has(w.toLocaleLowerCase(lang)) && !isCaps(w)) ||
    // A capital inside a word (iPhone, McArthur).
    /\p{Ll}\p{Lu}/u.test(w) ||
    // A hyphenated capitalised name (Saint-Exemple, Mont-sur-Exemple).
    (!isCaps(w) && w.split('-').filter((x) => /^\p{Lu}/u.test(x)).length >= 2);
  s = sentenceCase(s, lang, keep);
  // A place written in caps, restored from the given places ("EXEMPLEVILLE" -> "Exempleville").
  for (const p of opts.places ?? []) {
    if (!p) continue;
    const re = new RegExp(`(^|[^\\p{L}])${p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?=$|[^\\p{L}])`, 'giu');
    s = s.replace(re, (_, a: string) => a + p);
  }

  s = s
    .replace(/(\d)\s?(?:m2|m\^2|mq|sqm)(?![\p{L}\d])/giu, '$1 m²')
    .replace(/(\d)\s?(?:m3|m\^3)(?![\p{L}\d])/giu, '$1 m³')
    .replace(/ - /g, ' – ')
    .replace(/!{2,}/g, '!')
    .replace(/\?{2,}/g, '?')
    .replace(/\s*(?:!|\.(?!\.))\s*$/, '')
    .trim();

  const max = opts.max ?? 70;
  if (s.length > max) {
    const re = /\s[–—|:;]\s|[.!?]\s/g;
    for (let x = re.exec(s); x; x = re.exec(s)) {
      if (x.index >= 20) { s = s.slice(0, x.index).trim(); break; }
    }
  }

  s = typo(s, locale);
  s = s.charAt(0).toLocaleUpperCase(lang) + s.slice(1);
  return marker ? { title: s, exclusive, marker } : { title: s, exclusive };
}
