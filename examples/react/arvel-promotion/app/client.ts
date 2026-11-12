/**
 * The site's one browser script (bundled, loaded by <KitScripts>, never
 * inline): the kit's parts (enquiry, consent) and the site's own small
 * behaviours, the same scripts as the Astro version: mobile menu (Header),
 * lightbox (Galerie), live unit filters (Logements). No React in the browser.
 */
import { kit } from '@realadvisor/sites-kit-react/client';

kit();

/** Header: the full-screen menu under 961px. */
function menu() {
  const header = document.querySelector<HTMLElement>('[data-header]');
  const button = header?.querySelector<HTMLButtonElement>('[data-menu-open]');
  const sheet = header?.querySelector<HTMLElement>('[data-menu]');
  if (!header || !button || !sheet) return;
  const set = (open: boolean) => {
    button.setAttribute('aria-expanded', String(open));
    header.classList.toggle('is-open', open);
    document.documentElement.classList.toggle('menu-lock', open);
    if (open) sheet.querySelector<HTMLAnchorElement>('a')?.focus();
  };
  button.addEventListener('click', () => set(button.getAttribute('aria-expanded') !== 'true'));
  sheet.addEventListener('click', (e) => {
    if ((e.target as Element).closest('a')) set(false);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && header.classList.contains('is-open')) {
      set(false);
      button.focus();
    }
  });
  matchMedia('(min-width: 961px)').addEventListener('change', (e) => e.matches && set(false));
}

/** Opens [data-lightbox] links in the page's <dialog>; without JS they open the image. */
function lightbox() {
  const dialog = document.querySelector<HTMLDialogElement>('[data-lightbox-dialog]');
  if (!dialog) return;
  const media = dialog.querySelector<HTMLElement>('[data-lb-media]')!;
  const image = document.createElement('img');
  image.decoding = 'async';
  const cap = dialog.querySelector<HTMLElement>('[data-lb-cap]')!;
  let list: HTMLAnchorElement[] = [];
  let index = 0;
  let opener: HTMLElement | null = null;
  const show = (i: number) => {
    index = (i + list.length) % list.length;
    const a = list[index]!;
    if (!image.isConnected) media.append(image);
    image.src = a.href;
    image.alt = a.dataset.alt ?? '';
    cap.textContent = `${a.dataset.alt ?? ''} · ${index + 1} / ${list.length}`;
  };
  document.addEventListener('click', (e) => {
    const a = (e.target as Element).closest<HTMLAnchorElement>('a[data-lightbox]');
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    const group = a.closest('[data-gallery]');
    list = [...(group ?? document).querySelectorAll<HTMLAnchorElement>('a[data-lightbox]')];
    opener = a;
    show(list.indexOf(a));
    dialog.showModal();
  });
  dialog.querySelector('[data-lb-close]')!.addEventListener('click', () => dialog.close());
  dialog.querySelector('[data-lb-prev]')!.addEventListener('click', () => show(index - 1));
  dialog.querySelector('[data-lb-next]')!.addEventListener('click', () => show(index + 1));
  dialog.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') show(index - 1);
    if (e.key === 'ArrowRight') show(index + 1);
  });
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog || e.target === dialog.firstElementChild) dialog.close();
  });
  dialog.addEventListener('close', () => {
    image.remove();
    image.removeAttribute('src');
    opener?.focus();
  });
}

/**
 * Live filters of the Logements page. The form is a plain GET form (the page
 * renders the same state on the server); this applies a change at once,
 * keeps the URL shareable (?type=T3&dispo=1) and updates the count.
 */
function units() {
  const form = document.querySelector<HTMLFormElement>('[data-unit-filters]');
  if (!form) return;
  form.classList.add('is-live');
  const blocks = [...document.querySelectorAll<HTMLElement>('[data-stack] [data-unit]')];
  const rows = [...document.querySelectorAll<HTMLElement>('tr[data-unit]')];
  const count = document.querySelector<HTMLElement>('[data-unit-count]');
  const countLabel = document.querySelector<HTMLElement>('[data-unit-count-label]');
  const empty = document.querySelector<HTMLElement>('[data-unit-empty]');
  const apply = () => {
    const data = new FormData(form);
    const type = String(data.get('type') ?? '');
    const only = data.get('dispo') === '1';
    const match = (el: HTMLElement) => (!type || el.dataset.type === type) && (!only || el.dataset.st === 'available');
    let n = 0;
    for (const b of blocks) {
      const ok = match(b);
      if (ok) n++;
      b.toggleAttribute('data-dim', !ok);
    }
    for (const r of rows) r.hidden = !match(r);
    if (count) count.textContent = String(n);
    if (countLabel) countLabel.textContent = n > 1 ? 'logements' : 'logement';
    if (empty) empty.hidden = n > 0;
    const url = new URL(location.href);
    url.searchParams.delete('lot');
    if (type) url.searchParams.set('type', type);
    else url.searchParams.delete('type');
    if (only) url.searchParams.set('dispo', '1');
    else url.searchParams.delete('dispo');
    history.replaceState(null, '', url);
  };
  form.addEventListener('change', apply);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    apply();
  });
}

menu();
lightbox();
units();
