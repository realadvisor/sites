/** The generated PDFs (scripts/documents.mjs writes them and documents.json). */
import docs from '../content/documents.json';
import type { Lang } from './i18n';

export type Doc = { id: 'dossier' | 'precios' | 'planos'; lang: Lang; href: string; title: string; description: string; pages: number; bytes: number };
export const DOCS = docs as { updated: string; files: Doc[] };
export const docsFor = (l: Lang) => DOCS.files.filter((d) => d.lang === l);
export const docHref = (id: Doc['id'], l: Lang) => DOCS.files.find((d) => d.id === id && d.lang === l)?.href ?? `/documents/${id}-casa-de-les-rajoles-${l}.pdf`;
export const tel = (phone: string) => `tel:${phone.replace(/[^\d+]/g, '')}`;
