/**
 * The site's one browser script (bundled, loaded by <KitScripts>, never
 * inline): the kit's parts (enquiry form, consent) and the site's small
 * behaviours, the same vanilla scripts as the Astro version's components.
 * Each runs only on a page that has its markup. No React in the browser.
 */
import { kit } from '@realadvisor/sites-kit-react/client';

kit();

/** Header: the phone menu sheet (Escape and link clicks close it). */
function menu() {
  const sheet = document.querySelector<HTMLElement>('[data-menu]');
  const open = document.querySelector<HTMLButtonElement>('[data-menu-open]');
  const close = document.querySelector<HTMLButtonElement>('[data-menu-close]');
  const set = (on: boolean) => {
    if (!sheet || !open) return;
    sheet.classList.toggle('is-open', on);
    open.setAttribute('aria-expanded', String(on));
    document.documentElement.style.overflow = on ? 'hidden' : '';
    (on ? close : open)?.focus();
  };
  open?.addEventListener('click', () => set(true));
  close?.addEventListener('click', () => set(false));
  sheet?.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => set(false)));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && sheet?.classList.contains('is-open')) set(false); });
}

menu();
const has = (sel: string) => !!document.querySelector(sel);
if (has('[data-explorer]')) void import('./behaviours/explorer').then((m) => m.default());
if (has('[data-tabs]') || has('[data-viewer]')) void import('./behaviours/plans').then((m) => m.default());
if (has('[data-lightbox]')) void import('./behaviours/lightbox').then((m) => m.default());
