/**
 * Allowlist HTML sanitizer for CRM listing descriptions. Zero dependencies, so
 * it runs in Workers and Node. Output tags carry no attributes.
 */

const ALLOWED = new Set(['p', 'br', 'ul', 'ol', 'li', 'strong', 'em', 'h3', 'h4']);

/** Tags the CRM editor emits that map onto an allowed tag. */
const ALIASES: Record<string, string> = {
  b: 'strong',
  i: 'em',
  div: 'p',
  h1: 'h3',
  h2: 'h3',
  h5: 'h4',
  h6: 'h4',
};

const BLOCK = new Set(['p', 'ul', 'ol', 'li', 'h3', 'h4']);

const TAG_RE = /<(\/?)([a-zA-Z][a-zA-Z0-9]*)\b[^>]*?(\/?)>/g;

const DROP_WITH_CONTENT =
  /<(script|style|iframe|object|embed|noscript|template|svg|math)\b[\s\S]*?<\/\1\s*>/gi;

const ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
};

export const decodeEntities = (s: string): string =>
  s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, code: string) => {
    if (code[0] === '#') {
      const n = code[1] === 'x' || code[1] === 'X' ? parseInt(code.slice(2), 16) : Number(code.slice(1));
      return Number.isFinite(n) && n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : '';
    }
    return ENTITIES[code.toLowerCase()] ?? match;
  });

const escapeText = (s: string): string =>
  decodeEntities(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const preclean = (html: string) =>
  html.replace(/<!--[\s\S]*?-->/g, '').replace(DROP_WITH_CONTENT, '');

/** Keep only p, br, ul, ol, li, strong, em, h3, h4, without attributes, balanced. */
export const sanitizeHtml = (html: string): string => {
  const src = preclean(html);
  const out: string[] = [];
  const stack: string[] = [];
  let last = 0;
  for (const m of src.matchAll(TAG_RE)) {
    out.push(escapeText(src.slice(last, m.index)));
    last = (m.index ?? 0) + m[0].length;
    const raw = m[2]!.toLowerCase();
    const tag = ALIASES[raw] ?? raw;
    if (!ALLOWED.has(tag)) continue;
    if (tag === 'br') {
      out.push('<br>');
      continue;
    }
    if (m[1]) {
      const at = stack.lastIndexOf(tag);
      if (at < 0) continue;
      while (stack.length > at) out.push(`</${stack.pop()}>`);
    } else if (!m[3]) {
      // An unclosed <li> or <p> ends at the next sibling of the same tag.
      if ((tag === 'li' || tag === 'p') && stack.at(-1) === tag) out.push(`</${stack.pop()}>`);
      stack.push(tag);
      out.push(`<${tag}>`);
    }
  }
  out.push(escapeText(src.slice(last)));
  while (stack.length) out.push(`</${stack.pop()}>`);
  return out
    .join('')
    .replace(/<(p|h3|h4|li)>\s*(<br>\s*)*<\/\1>/g, '')
    .trim();
};

/** Plain text: block ends become newlines, entities decoded, whitespace collapsed. */
export const htmlToText = (html: string): string => {
  const src = preclean(html);
  const text = src.replace(TAG_RE, (_m, close: string, name: string) => {
    const tag = ALIASES[name.toLowerCase()] ?? name.toLowerCase();
    if (tag === 'br') return '\n';
    return BLOCK.has(tag) && (close || tag === 'li') ? '\n' : '';
  });
  return decodeEntities(text)
    .replace(/[ \t ]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

/**
 * Markdown the CRM sometimes stores instead of HTML (development and listing
 * descriptions written as `**Emplacement**`, `- item`, `## Title`).
 * True when the text has no tags and at least one markdown mark.
 */
export const looksLikeMarkdown = (s: string): boolean =>
  !/<[a-z][^>]*>/i.test(s) &&
  /(\*\*|__)\S[\s\S]*?\S?\1|^\s{0,3}#{1,6}\s+\S|^\s{0,3}[-*+•]\s+\S|^\s{0,3}\d+[.)]\s+\S/m.test(s);

const inlineMd = (s: string): string =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/(\*\*|__)(?=\S)([\s\S]*?\S)\1/g, '<strong>$2</strong>')
    .replace(/(^|[^\w*])\*(?=\S)([^*\n]*?\S)\*(?!\w)/g, '$1<em>$2</em>')
    .replace(/\[([^\]\n]+)\]\((?:[^)\s]+)\)/g, '$1');

/**
 * Basic markdown to the sanitizer's tags: paragraphs (blank lines), `#` titles
 * (h3/h4), `-`/`*`/`•` and `1.` lists, `**bold**`, `*italic*`, links as text.
 */
export const markdownToHtml = (md: string): string => {
  const out: string[] = [];
  let list: 'ul' | 'ol' | null = null;
  let para: string[] = [];
  const flushPara = () => {
    if (para.length) out.push(`<p>${para.map(inlineMd).join('<br>')}</p>`);
    para = [];
  };
  const closeList = () => {
    if (list) out.push(`</${list}>`);
    list = null;
  };
  for (const raw of md.replace(/\r\n?/g, '\n').split('\n')) {
    const line = raw.trim();
    const heading = line.match(/^(#{1,6})\s+(.*?)\s*#*$/);
    const bullet = line.match(/^[-*+•]\s+(.*)$/);
    const numbered = line.match(/^\d+[.)]\s+(.*)$/);
    if (!line) {
      flushPara();
      closeList();
    } else if (heading) {
      flushPara();
      closeList();
      const tag = heading[1]!.length <= 2 ? 'h3' : 'h4';
      out.push(`<${tag}>${inlineMd(heading[2]!)}</${tag}>`);
    } else if (bullet || numbered) {
      flushPara();
      const kind = bullet ? 'ul' : 'ol';
      if (list !== kind) {
        closeList();
        out.push(`<${kind}>`);
        list = kind;
      }
      out.push(`<li>${inlineMd((bullet ?? numbered)![1]!)}</li>`);
    } else {
      closeList();
      para.push(line);
    }
  }
  flushPara();
  closeList();
  return sanitizeHtml(out.join(''));
};

/**
 * A CRM description as the SDK serves it: allow-listed HTML plus plain text.
 * Markdown is converted first, so neither version shows `**` or `#`.
 */
export const richText = (src: string): { html: string; text: string } => {
  // Plain text (no tags): one paragraph per blank-line-separated block.
  const tagged = /<[a-z]/i.test(src) ? src : src.trim().split(/\n{2,}/).map((p) => `<p>${p}</p>`).join('');
  const html = looksLikeMarkdown(src) ? markdownToHtml(src) : sanitizeHtml(tagged);
  return { html, text: htmlToText(html) };
};
