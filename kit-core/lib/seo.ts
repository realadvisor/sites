import type { Listing } from '@realadvisor/sites-sdk/types';
import type { Agency } from './agency';
import { img } from './image';
import { t } from './i18n';

const NON_CONTENT = /^(utm_\w+|fbclid|gclid|reason|enquiry|sent|ref|lot)$/;

/**
 * Canonical URL: path plus every active filter (sorted). Drops empty params,
 * `page=1` and non-content params (utm_*, reason, enquiry, ...), so
 * `/listings?status=sold&page=1` -> `/listings?status=sold`.
 */
export function canonicalUrl(url: URL, base: URL | string): string {
  const keep = [...url.searchParams]
    .filter(([k, v]) => v && !NON_CONTENT.test(k) && !(k === 'page' && v === '1'))
    .sort(([a], [b]) => a.localeCompare(b));
  const u = new URL(url.pathname, base);
  for (const [k, v] of keep) u.searchParams.append(k, v);
  return u.href;
}

/** JSON-LD for a <script> tag: `<` escaped so data can never close the tag. */
export const safeJsonLd = (data: unknown) => JSON.stringify(data).replace(/</g, '\\u003c');

/** schema.org RealEstateAgent for the home/contact page. */
export function agencyJsonLd(a: Agency, siteUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    name: a.name,
    url: siteUrl,
    logo: a.logo?.url,
    telephone: a.phone,
    email: a.email,
    address: a.address && {
      '@type': 'PostalAddress',
      streetAddress: a.address.street,
      postalCode: a.address.postcode,
      addressLocality: a.address.city,
      addressCountry: a.address.country,
    },
    sameAs: a.socials ? Object.values(a.socials) : undefined,
  };
}

const fold = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim();

/**
 * Listing reference shown to visitors (also in the enquiry message): the CRM
 * reference (`58W5-DZRY`) the agency uses on the phone, or the id prefix when
 * the data has none.
 */
export const listingRef = (l: Pick<Listing, 'id' | 'reference'>) => l.reference?.trim() || l.id.slice(0, 8);

/**
 * Listing name for <title>: always with its locality, and with its reference
 * when another listing of `others` (same city) has the same title. Agencies
 * often reuse a title ("Appartement 3.5 pièces"), and duplicate <title>s
 * hurt SEO. `${listingTitle(l, others)} | ${formatPrice(l)}` in the page.
 */
export function listingTitle(l: Pick<Listing, 'id' | 'title' | 'address'>, others: Pick<Listing, 'id' | 'title' | 'address'>[] = []): string {
  const city = l.address.city?.trim();
  let name = l.title.trim();
  if (city && !fold(name).includes(fold(city))) name += ` · ${city}`;
  const clash = !city || others.some((o) => o.id !== l.id && fold(o.title) === fold(l.title) && fold(o.address.city ?? '') === fold(city));
  return clash ? `${name} · ${t('ref')} ${listingRef(l)}` : name;
}

/** schema.org RealEstateListing for a listing detail page. */
export function listingJsonLd(l: Listing, pageUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: l.title,
    description: l.description?.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 500),
    url: pageUrl,
    datePosted: l.published_at,
    image: l.photos.slice(0, 6).map((p) => img(p.url, { w: 1200, h: 800 })),
    offers: {
      '@type': 'Offer',
      price: l.price_on_request ? undefined : l.price,
      priceCurrency: l.currency,
      availability: l.status === 'sold' ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock',
      businessFunction: l.offer_type === 'rent' ? 'http://purl.org/goodrelations/v1#LeaseOut' : 'http://purl.org/goodrelations/v1#Sell',
    },
    itemOffered: {
      '@type': 'Accommodation',
      numberOfRooms: l.rooms,
      numberOfBedrooms: l.bedrooms,
      numberOfBathroomsTotal: l.bathrooms,
      floorSize: l.living_surface && { '@type': 'QuantitativeValue', value: l.living_surface, unitCode: 'MTK' },
      address: {
        '@type': 'PostalAddress',
        streetAddress: l.address.street,
        postalCode: l.address.postcode,
        addressLocality: l.address.city,
        addressCountry: l.address.country,
      },
      geo: l.address.lat != null && l.address.lng != null
        ? { '@type': 'GeoCoordinates', latitude: l.address.lat, longitude: l.address.lng }
        : undefined,
    },
  };
}
