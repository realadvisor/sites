/**
 * Localized routes. English is the main language (unprefixed URLs, as the
 * kit's i18n expects for the first locale); French lives under /fr with
 * French paths. Every page names its route key and segments; links, the
 * language switch, hreflang alternates and the sitemap come from this table.
 */
import type { Agent, Listing, Team } from '@realadvisor/sites-sdk/types';

export type L = 'en' | 'fr';
export const LANGS: readonly L[] = ['en', 'fr'];
export const LOCALE: Record<L, string> = { en: 'en-CH', fr: 'fr-CH' };
export const langOfPath = (path: string): L => (path === '/fr' || path.startsWith('/fr/') ? 'fr' : 'en');

export const ROUTES = {
  home: { en: '/', fr: '/fr' },
  buy: { en: '/buy', fr: '/fr/acheter' },
  rent: { en: '/rent', fr: '/fr/louer' },
  listing: { en: '/property', fr: '/fr/bien' },
  sell: { en: '/sell', fr: '/fr/vendre' },
  sold: { en: '/sold', fr: '/fr/vendus' },
  team: { en: '/team', fr: '/fr/equipe' },
  offices: { en: '/offices', fr: '/fr/bureaux' },
  destinations: { en: '/destinations', fr: '/fr/destinations' },
  journal: { en: '/journal', fr: '/fr/journal' },
  about: { en: '/about', fr: '/fr/a-propos' },
  contact: { en: '/contact', fr: '/fr/contact' },
  legal: { en: '/legal', fr: '/fr/legal' },
  privacy: { en: '/privacy', fr: '/fr/privacy' },
} as const;
export type RouteKey = keyof typeof ROUTES;

/** `/fr/bien/<slug>`: a route plus its segments. */
export const href = (key: RouteKey, l: L, ...segs: string[]) => {
  const base = ROUTES[key][l];
  return segs.length ? `${base === '/' ? '' : base}/${segs.map(encodeURIComponent).join('/')}` : base;
};

/** hreflang alternates of one page in both languages. */
export const alternates = (key: RouteKey, ...segs: string[]) => LANGS.map((l) => ({ lang: LOCALE[l], href: href(key, l, ...segs) }));

// ---- slugs ---------------------------------------------------------------
export const slugify = (s: string) =>
  s
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/œ/g, 'oe')
    .replace(/æ/g, 'ae')
    .replace(/ß/g, 'ss')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

type NamedAgent = Pick<Agent, 'id' | 'first_name' | 'last_name'>;
/** Agent page slug: `julien-favre`, with the id prefix only when two agents share a name. */
export const agentSlug = (a: NamedAgent, all: NamedAgent[] = []) => {
  const base = slugify(`${a.first_name} ${a.last_name}`) || a.id.slice(0, 8);
  const clash = all.some((o) => o.id !== a.id && slugify(`${o.first_name} ${o.last_name}`) === base);
  return clash ? `${base}-${a.id.slice(0, 8)}` : base;
};

type PlacedTeam = Pick<Team, 'id' | 'name' | 'address'>;
/** Office page slug: its city in English (`geneva`), with the id prefix when two teams share a city. */
export const teamSlug = (t: PlacedTeam, all: PlacedTeam[] = []) => {
  const key = (x: PlacedTeam) => slugify(CITY_EN[slugify(x.address.city ?? '')] ?? x.address.city ?? x.name);
  const base = key(t) || t.id.slice(0, 8);
  const clash = all.some((o) => o.id !== t.id && key(o) === base);
  return clash ? `${base}-${t.id.slice(0, 8)}` : base;
};

/** English names of the few cities that have one; every other place keeps its own name. */
export const CITY_EN: Record<string, string> = { geneve: 'Geneva' };

export const listingHref = (x: Pick<Listing, 'slug'>, l: L) => href('listing', l, x.slug);
