/**
 * Construction news (Baustelle): written for the site, not from the API
 * (app/content/news/*.md, front matter as in the Astro version's content
 * collection; bodies are plain paragraphs). Photos: a bucket photo
 * (`photoLocal`, lib/bucket.ts) or an index into the development's
 * construction photos (fixture only). Server only.
 */
import { devExtra } from '../lib/data.server';

const files = import.meta.glob('./news/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

export type NewsItem = {
  id: string;
  title: string;
  /** ISO date (yyyy-mm-dd). */
  date: string;
  /** Milestone on the timeline: done or planned. */
  phase: string;
  photoUrl?: string;
  photoLocal?: string;
  photoAlt?: string;
  houses: string[];
  planned: boolean;
  /** Body paragraphs (rendered as React elements: no HTML strings). */
  body: string[];
};

function frontMatter(raw: string): [Record<string, string>, string] {
  const m = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(raw);
  if (!m) throw new Error('news entry without front matter');
  const data: Record<string, string> = {};
  for (const line of m[1]!.split('\n')) {
    const kv = /^(\w+):\s*(.*)$/.exec(line);
    if (kv) data[kv[1]!] = kv[2]!.trim();
  }
  return [data, m[2]!];
}

const ENTRIES = Object.entries(files).map(([path, raw]) => {
  const [d, body] = frontMatter(raw);
  return {
    id: path.replace(/^.*\/|\.md$/g, ''),
    title: d.title!,
    date: new Date(d.date!).toISOString().slice(0, 10),
    phase: d.phase!,
    photo: d.photo != null ? Number(d.photo) : undefined,
    photoLocal: d.photoLocal || undefined,
    photoAlt: d.photoAlt || undefined,
    houses: d.houses ? d.houses.replace(/^\[|\]$/g, '').split(',').map((h) => h.trim()).filter(Boolean) : [],
    planned: d.planned === 'true',
    body: body.trim().split(/\n{2,}/).map((p) => p.replace(/\s*\n\s*/g, ' ').trim()).filter(Boolean),
  };
});

/** Construction news, oldest first; photos from the development's construction photos (fixture only). */
export function news(developmentId: string): NewsItem[] {
  // fixture only: construction photos
  const photos = devExtra(developmentId).constructionPhotos;
  return [...ENTRIES]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(({ photo, ...e }) => ({ ...e, photoUrl: e.photoLocal ? undefined : photo != null ? photos[photo] : undefined }));
}
