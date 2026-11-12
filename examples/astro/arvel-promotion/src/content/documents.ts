/**
 * Documents per programme (brochure, plans, price list). The API has none yet
 * (fixture only: `documents: []`), so the site generates them from its own
 * HTML with Playwright (scripts/documents.mjs) into public/documents/ and
 * writes this manifest (documents.json) with their sizes.
 */
import manifest from './documents.json';

export type Doc = { href: string; title: string; description: string; kind: 'brochure' | 'plans' | 'prices'; bytes: number; pages: number; date: string };
export const documentsFor = (slug: string): Doc[] => ((manifest as Record<string, Doc[]>)[slug] ?? []);
export const formatBytes = (b: number) => (b > 1e6 ? `${(b / 1e6).toFixed(1).replace('.', ',')} Mo` : `${Math.max(1, Math.round(b / 1e3))} Ko`);
