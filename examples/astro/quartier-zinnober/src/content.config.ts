// Construction news (Baustelle): written for the site, not from the API.
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const news = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/news' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    /** Milestone on the timeline: done or planned. */
    phase: z.string(),
    /** Index into the development's construction photos (fixture only). */
    photo: z.number().int().optional(),
    /** Bucket photo (src/lib/bucket.ts; Pexels, see photo-credits.md), by file name without extension. */
    photoLocal: z.string().optional(),
    photoAlt: z.string().optional(),
    houses: z.array(z.enum(['A', 'B', 'C'])).default([]),
    planned: z.boolean().default(false),
  }),
});

export const collections = { news };
