// Site content the API does not carry: journal posts and area intros, in
// both languages, written for this (fictional) agency. Same file name in
// es/ and en/ = the same post or area in the other language.
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { isPhotoKey } from './lib/photos';

const photoKey = z.string().refine(isPhotoKey, 'unknown photo key (src/lib/photos.ts)');

const blog = defineCollection({
  loader: glob({ pattern: '*/*.md', base: './src/content/blog', generateId: ({ entry }) => entry.replace(/\.md$/, '') }),
  schema: z.object({
    title: z.string(),
    path: z.string(),
    excerpt: z.string(),
    date: z.coerce.date(),
    /** Agent id from the data; the byline is left out when the agent is gone. */
    author: z.string().optional(),
    /** Key of a self-hosted place photo in src/lib/photos.ts (alt text lives there). */
    cover: photoKey,
    tag: z.string(),
  }),
});

const areas = defineCollection({
  loader: glob({ pattern: '*/*.md', base: './src/content/areas', generateId: ({ entry }) => entry.replace(/\.md$/, '') }),
  schema: z.object({
    town: z.string(),
    tagline: z.string(),
    /** Key of a self-hosted place photo in src/lib/photos.ts: the hero. */
    photo: photoKey,
    /** Optional second photo of the same town, below the intro. */
    photo2: photoKey.optional(),
  }),
});

export const collections = { blog, areas };
