/**
 * The journal: site content the API does not carry (app/content/journal/*.md,
 * written for this site, all fictional). Front matter as in the Astro
 * version's content collection; the bodies use paragraphs, `##` headings and
 * `-` lists only, parsed here into blocks. Server only.
 */
const files = import.meta.glob('./journal/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

export type Block = { type: 'p' | 'h2'; text: string; id?: string } | { type: 'ul'; items: string[] };

export type Post = {
  id: string;
  title: string;
  excerpt: string;
  /** ISO date (yyyy-mm-dd). */
  date: string;
  /** Agent's full name, as in the CRM: links the post to their page. */
  author: string;
  topic: string;
  cities: string[];
  cover: string;
  coverAlt: string;
  /** Body: paragraphs, headings and lists (rendered as React elements: no HTML strings). */
  body: Block[];
};

const slug = (s: string) => s.toLowerCase().normalize('NFC').replace(/[^\p{L}\p{N}\s-]/gu, '').trim().replace(/\s+/g, '-');

function frontMatter(raw: string): [Record<string, unknown>, string] {
  const m = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(raw);
  if (!m) throw new Error('journal post without front matter');
  const data: Record<string, unknown> = {};
  for (const line of m[1]!.split('\n')) {
    const kv = /^(\w+):\s*(.*)$/.exec(line);
    if (!kv) continue;
    const v = kv[2]!.trim();
    data[kv[1]!] = v.startsWith('[') ? (JSON.parse(v) as string[]) : v.startsWith('"') ? (JSON.parse(v) as string) : v;
  }
  return [data, m[2]!];
}

function markdown(md: string): Block[] {
  return md.trim().split(/\n{2,}/).map((block): Block => {
    const b = block.trim();
    if (b.startsWith('## ')) return { type: 'h2', text: b.slice(3).trim(), id: slug(b.slice(3).trim()) };
    if (b.split('\n').every((l) => l.startsWith('- '))) return { type: 'ul', items: b.split('\n').map((l) => l.slice(2).trim()) };
    return { type: 'p', text: b.replace(/\s*\n\s*/g, ' ') };
  });
}

const POSTS: Post[] = Object.entries(files).map(([path, raw]) => {
  const [d, body] = frontMatter(raw);
  return {
    id: path.replace(/^.*\/|\.md$/g, ''),
    title: String(d.title),
    excerpt: String(d.excerpt),
    date: new Date(String(d.date)).toISOString().slice(0, 10),
    author: String(d.author),
    topic: String(d.topic),
    cities: (d.cities as string[] | undefined) ?? [],
    cover: String(d.cover),
    coverAlt: String(d.coverAlt),
    body: markdown(body),
  };
});

/** Every post, newest first. */
export const posts = (): Post[] => [...POSTS].sort((a, b) => b.date.localeCompare(a.date));
export const post = (id: string) => POSTS.find((p) => p.id === id) ?? null;
/** A post without its body (cards, lists): keeps loader data small. */
export const card = ({ body: _b, ...p }: Post): Omit<Post, 'body'> => p;
export type PostCard = Omit<Post, 'body'>;
