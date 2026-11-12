// Site content the API does not carry: the journal. Written for this site, all fictional.
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const journal = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/journal' }),
  schema: z.object({
    title: z.string(),
    excerpt: z.string(),
    date: z.coerce.date(),
    /** Agent's full name, as in the CRM: links the post to their page. */
    author: z.string(),
    /** Topic label, small caps on the card. */
    topic: z.string(),
    /** City the post is about: shown on that city's area page. */
    cities: z.array(z.string()).default([]),
    /** RealAdvisor bucket photo (rendered through RaImage). */
    cover: z.string().url(),
    coverAlt: z.string(),
  }),
});

export const collections = { journal };
