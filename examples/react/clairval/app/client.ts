/**
 * The site's one browser script (bundled, loaded by <KitScripts>, never
 * inline): the kit's parts (enquiry form, consent, listings search and map)
 * and the site's two small vanilla behaviours, the same scripts as the Astro
 * version: the phone menu (native popover) and the listing gallery dialog.
 * No React in the browser.
 */
import { kit } from '@realadvisor/sites-kit-react/client';

kit();

// Phone menu (native popover): close it when a link inside is followed, and
// keep the burger's aria-expanded in step with the sheet.
function menu() {
  const sheet = document.querySelector<HTMLElement>('[data-menu]');
  const burger = document.querySelector<HTMLButtonElement>('.hd__burger');
  if (!sheet) return;
  sheet.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).closest('a')) sheet.hidePopover?.();
  });
  sheet.addEventListener('toggle', (e) => {
    const open = (e as ToggleEvent).newState === 'open';
    burger?.setAttribute('aria-expanded', String(open));
    if (!open) burger?.focus();
  });
  burger?.setAttribute('aria-expanded', 'false');
}

// Listing gallery: tiles open the photo dialog at the clicked photo; the
// phone strip updates its "1 / n" counter while swiping.
function gallery() {
  for (const root of document.querySelectorAll<HTMLElement>('[data-gallery]')) {
    const dlg = root.querySelector<HTMLDialogElement>('[data-dialog]');
    const grid = root.querySelector<HTMLElement>('.gal__grid');
    const count = root.querySelector<HTMLElement>('[data-count]');
    let opener: HTMLElement | null = null;
    root.querySelectorAll<HTMLElement>('[data-open]').forEach((el) => {
      el.addEventListener('click', (e) => {
        if (!dlg) return;
        e.preventDefault();
        opener = el;
        dlg.showModal();
        document.documentElement.style.overflow = 'hidden';
        const i = Number(el.dataset.open ?? 0);
        const target = dlg.querySelector<HTMLElement>(`[data-photo="${i}"]`);
        if (i > 0 && target) target.scrollIntoView({ block: 'start' });
        else dlg.scrollTop = 0;
      });
    });
    dlg?.querySelector('[data-close]')?.addEventListener('click', () => dlg.close());
    dlg?.addEventListener('close', () => {
      document.documentElement.style.overflow = '';
      opener?.focus();
    });
    if (grid && count) {
      grid.addEventListener(
        'scroll',
        () => {
          if (getComputedStyle(grid).display !== 'flex') return;
          count.textContent = String(Math.round(grid.scrollLeft / grid.clientWidth) + 1);
        },
        { passive: true },
      );
    }
  }
}

menu();
gallery();
