/**
 * The site's one browser script (bundled, loaded by <KitScripts>, never
 * inline): the kit's parts (enquiry, consent, search, map) and the phone
 * menu (the Astro version's Site.astro script). No React on any page.
 */
import { kit } from '@realadvisor/sites-kit-react/client';

kit();

/** Header: the full-screen menu under 1080px (open, close, Escape, Tab kept inside). */
function menu() {
  const sheet = document.querySelector<HTMLElement>('[data-menu]');
  const open = document.querySelector<HTMLButtonElement>('[data-menu-open]');
  const close = document.querySelector<HTMLButtonElement>('[data-menu-close]');
  const set = (on: boolean) => {
    if (!sheet || !open) return;
    sheet.classList.toggle('is-open', on);
    open.setAttribute('aria-expanded', String(on));
    document.documentElement.classList.toggle('no-scroll', on);
    if (on) close?.focus();
    else open.focus();
  };
  open?.addEventListener('click', () => set(true));
  close?.addEventListener('click', () => set(false));
  sheet?.addEventListener('click', (e) => {
    if ((e.target as Element).closest('a')) set(false);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sheet?.classList.contains('is-open')) set(false);
    // Keep Tab inside the open menu.
    if (e.key === 'Tab' && sheet?.classList.contains('is-open')) {
      const items = [...sheet.querySelectorAll<HTMLElement>('a, button')];
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
    }
  });
}

menu();
