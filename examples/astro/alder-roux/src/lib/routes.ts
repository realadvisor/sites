/**
 * Localized routes. French is the default language (unprefixed URLs, as the
 * kit's i18n expects), German lives under /de with German paths. Every page
 * names its route key and segments; links, the language switcher, hreflang
 * alternates and the sitemap are built from the same table.
 */
import type { Agent, Listing, Team } from '@realadvisor/sites-sdk/types';

export type L = 'fr' | 'de';
export const LANGS: readonly L[] = ['fr', 'de'];
export const LOCALE: Record<L, string> = { fr: 'fr-CH', de: 'de-CH' };
export const NUM_LOCALE = 'de-CH';

export const ROUTES = {
  home: { fr: '/', de: '/de' },
  buy: { fr: '/acheter', de: '/de/kaufen' },
  rent: { fr: '/louer', de: '/de/mieten' },
  listing: { fr: '/biens', de: '/de/objekte' },
  sell: { fr: '/vendre', de: '/de/verkaufen' },
  team: { fr: '/equipe', de: '/de/team' },
  offices: { fr: '/bureaux', de: '/de/standorte' },
  areas: { fr: '/regions', de: '/de/regionen' },
  developments: { fr: '/neuf', de: '/de/neubau' },
  sold: { fr: '/vendus', de: '/de/verkauft' },
  about: { fr: '/a-propos', de: '/de/ueber-uns' },
  contact: { fr: '/contact', de: '/de/kontakt' },
  legal: { fr: '/legal', de: '/de/legal' },
  privacy: { fr: '/privacy', de: '/de/privacy' },
} as const;
export type RouteKey = keyof typeof ROUTES;

/** `/de/objekte/<slug>`: a route plus its segments. */
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

/** Agent page slug: `camille-roux`, with the id prefix only when two agents share a name. */
export const agentSlug = (a: Pick<Agent, 'id' | 'first_name' | 'last_name'>, all: Pick<Agent, 'id' | 'first_name' | 'last_name'>[] = []) => {
  const base = slugify(`${a.first_name} ${a.last_name}`) || a.id.slice(0, 8);
  const clash = all.some((o) => o.id !== a.id && slugify(`${o.first_name} ${o.last_name}`) === base);
  return clash ? `${base}-${a.id.slice(0, 8)}` : base;
};

/** Office page slug: its city (`geneve`), with the id prefix when two teams share a city. */
export const teamSlug = (t: Pick<Team, 'id' | 'name' | 'address'>, all: Pick<Team, 'id' | 'name' | 'address'>[] = []) => {
  const base = slugify(t.address.city ?? t.name) || t.id.slice(0, 8);
  const clash = all.some((o) => o.id !== t.id && slugify(o.address.city ?? o.name) === base);
  return clash ? `${base}-${t.id.slice(0, 8)}` : base;
};

/** Unit page slug: `4-pieces-rez-de-jardin-2cf729a2` (name + id prefix, resolved by the prefix). */
export const unitSlug = (u: { id: string; name: string }) => `${slugify(u.name)}-${u.id.slice(0, 8)}`;
export const unitIdPrefix = (slug: string) => slug.match(/([0-9a-f]{8})$/i)?.[1]?.toLowerCase();

export const listingHref = (x: Pick<Listing, 'slug'>, l: L) => href('listing', l, x.slug);
