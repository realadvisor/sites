/**
 * The site's one browser script (bundled, loaded by <KitScripts>, never
 * inline), the Astro version's page <script>s: the kit's parts (enquiry
 * form), the menu and the shortlist count on every page; the units view,
 * the star buttons, the compare page and the lightbox load only on a page
 * that has them. No React in the browser.
 */
import { kit } from '@realadvisor/sites-kit-react/client';
import { initFavButtons, initFavCount } from './scripts/favourites';

kit();

/** Header: the full-screen menu under 1080px (44x44 button, Escape closes, scroll locked). */
function menu() {
  const btn = document.querySelector<HTMLButtonElement>('[data-menu-btn]');
  const sheet = document.querySelector<HTMLElement>('[data-menu]');
  if (!btn || !sheet) return;
  const set = (open: boolean) => {
    btn.setAttribute('aria-expanded', String(open));
    sheet.classList.toggle('is-open', open);
    document.documentElement.classList.toggle('menu-open', open);
    if (open) sheet.querySelector<HTMLAnchorElement>('a')?.focus();
  };
  btn.addEventListener('click', () => set(btn.getAttribute('aria-expanded') !== 'true'));
  sheet.addEventListener('click', (e) => { if ((e.target as Element).closest('a')) set(false); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sheet.classList.contains('is-open')) { set(false); btn.focus(); }
  });
  matchMedia('(min-width: 1081px)').addEventListener('change', (m) => m.matches && set(false));
}

menu();
initFavCount();

const has = (sel: string) => !!document.querySelector(sel);
if (has('[data-filters]')) void import('./scripts/units-view').then((m) => m.initUnitsView());
else if (has('[data-fav]')) initFavButtons();
if (has('[data-compare]')) void import('./scripts/compare');
if (has('[data-dialog]')) void import('./scripts/lightbox');
