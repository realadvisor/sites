/**
 * Localized routes. German is the default language (unprefixed URLs, as the
 * kit's i18n expects); French lives under /fr and English under /en, each
 * with its own paths. Every page names its route key and segments; links,
 * the language switch, hreflang alternates and the sitemap come from this
 * one table.
 */
import type { Agent, Listing, Team } from '@realadvisor/sites-sdk/types';

export type L = 'de' | 'fr' | 'en';
export const LANGS: readonly L[] = ['de', 'fr', 'en'];
export const LOCALE: Record<L, string> = { de: 'de-CH', fr: 'fr-CH', en: 'en-CH' };

export const ROUTES = {
  home: { de: '/', fr: '/fr', en: '/en' },
  buy: { de: '/kaufen', fr: '/fr/acheter', en: '/en/buy' },
  rent: { de: '/mieten', fr: '/fr/louer', en: '/en/rent' },
  listing: { de: '/objekte', fr: '/fr/biens', en: '/en/properties' },
  sell: { de: '/verkaufen', fr: '/fr/vendre', en: '/en/sell' },
  sold: { de: '/verkauft', fr: '/fr/vendus', en: '/en/sold' },
  team: { de: '/team', fr: '/fr/equipe', en: '/en/team' },
  offices: { de: '/standorte', fr: '/fr/bureaux', en: '/en/offices' },
  areas: { de: '/regionen', fr: '/fr/regions', en: '/en/regions' },
  developments: { de: '/neubau', fr: '/fr/neuf', en: '/en/new-homes' },
  about: { de: '/ueber-uns', fr: '/fr/a-propos', en: '/en/about' },
  contact: { de: '/kontakt', fr: '/fr/contact', en: '/en/contact' },
  legal: { de: '/legal', fr: '/fr/legal', en: '/en/legal' },
  privacy: { de: '/privacy', fr: '/fr/privacy', en: '/en/privacy' },
} as const;
export type RouteKey = keyof typeof ROUTES;

/** `/fr/biens/<slug>`: a route plus its segments. */
export const href = (key: RouteKey, l: L, ...segs: string[]) => {
  const base = ROUTES[key][l];
  return segs.length ? `${base === '/' ? '' : base}/${segs.map(encodeURIComponent).join('/')}` : base;
};

/** hreflang alternates of one page in every language. */
export const alternates = (key: RouteKey, ...segs: string[]) => LANGS.map((l) => ({ lang: LOCALE[l], href: href(key, l, ...segs) }));

/** Language of a URL path (`/fr/...` French, `/en/...` English, else German). */
export const langOfPath = (path: string): L => {
  const seg = path.split('/')[1];
  return seg === 'fr' || seg === 'en' ? seg : 'de';
};

// ---- slugs ---------------------------------------------------------------
export const slugify = (s: string) =>
  s
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/ß/g, 'ss')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

/** City slug as Swiss German writes it: Zürich -> zuerich. */
export const citySlug = (s: string) => slugify(s.replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/Ä/g, 'Ae').replace(/Ö/g, 'Oe').replace(/Ü/g, 'Ue'));

/** Agent page slug: `andrea-meili`, with the id prefix only when two agents share a name. */
export const agentSlug = (a: Pick<Agent, 'id' | 'first_name' | 'last_name'>, all: Pick<Agent, 'id' | 'first_name' | 'last_name'>[] = []) => {
  const base = slugify(`${a.first_name} ${a.last_name}`) || a.id.slice(0, 8);
  const clash = all.some((o) => o.id !== a.id && slugify(`${o.first_name} ${o.last_name}`) === base);
  return clash ? `${base}-${a.id.slice(0, 8)}` : base;
};

/** Office (and region) slug: its city (`zuerich`), with the id prefix when two teams share a city. */
export const teamSlug = (t: Pick<Team, 'id' | 'name' | 'address'>, all: Pick<Team, 'id' | 'name' | 'address'>[] = []) => {
  const base = citySlug(t.address.city ?? t.name) || t.id.slice(0, 8);
  const clash = all.some((o) => o.id !== t.id && citySlug(o.address.city ?? o.name) === base);
  return clash ? `${base}-${t.id.slice(0, 8)}` : base;
};

/** Unit page slug: `3-5-zimmer-1-og-c5a3266c` (name + id prefix, resolved by the prefix). */
export const unitSlug = (u: { id: string; name: string }) => `${slugify(u.name)}-${u.id.slice(0, 8)}`;
export const unitIdPrefix = (slug: string) => slug.match(/([0-9a-f]{8})$/i)?.[1]?.toLowerCase();

export const listingHref = (x: Pick<Listing, 'slug'>, l: L) => href('listing', l, x.slug);
