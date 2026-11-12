/**
 * Site content the API does not carry: journal posts and district texts, in
 * both languages, written for this (fictional) agency (app/content/*). Same
 * file name in it/ and en/ = the same post or district in the other
 * language. Front matter as in the Astro version's content collections; the
 * bodies use paragraphs, `##` headings and **bold** only, parsed here into
 * blocks (rendered as React elements: no HTML strings). Server only.
 */
import { isPlaceKey, type PlaceKey } from '../lib/places';
import type { Lang } from '../lib/i18n';

const journalFiles = import.meta.glob('./journal/*/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const districtFiles = import.meta.glob('./quartieri/*/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

/** Inline text: plain runs and **bold** runs. */
export type Inline = { text: string; strong?: boolean }[];
export type Block = { type: 'p'; text: Inline } | { type: 'h2'; text: string; id: string };

export type Post = {
  /** `<lang>/<file>`, as the Astro collection's entry id. */
  id: string;
  title: string;
  path: string;
  excerpt: string;
  /** ISO date (yyyy-mm-dd). */
  date: string;
  /** Agent id from the data; the byline is left out when the agent is gone. */
  author?: string;
  cover: PlaceKey;
  coverIndex: number;
  /** Reading time from the raw markdown, about 200 words a minute. */
  minutes: number;
  body: Block[];
};
export type PostCard = Omit<Post, 'body'>;

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

/** Astro's markdown typography (smartypants): straight apostrophes become ’. */
const smart = (s: string) => s.replace(/'/g, '’');

/** Heading ids as Astro makes them (github-slugger): lower case, punctuation out, spaces to hyphens, accents kept. */
const headingId = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}\s_-]/gu, '').replace(/\s/g, '-');

function inline(s: string): Inline {
  return s.split(/(\*\*[^*]+\*\*)/).filter(Boolean).map((part) =>
    part.startsWith('**') && part.endsWith('**') ? { text: part.slice(2, -2), strong: true } : { text: part },
  );
}

function markdown(md: string): Block[] {
  return md.trim().split(/\n{2,}/).map((block): Block => {
    const b = smart(block.trim());
    if (b.startsWith('## ')) {
      const text = b.slice(3).trim();
      return { type: 'h2', text, id: headingId(text) };
    }
    return { type: 'p', text: inline(b.replace(/\s*\n\s*/g, ' ')) };
  });
}

const idOf = (path: string) => path.replace(/^\.\/\w+\//, '').replace(/\.md$/, '');

const POSTS: Post[] = Object.entries(journalFiles).map(([file, raw]) => {
  const [d, body] = frontMatter(raw);
  const cover = d.cover ?? '';
  if (!isPlaceKey(cover)) throw new Error(`${file}: unknown place key "${cover}" (app/data/places.json)`);
  return {
    id: idOf(file),
    title: d.title!,
    path: d.path!,
    excerpt: d.excerpt!,
    date: new Date(d.date!).toISOString().slice(0, 10),
    author: d.author || undefined,
    cover,
    coverIndex: d.coverIndex ? Number(d.coverIndex) : 0,
    minutes: Math.max(1, Math.round(body.split(/\s+/).length / 200)),
    body: markdown(body),
  };
});

/** Posts of one language, newest first. */
export const postsOf = (lang: Lang): Post[] =>
  POSTS.filter((p) => p.id.startsWith(`${lang}/`)).sort((a, b) => b.date.localeCompare(a.date));
/** A post without its body (cards, lists): keeps loader data small. */
export const card = ({ body: _b, ...p }: Post): PostCard => p;
/** The same post's slug in every language (for hreflang and the switch). */
export function postSlugs(post: Pick<Post, 'id'>): Partial<Record<Lang, string>> {
  const file = post.id.split('/')[1];
  return Object.fromEntries(POSTS.filter((p) => p.id.endsWith(`/${file}`)).map((p) => [p.id.split('/')[0], p.path]));
}

export type DistrictText = { lead: string; body: Block[] };
const DISTRICTS: Record<string, DistrictText> = Object.fromEntries(
  Object.entries(districtFiles).map(([file, raw]) => {
    const [d, body] = frontMatter(raw);
    return [idOf(file), { lead: d.lead!, body: markdown(body) }];
  }),
);
/** A district's text in one language, or undefined. */
export const districtText = (slug: string, lang: Lang): DistrictText | undefined => DISTRICTS[`${lang}/${slug}`];
