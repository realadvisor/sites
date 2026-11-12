/**
 * Localized routes. Italian is the main language (unprefixed URLs, as the
 * kit's i18n expects), German lives under /de with German paths. Links, the
 * language switcher, hreflang alternates and the sitemap use this one table.
 */
import type { Lang } from '@realadvisor/sites-kit/i18n';

export type L = 'it' | 'de';
export const LANGS: readonly L[] = ['it', 'de'];
export const LOCALE: Record<L, string> = { it: 'it-CH', de: 'de-CH' };
export const kl = (l: L): Lang => l;

export const ROUTES = {
  home: { it: '/', de: '/de' },
  units: { it: '/appartamenti', de: '/de/wohnungen' },
  compare: { it: '/appartamenti/confronto', de: '/de/wohnungen/vergleich' },
  location: { it: '/posizione', de: '/de/lage' },
  gallery: { it: '/galleria', de: '/de/galerie' },
  documents: { it: '/documenti', de: '/de/dokumente' },
  contact: { it: '/contatti', de: '/de/kontakt' },
  legal: { it: '/legal', de: '/de/legal' },
  privacy: { it: '/privacy', de: '/de/privacy' },
} as const;
export type RouteKey = keyof typeof ROUTES;

/** `/de/wohnungen/<slug>`: a route plus its segments. */
export const href = (key: RouteKey, l: L, ...segs: string[]) => {
  const base = ROUTES[key][l];
  return segs.length ? `${base === '/' ? '' : base}/${segs.map(encodeURIComponent).join('/')}` : base;
};

/** hreflang alternates of one page in both languages. */
export const alternates = (key: RouteKey, ...segs: string[]) => LANGS.map((l) => ({ lang: LOCALE[l], href: href(key, l, ...segs) }));

export const slugify = (s: string) =>
  s
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/ß/g, 'ss')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

/** tel: href from a displayed number. */
export const tel = (p: string) => `tel:${p.replace(/[^\d+]/g, '')}`;
