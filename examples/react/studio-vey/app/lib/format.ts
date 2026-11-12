/** Small formatting helpers this site adds to `@realadvisor/sites-kit/format`. */
import type { Agent, Listing } from '@realadvisor/sites-sdk/types';
import { formatSurface, LOCALE } from '@realadvisor/sites-kit/format';
import { propertyTypeLabel } from '@realadvisor/sites-kit/i18n';

export { price } from '@realadvisor/sites-kit-react/lib/records';

/** "4.5 Zimmer": a dot, never rounded (DESIGN.md 8). */
export const rooms = (n: number | undefined) => (n == null ? '' : `${n} Zimmer`);

export const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, '')}`;

const languageNames = new Intl.DisplayNames(['de'], { type: 'language' });
/** ["de", "en"] -> "Deutsch, Englisch" */
export const languages = (codes: string[] = []) => codes.map((c) => languageNames.of(c) ?? c).join(', ');

const dateFmt = new Intl.DateTimeFormat(LOCALE, { day: 'numeric', month: 'long', year: 'numeric' });
export const formatDate = (d: string | Date) => dateFmt.format(typeof d === 'string' ? new Date(d) : d);

export const fullName = (a: Pick<Agent, 'first_name' | 'last_name'>) => `${a.first_name} ${a.last_name}`;

/** "4.5 Zimmer · 148 m²" */
export const facts = (l: Pick<Listing, 'rooms' | 'living_surface'>) =>
  [rooms(l.rooms), l.living_surface != null ? formatSurface(l.living_surface) : ''].filter(Boolean).join(' · ');

/** "Attikawohnung · Küsnacht" */
export const kind = (l: Pick<Listing, 'property_type' | 'address'>) =>
  [propertyTypeLabel(l.property_type), l.address.city].filter(Boolean).join(' · ');
