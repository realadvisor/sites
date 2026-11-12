import { getCollection, type CollectionEntry } from 'astro:content';
import { devExtra } from './data';

export type NewsItem = CollectionEntry<'news'> & { photoUrl?: string; photoLocal?: string };

/** Construction news, oldest first; photos from the development's construction photos (fixture only). */
export async function news(developmentId: string): Promise<NewsItem[]> {
  // fixture only: construction photos
  const photos = devExtra(developmentId).constructionPhotos;
  const all = await getCollection('news');
  return all
    .sort((a, b) => a.data.date.getTime() - b.data.date.getTime())
    .map((e) => ({ ...e, photoLocal: e.data.photoLocal, photoUrl: e.data.photoLocal ? undefined : e.data.photo != null ? photos[e.data.photo] : undefined }));
}

const DATE = new Intl.DateTimeFormat('de-CH', { day: 'numeric', month: 'long', year: 'numeric' });
const MONTH = new Intl.DateTimeFormat('de-CH', { month: 'long', year: 'numeric' });
export const newsDate = (d: Date) => DATE.format(d);
export const newsMonth = (d: Date) => MONTH.format(d);
