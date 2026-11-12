/**
 * The development's PDFs (fixture only: the API has no documents yet). We
 * generate them from our own HTML with `pnpm documents` (scripts/documents.mjs),
 * which writes public/documents/<lang>/ and src/content/documents.json.
 */
import docs from '../content/documents.json';
import type { L } from './routes';

export type Doc = { key: 'brochure' | 'prices' | 'plans'; href: string; title: string; description: string; pages: number; bytes: number };
export const DOCS = docs as unknown as { updated: string; files: Record<L, Doc[]> };
export const docsFor = (l: L) => DOCS.files[l] ?? [];
export const brochure = (l: L) => docsFor(l).find((d) => d.key === 'brochure')?.href ?? null;
