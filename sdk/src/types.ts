/**
 * What @realadvisor/sites-sdk returns: the `/v3/public/*` contract of rest-api
 * (src/routes/public-schemas.ts), field for field and in its snake_case. The
 * SDK passes answers through; rest-api/test/public-sdk-types.test.ts fails
 * when these types and the schemas differ. A field with no value is absent,
 * arrays are arrays, descriptions are sanitized HTML, coordinates are never
 * exact.
 */

export type Photo = { url: string; alt: string };

export type Address = {
  street?: string;
  postcode?: string;
  city?: string;
  country?: string;
  /** Rounded by the listing's address display option (about 10 m, 100 m or 1 km). */
  lat?: number;
  lng?: number;
};

export type Socials = {
  facebook?: string;
  instagram?: string;
  linkedin?: string;
  x?: string;
  youtube?: string;
  tiktok?: string;
};

/** The organisation the site is for (an agency with one or more teams). */
export type Organisation = {
  id: string;
  name: string;
  logo?: Photo;
  website?: string;
  address?: Address;
  brand?: { primary: string };
};

/** One team (office, branch) of the organisation. */
export type Team = {
  id: string;
  name: string;
  /** The site's own team: first in `teams()`. */
  primary?: boolean;
  logo?: Photo;
  website?: string;
  phone?: string;
  email?: string;
  address: Address;
  socials: Socials;
  /** Sanitized HTML, same allowlist as Listing.description. */
  description?: string;
  description_text?: string;
};

export type Agent = {
  id: string;
  first_name: string;
  last_name: string;
  title?: string;
  phone?: string;
  email?: string;
  photo?: Photo;
  languages?: string[];
  bio?: string;
  /** The agent's active teams. */
  team_ids: string[];
};

export type OfferType = 'buy' | 'rent';
export type ListingStatus = 'available' | 'sold';

/** The facts a listing and a unit share. Money is in the record's `currency`, surfaces in m². */
export type PropertyFacts = {
  /** Set when title and description came in the `locale` asked for; absent: the original texts. Mark it as the element's `lang`. */
  text_locale?: string;
  balcony_surface?: number;
  terrace_surface?: number;
  garden_surface?: number;
  /** 0 = ground floor. */
  floor?: number;
  /** Floors of the building. */
  building_floors?: number;
  /** Directions the property faces. */
  orientation?: Array<'north' | 'east' | 'south' | 'west'>;
  construction_year?: number;
  renovation_year?: number;
  /** Energy consumption class of the certificate. */
  energy_class?: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G';
  /** The certificate the class is from, as typed in the CRM. */
  energy_certificate_version?: string;
  /** Minergie label (Switzerland). */
  minergie?: 'minergie' | 'minergie_p' | 'minergie_eco' | 'minergie_p_eco';
  /** CRM heating key: `central`, `district`, `electric`, `gas`, `heat_pump`, `none`, `oil`, `other`, `pellet`, `solar`, `wood`. */
  heating?: string;
  has_cellar?: boolean;
  indoor_parkings?: number;
  outdoor_parkings?: number;
  /** Monthly charges of the property. */
  charges?: number;
  /** Rentals: monthly extra costs on top of `price`. Absent when the price is hidden. */
  rent_extra?: number;
  /** Price of all the parkings together. Absent when the price is hidden. */
  parking_price?: number;
  /** Price per indoor parking. Absent when the price is hidden. */
  indoor_parking_price?: number;
  /** Price per outdoor parking. Absent when the price is hidden. */
  outdoor_parking_price?: number;
  /** true when the parkings are included in `price`. */
  parking_included?: boolean;
  /** Move-in date, `YYYY-MM-DD`. */
  available_from?: string;
  furnished?: boolean;
  pets_allowed?: boolean;
  video_url?: string;
  virtual_visit_url?: string;
};

export type Listing = PropertyFacts & {
  id: string;
  /** `<title-slug>-<id>`: `listing()` takes it or the id. */
  slug: string;
  title: string;
  /** Sanitized HTML: only p, br, ul, ol, li, strong, em, h3, h4, no attributes. Render with the kit's RichText. */
  description?: string;
  /** The description as plain text, for meta tags and cards. */
  description_text?: string;
  offer_type: OfferType;
  /** CRM property type name, e.g. `apartment`, `house_villa`, `apartment_penthouse`. */
  property_type: string;
  status: ListingStatus;
  /** Absent when hidden: `price_on_request` is then true. */
  price?: number;
  currency: string;
  price_on_request?: boolean;
  rooms?: number;
  bedrooms?: number;
  bathrooms?: number;
  living_surface?: number;
  land_surface?: number;
  address: Address;
  photos: Photo[];
  agent?: Agent;
  /** Feature keys (`elevator`, `balcony`, `parking`): show them translated, never raw. */
  features: string[];
  published_at: string;
  /** The CRM reference agents and clients use (`58W5-DZRY`). */
  reference?: string;
  /** Teams of the listing's broker. */
  team_ids: string[];
};

export type UnitStatus = 'available' | 'reserved' | 'sold';

/** One unit (lot) of a new-build development. */
export type Unit = PropertyFacts & {
  id: string;
  /** e.g. "4,5 pièces · Rez-de-jardin". */
  name: string;
  /** The unit number in the development (`A1.2`). */
  reference?: string;
  status: UnitStatus;
  offer_type: OfferType;
  property_type: string;
  rooms?: number;
  bedrooms?: number;
  bathrooms?: number;
  living_surface?: number;
  floor_label?: string;
  /** Only on units for sale whose price is public. */
  price?: number;
  currency: string;
  price_on_request?: boolean;
  /** Units that are live listings: same text and photos as the listing. */
  description?: string;
  description_text?: string;
  photos?: Photo[];
  /** The unit's outline on the development's `site_plan`: SVG polygon points in the image's own pixels. */
  site_plan_points?: string;
  /** Set when the unit is also a listing live on one of the client's portals: `listing(listing_slug)`. */
  listing_slug?: string;
  features: string[];
};

type Range = { min: number; max: number };

/** A company of a development: its developer, architect or general contractor. */
export type Company = { name: string; website?: string; logo?: Photo };

export type Development = {
  id: string;
  slug: string;
  title: string;
  description?: string;
  description_text?: string;
  /** CRM development status: planning, construction, marketing, delivered, ... */
  status?: string;
  delivery_date?: string;
  address: Address;
  photos: Photo[];
  site_plan?: Photo;
  developer?: Company;
  architect?: Company;
  general_contractor?: Company;
  stats: {
    units: number;
    available: number;
    reserved: number;
    sold: number;
    price?: Range;
    rooms?: Range;
    living_surface?: Range;
  };
  currency: string;
  agents: Agent[];
  /** Teams of the development's broker. */
  team_ids: string[];
};

export type DevelopmentWithUnits = Development & { units: Unit[] };

/** The site's portals by name: `main` is the default and the enquiry portal. */
export type Portals = { main: string } & Record<string, string>;

export type ListingsQuery = {
  /** A name from the client's `portals`. Default `main`. */
  portal?: string;
  team_id?: string;
  offer_type?: OfferType;
  /** Exact type name, or a prefix: `apartment` matches `apartment_furnished_flat`. */
  property_type?: string;
  status?: ListingStatus;
  /** Case- and accent-insensitive: `geneve` finds Genève. */
  city?: string;
  min_price?: number;
  max_price?: number;
  min_rooms?: number;
  /** The page language (`de`, `fr-CH`): texts in it when the CRM has them (`text_locale`), else the original. */
  locale?: string;
  /** 1..200, default 24. */
  limit?: number;
  offset?: number;
};

/** Which language to read texts in. */
export type TextQuery = {
  /** The page language (`de`, `fr-CH`): texts in it when the CRM has them (`text_locale`), else the original. */
  locale?: string;
};

export type Pagination = {
  limit: number;
  offset: number;
  total: number;
  /** true when `total` stopped counting at its cap. */
  total_is_capped: boolean;
  has_more: boolean;
};

/** One page of a list, as rest-api answers it. */
export type Page<T> = { data: T[]; pagination: Pagination };

export type ClientOptions = {
  /** Without: the site's own portal (the key's), for reads and enquiries. */
  portals?: Portals;
  /** Tests only: else process.env.SITES_API_URL. */
  url?: string;
  /** Tests only: else process.env.SITES_API_KEY. */
  key?: string;
  /** Tests only: else globalThis.fetch. */
  fetch?: typeof fetch;
};

export type SitesClient = {
  organisation(): Promise<Organisation>;
  /** Primary team first. */
  teams(): Promise<Team[]>;
  /** The whole organisation without team_id. */
  agents(q?: { team_id?: string }): Promise<Agent[]>;
  listings(q?: ListingsQuery): Promise<Page<Listing>>;
  /** Every page of `listings(q)`. */
  allListings(q?: Omit<ListingsQuery, 'limit' | 'offset'>): Promise<Listing[]>;
  /** Live on any of the site's portals; null when not found. */
  listing(slugOrId: string, q?: TextQuery): Promise<Listing | null>;
  developments(q?: { team_id?: string } & TextQuery): Promise<Development[]>;
  /** The units' texts follow `locale`; the CRM keeps a development's own texts in one language. */
  development(slugOrId: string, q?: TextQuery): Promise<DevelopmentWithUnits | null>;
  /**
   * The public Turnstile key the enquiry form renders, kept 5 min. null: no
   * widget (verification off, or the lookup failed). Fixture:
   * FIXTURE_TURNSTILE_SITE_KEY, a stand-in that never loads Turnstile.
   */
  turnstileSiteKey(): Promise<string | null>;
};

/** A fixture record's texts in other languages, by language (`de`, `fr`, ...). */
export type FixtureTranslations = {
  translations?: Record<string, { title?: string; description?: string; description_text?: string }>;
};

/**
 * A site's data without the API (`createFixtureClient`): the same records,
 * as the API answers them. Sites may add their own keys. A listing or unit
 * may carry `translations`: with `locale`, the fixture client serves them as
 * the API serves the CRM's (`text_locale` when every text is translated),
 * and never passes `translations` on.
 */
export type Fixture = {
  organisation: Organisation;
  /** Primary team first. */
  teams: Team[];
  agents: Agent[];
  listings: Array<Listing & FixtureTranslations>;
  developments?: Array<Omit<DevelopmentWithUnits, 'units'> & { units: Array<Unit & FixtureTranslations> }>;
  /** The portals a live client of this site uses. */
  portals?: Portals;
  /** What turnstileSiteKey() answers. Default FIXTURE_TURNSTILE_SITE_KEY; null: no widget. */
  turnstile_site_key?: string | null;
};

/**
 * Every failure, as `err.code`. Not found is never an error (`null`).
 * - `invalid` 400: a field is wrong, `fields` says which.
 * - `invalid_portal` 400: a portal is not an api portal of the organisation.
 * - `invalid_team` 400: team_id is not a team of the organisation.
 * - `rejected` 400: the CRM refused the enquiry.
 * - `site_key` 401, 403: the site's key was revoked or rotated, or may not read this.
 * - `verification_required` 403: no valid Turnstile token.
 * - `rate_limited` 429: too many enquiries.
 * - `unavailable` any other status, a timeout, or no data access configured.
 */
export type ErrorCode =
  | 'invalid'
  | 'invalid_portal'
  | 'invalid_team'
  | 'rejected'
  | 'site_key'
  | 'verification_required'
  | 'rate_limited'
  | 'unavailable';
