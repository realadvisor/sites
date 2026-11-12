/**
 * Routes, slugs and French formatting for the whole site. One language (fr),
 * so every label is written here once; amounts and surfaces come from the
 * kit's `format` (1 250 000 €, 145 m²).
 */
import { formatAmount, formatSurface } from '@realadvisor/sites-kit/format';
import { propertyTypeLabel } from '@realadvisor/sites-kit/i18n';
import type { Agent, Listing, Team } from './data';

export { formatAmount, formatSurface };

export const R = {
  home: '/',
  buy: '/acheter',
  rent: '/louer',
  sell: '/vendre',
  sold: '/vendus',
  agencies: '/agences',
  team: '/equipe',
  cities: '/villes',
  about: '/a-propos',
  contact: '/contact',
  saved: '/favoris',
  legal: '/legal',
  privacy: '/privacy',
} as const;

/** The split view (cards beside the map) is how results open. */
export const searchUrl = (offer: 'buy' | 'rent', q: Record<string, string | undefined> = {}) => {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(q)) if (v) p.set(k, v);
  p.set('view', 'map');
  return `${offer === 'buy' ? R.buy : R.rent}?${p}`;
};

export const listingHref = (l: Pick<Listing, 'slug'>) => `/annonces/${l.slug}`;

export const slugify = (s: string) =>
  s
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

/** "Vellane Croix-Rousse" -> "croix-rousse". */
export const teamShortName = (t: Pick<Team, 'name'>, org = 'Vellane') => t.name.replace(new RegExp(`^${org}\\s+`, 'i'), '').trim() || t.name;
export const teamSlug = (t: Pick<Team, 'name'>) => slugify(teamShortName(t));
export const teamHref = (t: Pick<Team, 'name'>) => `${R.agencies}/${teamSlug(t)}`;

export const agentName = (a: Pick<Agent, 'first_name' | 'last_name'>) => `${a.first_name} ${a.last_name}`.trim();
export const agentSlug = (a: Pick<Agent, 'first_name' | 'last_name'>) => slugify(agentName(a));
export const agentHref = (a: Pick<Agent, 'first_name' | 'last_name'>) => `${R.team}/${agentSlug(a)}`;

export const citySlug = (city: string) => slugify(city);
export const cityHref = (city: string) => `${R.cities}/${citySlug(city)}`;

/** Cities with at least `min` listings (current and sold), most listings first. */
export function citiesOf(all: Listing[], min = 3) {
  const by = new Map<string, Listing[]>();
  for (const l of all) {
    const c = l.address.city?.trim();
    if (!c) continue;
    by.set(c, [...(by.get(c) ?? []), l]);
  }
  return [...by.entries()]
    .filter(([, ls]) => ls.length >= min)
    .sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0], 'fr'))
    .map(([city, listings]) => ({ city, slug: citySlug(city), listings }));
}

// ---- French formatting -------------------------------------------------

type Priced = Pick<Listing, 'price' | 'price_on_request' | 'offer_type' | 'status'>;

/** `1 250 000 €`, `1 450 € / mois`, "Prix sur demande"; a sold listing shows "Vendu". */
export function price(x: Priced): string {
  if (x.status === 'sold') return x.offer_type === 'rent' ? 'Loué' : 'Vendu';
  if (x.price_on_request || x.price == null || x.price <= 0) return 'Prix sur demande';
  const a = formatAmount(x.price);
  return x.offer_type === 'rent' ? `${a} / mois` : a;
}
export const hasPrice = (x: Priced) => x.status !== 'sold' && !x.price_on_request && x.price != null && x.price > 0;

const plural = (n: number, one: string, many: string) => `${n} ${n <= 1 ? one : many}`;
export const rooms = (n?: number) => (n == null ? '' : plural(n, 'pièce', 'pièces'));
export const bedrooms = (n?: number) => (!n ? '' : plural(n, 'chambre', 'chambres'));
export const bathrooms = (n?: number) => (!n ? '' : plural(n, 'salle de bains', 'salles de bains'));
export const surface = (n?: number) => (n == null ? '' : formatSurface(n));
export const floor = (n?: number) => (n == null ? '' : n === 0 ? 'Rez-de-chaussée' : n === 1 ? '1er étage' : `${n}e étage`);
export const typeLabel = (code: string) => propertyTypeLabel(code, 'fr-FR');

/** "Appartement · 4 pièces · 96 m²" style facts line, empty parts dropped. */
export const factsLine = (l: Listing) => [rooms(l.rooms), bedrooms(l.bedrooms), surface(l.living_surface)].filter(Boolean).join(' · ');

export const cityLine = (l: Listing) => [l.address.postcode, l.address.city].filter(Boolean).join(' ');

/** "fr, en" -> "français, anglais". */
const LANGS: Record<string, string> = { fr: 'français', en: 'anglais', de: 'allemand', it: 'italien', es: 'espagnol', pt: 'portugais', ar: 'arabe', zh: 'chinois' };
export const languages = (codes?: string[]) => (codes ?? []).map((c) => LANGS[c] ?? c).join(', ');

/** "+33 0 00 00 00 05" -> "tel:+330000000005". */
export const tel = (phone: string) => `tel:${phone.replace(/[^\d+]/g, '')}`;

/** "le 4 novembre 2026". */
export const date = (iso: string) => new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso));

/** "Lyon, Villeurbanne et Bordeaux". */
export const joinFr = (xs: string[], word = 'et') => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} ${word} ${xs[xs.length - 1]}`);
