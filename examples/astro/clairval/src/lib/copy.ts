/**
 * The site's shared UI words in English and French. Kit parts (form, legal,
 * consent, search) bring their own. Page-specific copy lives in each view.
 * `{name}` placeholders are filled by tx().
 */
import type { L } from './routes';
import { CITY_EN, slugify } from './routes';

const T = {
  navBuy: { en: 'Buy', fr: 'Acheter' },
  navRent: { en: 'Rent', fr: 'Louer' },
  navSell: { en: 'Sell', fr: 'Vendre' },
  navSold: { en: 'Sold', fr: 'Vendus' },
  navDestinations: { en: 'Destinations', fr: 'Destinations' },
  navOffices: { en: 'Offices', fr: 'Bureaux' },
  navTeam: { en: 'Team', fr: 'Équipe' },
  navJournal: { en: 'Journal', fr: 'Journal' },
  navAbout: { en: 'About', fr: 'À propos' },
  navContact: { en: 'Contact', fr: 'Contact' },
  valuation: { en: 'Request a valuation', fr: 'Demander une estimation' },
  menu: { en: 'Menu', fr: 'Menu' },
  closeMenu: { en: 'Close the menu', fr: 'Fermer le menu' },
  mainNav: { en: 'Main navigation', fr: 'Navigation principale' },
  skip: { en: 'Skip to content', fr: 'Aller au contenu' },
  language: { en: 'Language', fr: 'Langue' },
  breadcrumb: { en: 'Breadcrumb', fr: 'Fil d’Ariane' },
  home: { en: 'Home', fr: 'Accueil' },
  phone: { en: 'Phone', fr: 'Téléphone' },
  email: { en: 'Email', fr: 'E-mail' },
  speaks: { en: 'Speaks', fr: 'Langues' },
  call: { en: 'Call', fr: 'Appeler' },
  message: { en: 'Message', fr: 'Message' },
  office: { en: 'Office', fr: 'Bureau' },
  sold: { en: 'Sold', fr: 'Vendu' },
  forRent: { en: 'For rent', fr: 'À louer' },
  land: { en: 'land', fr: 'terrain' },
  viewAll: { en: 'View all', fr: 'Tout voir' },
  footerOffices: { en: 'Offices', fr: 'Bureaux' },
  footerSite: { en: 'Properties', fr: 'Biens' },
  footerCompany: { en: 'Clairval', fr: 'Clairval' },
  inCity: { en: 'in {city}', fr: 'à {city}' },
  page: { en: 'page', fr: 'page' },
  mapView: { en: 'map', fr: 'carte' },
  backToSearch: { en: 'Back to the search', fr: 'Retour à la recherche' },
} as const;

export type Key = keyof typeof T;

export const tx =
  (l: L) =>
  (key: Key, vars: Record<string, string | number> = {}) =>
    T[key][l].replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''));

/** A city in the page language: "Geneva" in English, "Genève" in French; others unchanged. */
export const cityName = (city: string | undefined, l: L) => {
  if (!city) return '';
  return l === 'en' ? (CITY_EN[slugify(city)] ?? city) : city;
};

/** "Geneva, Gstaad and Saint-Tropez" / "Genève, Gstaad et Saint-Tropez". */
export const joinList = (xs: string[], l: L) =>
  new Intl.ListFormat(l === 'fr' ? 'fr' : 'en-GB', { type: 'conjunction' }).format(xs);

const LANG_NAMES: Record<string, { en: string; fr: string }> = {
  en: { en: 'English', fr: 'anglais' },
  fr: { en: 'French', fr: 'français' },
  de: { en: 'German', fr: 'allemand' },
  it: { en: 'Italian', fr: 'italien' },
  es: { en: 'Spanish', fr: 'espagnol' },
  pt: { en: 'Portuguese', fr: 'portugais' },
  ru: { en: 'Russian', fr: 'russe' },
  ar: { en: 'Arabic', fr: 'arabe' },
  zh: { en: 'Chinese', fr: 'chinois' },
  nl: { en: 'Dutch', fr: 'néerlandais' },
};
export const languageName = (code: string, l: L) => LANG_NAMES[code]?.[l] ?? code.toUpperCase();
export const languages = (codes: string[] | undefined, l: L) => {
  const names = (codes ?? []).map((c) => languageName(c, l));
  const s = names.length ? joinList(names, l) : '';
  return l === 'fr' ? s : s;
};
