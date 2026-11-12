/**
 * The kit's browser side, for app/client.ts:
 *
 *   import { kit, islands } from '@realadvisor/sites-kit-react/client';
 *   kit();
 *   islands({ Gallery: () => import('./components/Gallery') });
 *
 * kit() loads each part only on a page that has it (one small module each,
 * the same files as the Astro kit): enquiry form, consent banner, combobox,
 * listing search (with its map) or a map alone.
 */
export { islands } from './islands';

export function kit() {
  const has = (sel: string) => !!document.querySelector(sel);
  if (has('[data-enquiry]')) void import('@realadvisor/sites-kit/client/enquiry');
  if (has('[data-consent]')) void import('@realadvisor/sites-kit/client/consent');
  if (has('[data-combobox]')) void import('@realadvisor/sites-kit/client/combobox');
  if (has('[data-rs-root]')) void import('@realadvisor/sites-kit/client/listings-search');
  else if (has('[data-ra-map]')) void import('@realadvisor/sites-kit/client/listings-map');
}
