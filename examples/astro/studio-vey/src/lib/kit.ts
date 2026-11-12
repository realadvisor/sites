/** Price and rooms as this site words them, over SDK records. */
import type { Listing } from '@realadvisor/sites-sdk/types';
import { formatPrice } from '@realadvisor/sites-kit-core/format';

/** `CHF 2'850'000`, `CHF 4'200 / Monat`, "Preis auf Anfrage". */
export const price = (l: Pick<Listing, 'price' | 'price_on_request' | 'offer_type'>) =>
  formatPrice({ price: l.price, price_on_request: l.price_on_request, offer_type: l.offer_type });

/** "4.5 Zimmer": a dot, never rounded (DESIGN.md 8). */
export const rooms = (n: number | undefined) => (n == null ? '' : `${n} Zimmer`);
