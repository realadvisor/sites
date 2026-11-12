import type { Organisation, Team } from '@realadvisor/sites-sdk/types';
import { img } from '@realadvisor/sites-kit-core/image';

/** Organization JSON-LD from the organisation and its primary team. */
export function organisationJsonLd(org: Organisation, team: Team | undefined, siteUrl: string) {
  const a = team?.address ?? org.address;
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: team?.name ?? org.name,
    legalName: org.name,
    url: siteUrl,
    ...(org.logo?.url ? { logo: img(org.logo.url, { w: 600, fit: 'fit' }) } : {}),
    ...(team?.phone ? { telephone: team.phone } : {}),
    ...(team?.email ? { email: team.email } : {}),
    ...(team?.description_text ? { description: team.description_text } : {}),
    ...(a
      ? { address: { '@type': 'PostalAddress', streetAddress: a.street, postalCode: a.postcode, addressLocality: a.city, addressCountry: a.country } }
      : {}),
  };
}

export const ogImage = (url?: string) => (url ? img(url, { w: 1200, h: 630 }) : undefined);
