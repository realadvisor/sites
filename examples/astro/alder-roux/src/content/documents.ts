/**
 * Development documents (fixture only: the API has no documents yet). Small
 * PDFs generated for this example by scripts/make-pdfs.mjs into
 * public/documents/, by development slug and language.
 */
import type { L } from '../lib/routes';

export type Doc = { kind: 'brochure' | 'priceList'; href: string; size: string };

const DOCS: Record<string, Record<L, Doc[]>> = {
  'les-rives-de-bellerive': {
    fr: [
      { kind: 'brochure', href: '/documents/les-rives-de-bellerive-brochure-fr.pdf', size: '0,6 Mo' },
      { kind: 'priceList', href: '/documents/les-rives-de-bellerive-prix-fr.pdf', size: '70 ko' },
    ],
    de: [
      { kind: 'brochure', href: '/documents/les-rives-de-bellerive-broschuere-de.pdf', size: '0,6 MB' },
      { kind: 'priceList', href: '/documents/les-rives-de-bellerive-preise-de.pdf', size: '70 kB' },
    ],
  },
};

// fixture only: documents per development
export const devDocs = (slug: string, l: L, live: boolean): Doc[] => (live ? [] : (DOCS[slug]?.[l] ?? []));
