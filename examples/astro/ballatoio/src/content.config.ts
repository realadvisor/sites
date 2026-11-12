// Site content the API does not carry: journal posts and district texts, in
// both languages, written for this (fictional) agency. Same file name in
// it/ and en/ = the same post or district in the other language.
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { isPlaceKey } from './lib/places';

const placeKey = z.string().refine(isPlaceKey, 'unknown place key (src/data/places.json)');

const journal = defineCollection({
  loader: glob({ pattern: '*/*.md', base: './src/content/journal', generateId: ({ entry }) => entry.replace(/\.md$/, '') }),
  schema: z.object({
    title: z.string(),
    path: z.string(),
    excerpt: z.string(),
    date: z.coerce.date(),
    /** Agent id from the data; the byline is left out when the agent is gone. */
    author: z.string().optional(),
    /** A place photo (src/data/places.json) and which one. */
    cover: placeKey,
    coverIndex: z.number().int().min(0).default(0),
  }),
});

const quartieri = defineCollection({
  loader: glob({ pattern: '*/*.md', base: './src/content/quartieri', generateId: ({ entry }) => entry.replace(/\.md$/, '') }),
  schema: z.object({
    /** One plain sentence under the district name. */
    lead: z.string(),
  }),
});

export const collections = { journal, quartieri };
