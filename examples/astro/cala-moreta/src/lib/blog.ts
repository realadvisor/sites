import { getCollection, type CollectionEntry } from 'astro:content';
import type { Lang } from './i18n';

export type Post = CollectionEntry<'blog'>;
/** Posts of one language, newest first. Entry ids are `<lang>/<file>`. */
export const postsOf = async (lang: Lang) =>
  (await getCollection('blog', (e) => e.id.startsWith(`${lang}/`))).sort((a, b) => +b.data.date - +a.data.date);
/** The same post's slug in every language (for hreflang and the switch). */
export async function postSlugs(post: Post): Promise<Partial<Record<Lang, string>>> {
  const file = post.id.split('/')[1];
  const all = await getCollection('blog', (e) => e.id.endsWith(`/${file}`));
  return Object.fromEntries(all.map((e) => [e.id.split('/')[0], e.data.path]));
}
