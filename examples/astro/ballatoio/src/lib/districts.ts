/**
 * Milan districts (quartieri). The API has a city and a postcode per listing,
 * no district: the agency's own map of postcodes to the districts it works
 * in is site content, kept here. A Milan listing whose postcode is not on
 * the map simply has no district (it still shows under "Milano").
 * Texts per district live in src/content/quartieri/<lang>/<slug>.md.
 */
import type { Listing } from '@realadvisor/sites-sdk/types';
import { sameText } from './data';
import type { PlaceKey } from './places';

export type District = {
  slug: string;
  name: string;
  postcodes: string[];
  /** Key in src/data/places.json (bucket photos of the place), when there are any. */
  place?: PlaceKey;
};

export const DISTRICTS: District[] = [
  { slug: 'brera', name: 'Brera', postcodes: ['20121'], place: 'brera' },
  { slug: 'isola', name: 'Isola', postcodes: ['20124', '20159'], place: 'isola' },
  { slug: 'nolo', name: 'NoLo', postcodes: ['20127'] },
  { slug: 'porta-venezia', name: 'Porta Venezia', postcodes: ['20129'] },
  { slug: 'citta-studi', name: 'Città Studi', postcodes: ['20131', '20133'] },
  { slug: 'porta-romana', name: 'Porta Romana', postcodes: ['20122', '20135'] },
  { slug: 'navigli', name: 'Navigli', postcodes: ['20143', '20144'], place: 'navigli' },
];

export const MILANO = 'Milano';
export const inMilan = (l: Listing) => sameText(l.address.city, MILANO);

export function districtOf(l: Listing): District | undefined {
  if (!inMilan(l) || !l.address.postcode) return undefined;
  return DISTRICTS.find((d) => d.postcodes.includes(l.address.postcode!));
}

/** "Brera, Milano", "Lesmo": where a listing is, in the words of a local. */
export const placeOf = (l: Listing) => {
  const d = districtOf(l);
  return d ? `${d.name}, ${l.address.city}` : (l.address.city ?? '');
};

/** Districts that have at least one listing (any offer, any status), with their listings, in map order. */
export function districtsWithListings(all: Listing[]) {
  return DISTRICTS.map((d) => ({ ...d, listings: all.filter((l) => districtOf(l)?.slug === d.slug) })).filter((d) => d.listings.length > 0);
}

