/**
 * Site content the API does not carry: journal posts and area intros, in
 * both languages (app/content/{blog,areas}/<lang>/<file>.md, the Astro
 * version's content collections). Same file name in es/ and en/ = the same
 * post or area in the other language. Bodies use paragraphs, `##` headings,
 * **bold** and *italic* only, parsed here into blocks (React elements, no
 * HTML strings). Server only.
 */
import { isPhotoKey, type PhotoKey } from '../lib/photos';
import type { Lang } from '../lib/i18n';

const blogFiles = import.meta.glob('./blog/*/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const areaFiles = import.meta.glob('./areas/*/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

/** Inline text: plain, **strong** or *em*. */
export type Span = { t: string; s?: 'strong' | 'em' };
export type Block = { type: 'p' | 'h2'; text: Span[]; id?: string };

function frontMatter(raw: string): [Record<string, string>, string] {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(raw);
  if (!m) throw new Error('content file without front matter');
  const data: Record<string, string> = {};
  for (const line of m[1]!.split('\n')) {
    const kv = /^(\w+):\s*(.*)$/.exec(line);
    if (!kv) continue;
    const v = kv[2]!.trim();
    data[kv[1]!] = v.startsWith('"') ? (JSON.parse(v) as string) : v;
  }
  return [data, m[2]!];
}

function inline(s: string): Span[] {
  const out: Span[] = [];
  const re = /\*\*([^*]+)\*\*|\*([^*]+)\*/g;
  let at = 0;
  for (let m = re.exec(s); m; m = re.exec(s)) {
    if (m.index > at) out.push({ t: s.slice(at, m.index) });
    out.push(m[1] != null ? { t: m[1], s: 'strong' } : { t: m[2]!, s: 'em' });
    at = m.index + m[0].length;
  }
  if (at < s.length) out.push({ t: s.slice(at) });
  return out;
}

const headingId = (s: string) => s.toLowerCase().normalize('NFC').replace(/[^\p{L}\p{N}\s-]/gu, '').trim().replace(/\s+/g, '-');

function markdown(md: string): Block[] {
  return md.trim().split(/\n{2,}/).map((block): Block => {
    const b = block.trim();
    if (b.startsWith('## ')) return { type: 'h2', text: inline(b.slice(3).trim()), id: headingId(b.slice(3).trim()) };
    return { type: 'p', text: inline(b.replace(/\s*\n\s*/g, ' ')) };
  });
}

const photo = (k: string | undefined, file: string): PhotoKey => {
  if (!k || !isPhotoKey(k)) throw new Error(`${file}: unknown photo key ${k} (app/lib/photos.ts)`);
  return k;
};

/** `./blog/es/file.md` -> [lang, file]. */
const parts = (path: string) => path.replace(/^\.\/\w+\//, '').replace(/\.md$/, '').split('/') as [Lang, string];

export type Post = {
  /** `<lang>/<file>`. */
  id: string;
  lang: Lang;
  title: string;
  path: string;
  excerpt: string;
  /** ISO date (yyyy-mm-dd). */
  date: string;
  /** Agent id from the data; the byline is left out when the agent is gone. */
  author?: string;
  cover: PhotoKey;
  tag: string;
  /** Words in the body (reading time). */
  words: number;
  body: Block[];
};

const POSTS: Post[] = Object.entries(blogFiles).map(([file, raw]) => {
  const [d, body] = frontMatter(raw);
  const [lang, name] = parts(file);
  return {
    id: `${lang}/${name}`,
    lang,
    title: d.title!,
    path: d.path!,
    excerpt: d.excerpt!,
    date: new Date(d.date!).toISOString().slice(0, 10),
    author: d.author || undefined,
    cover: photo(d.cover, file),
    tag: d.tag!,
    words: body.split(/\s+/).length,
    body: markdown(body),
  };
});

/** Posts of one language, newest first. */
export const postsOf = (lang: Lang): Post[] => POSTS.filter((p) => p.lang === lang).sort((a, b) => b.date.localeCompare(a.date));
/** The same post's slug in every language (for hreflang and the switch). */
export const postSlugs = (post: Post): Partial<Record<Lang, string>> => {
  const file = post.id.split('/')[1];
  return Object.fromEntries(POSTS.filter((p) => p.id.endsWith(`/${file}`)).map((p) => [p.lang, p.path]));
};
/** A post without its body (cards, lists): keeps loader data small. */
export const card = ({ body: _b, ...p }: Post) => p;
export type PostCard = ReturnType<typeof card>;

export type AreaText = { id: string; lang: Lang; town: string; tagline: string; photo: PhotoKey; photo2?: PhotoKey; body: Block[] };

const AREAS: AreaText[] = Object.entries(areaFiles).map(([file, raw]) => {
  const [d, body] = frontMatter(raw);
  const [lang, name] = parts(file);
  return { id: `${lang}/${name}`, lang, town: d.town!, tagline: d.tagline!, photo: photo(d.photo, file), photo2: d.photo2 ? photo(d.photo2, file) : undefined, body: markdown(body) };
});

/** Area intros of one language. */
export const areasOf = (lang: Lang): AreaText[] => AREAS.filter((a) => a.lang === lang);
export const areaText = (lang: Lang, slug: string) => AREAS.find((a) => a.id === `${lang}/${slug}`);
