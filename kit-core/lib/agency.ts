/**
 * The agency a page names (header, footer, legal notice, JSON-LD): the
 * organisation and its office (the primary team) in one record. The
 * organisation's address, logo and website come first, the team's contact
 * details after.
 */
import type { Fixture, Organisation, Team } from '@realadvisor/sites-sdk/types';

/**
 * Legal identity for the legal notice, when the site has it (not served by
 * the API yet: the site's fixture `legal`). Every field is optional: show
 * only what is set, never invent the rest.
 */
export type AgencyLegal = {
  /** Registered company name, e.g. `Demo Agency SA`. Default: `name`. */
  company_name?: string;
  /** CH UID (CHE-123.456.789), FR SIREN/SIRET, IT REA, ES NIF/CIF. */
  registration_number?: string;
  /** VAT number (CH MWST, FR TVA, IT P.IVA, ES NIF-IVA). */
  vat_number?: string;
  /** FR carte professionnelle (CPI) number and issuing CCI. */
  professional_card?: string;
  /** Person responsible for the content (CH/DE Impressum). */
  representative?: string;
};

export type Agency = Pick<Organisation, 'id' | 'name' | 'logo' | 'website' | 'address' | 'brand'> &
  Partial<Pick<Team, 'phone' | 'email' | 'socials' | 'description' | 'description_text'>> & { legal?: AgencyLegal };

/** A kit fixture (src/data/*.json): the SDK's Fixture, and the agency's legal identity. */
export type SiteFixture = Fixture & { legal?: AgencyLegal };

/** The agency of `org` and its office `team` (the primary team). */
export const agencyOf = (org: Organisation, team?: Team, legal?: AgencyLegal): Agency => {
  const a: Agency = {
    id: org.id,
    name: org.name,
    logo: org.logo ?? team?.logo,
    website: org.website ?? team?.website,
    address: org.address ?? team?.address,
    brand: org.brand,
    phone: team?.phone,
    email: team?.email,
    socials: team?.socials,
    description: team?.description,
    description_text: team?.description_text,
    legal,
  };
  for (const k of Object.keys(a) as (keyof Agency)[]) if (a[k] === undefined) delete a[k];
  return a;
};
