/**
 * The site's one browser script (bundled, loaded by <KitScripts>, never
 * inline): the kit's parts (enquiry form, consent) and the site's own small
 * behaviours, the same vanilla code as the Astro version's page scripts:
 * header (menu, solid on scroll); units page (filters, sort) and gallery
 * lightbox load as their own small modules (app/scripts/, the Astro files as they are).
 * No React island: the Astro site has none.
 */
import { kit } from '@realadvisor/sites-kit-react/client';

kit();

/** Header (every page): the phone menu, and the home header turning solid on scroll. */
function header() {
  const btn = document.querySelector<HTMLButtonElement>('[data-menu-btn]');
  const menu = document.querySelector<HTMLElement>('[data-menu]');
  if (btn && menu) {
    const set = (open: boolean) => {
      btn.setAttribute('aria-expanded', String(open));
      menu.classList.toggle('is-open', open);
      document.documentElement.classList.toggle('menu-open', open);
      if (open) menu.querySelector<HTMLAnchorElement>('a')?.focus();
    };
    btn.addEventListener('click', () => set(btn.getAttribute('aria-expanded') !== 'true'));
    menu.addEventListener('click', (e) => { if ((e.target as Element).closest('a')) set(false); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && menu.classList.contains('is-open')) { set(false); btn.focus(); }
    });
    matchMedia('(min-width: 1001px)').addEventListener('change', (m) => m.matches && set(false));
  }
  // Home: the header over the hero turns solid as soon as the page scrolls.
  const bar = document.querySelector<HTMLElement>('[data-header].overlay');
  if (bar) {
    let ticking = false;
    const update = () => { bar.classList.toggle('is-solid', window.scrollY > 24); ticking = false; };
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();
  }
}

header();
// Page behaviours load only on their page (as Astro's page scripts): the units filter and the gallery lightbox.
if (document.querySelector('[data-filters]')) void import('./scripts/units-filter');
if (document.querySelector('[data-dialog]')) void import('./scripts/lightbox');
