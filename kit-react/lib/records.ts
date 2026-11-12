/**
 * Helpers over SDK records (`@realadvisor/sites-sdk`) for the React kit's
 * pages: the agency of an organisation and its office, the price and the
 * reference as the Astro kit words them.
 */
import type { Listing } from '@realadvisor/sites-sdk/types';
import { formatPrice } from '@realadvisor/sites-kit-core/format';

export { agencyOf } from '@realadvisor/sites-kit-core/agency';
export { listingRef } from '@realadvisor/sites-kit-core/seo';

/**
 * `CHF 2'850'000`, `CHF 4'200 / Monat`, "Preis auf Anfrage" (DESIGN.md 5), in
 * the listing's currency and the page language (`locale`, default the site's).
 */
export const price = (l: Pick<Listing, 'price' | 'price_on_request' | 'offer_type'> & { currency?: string | null }, locale?: string) =>
  formatPrice(l, { locale });
