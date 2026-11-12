/**
 * The site's one browser script (bundled, loaded by <KitScripts>, never
 * inline): the kit's parts (enquiry, consent, search, map) and the site's
 * own small behaviours, the same vanilla scripts as the Astro version:
 * phone menu, home search, gallery popover. No React islands.
 */
import { kit } from '@realadvisor/sites-kit-react/client';

kit();

/** Header: the full-screen menu under 1180px. */
function menu() {
  const menu = document.querySelector<HTMLElement>('[data-menu]');
  const open = document.querySelector<HTMLButtonElement>('[data-menu-open]');
  const close = document.querySelector<HTMLButtonElement>('[data-menu-close]');
  const set = (on: boolean) => {
    if (!menu || !open) return;
    menu.classList.toggle('is-open', on);
    open.setAttribute('aria-expanded', String(on));
    document.documentElement.classList.toggle('no-scroll', on);
    if (on) close?.focus();
    else open.focus();
  };
  open?.addEventListener('click', () => set(true));
  close?.addEventListener('click', () => set(false));
  menu?.addEventListener('click', (e) => {
    if ((e.target as Element).closest('a')) set(false);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menu?.classList.contains('is-open')) set(false);
  });
}

/**
 * Home search: the offer switch changes the target page and the towns; the
 * button counts the matching houses. Without JS the buy page forwards
 * ?offerType=rent to the rent page.
 */
function homeSearch() {
  const form = document.querySelector<HTMLFormElement>('[data-home-search]');
  if (!form) return;
  const town = form.querySelector<HTMLSelectElement>('[data-town]')!;
  const go = form.querySelector<HTMLButtonElement>('[data-go]')!;
  const houses = (n: number) => (go.dataset.houses === 'es' ? (n === 1 ? '1 casa' : `${n} casas`) : n === 1 ? '1 house' : `${n} houses`);
  const sync = () => {
    const offer = form.querySelector<HTMLInputElement>('input[name="offerType"]:checked');
    if (!offer) return;
    form.action = offer.value === 'rent' ? form.dataset.rent! : form.dataset.buy!;
    for (const o of town.options) {
      if (!o.dataset.offer) continue;
      const off = o.dataset.offer !== offer.value;
      o.hidden = off;
      o.disabled = off;
    }
    if (town.selectedOptions[0]?.disabled) town.value = '';
    const n = Number(town.selectedOptions[0]?.dataset.count ?? offer.dataset.count ?? 0);
    go.textContent = (go.dataset.label ?? '{n}').replace('{n}', houses(n));
  };
  form.addEventListener('change', sync);
  form.addEventListener('submit', () => {
    // The target page already is the offer: keep the URL clean.
    for (const r of form.querySelectorAll<HTMLInputElement>('input[name="offerType"]')) r.disabled = true;
    if (!town.value) town.disabled = true;
  });
  sync();
}

/** Listing gallery popover: previous / next, arrow keys, the counter. */
function gallery() {
  const lb = document.querySelector<HTMLElement>('[data-lightbox]');
  const strip = lb?.querySelector<HTMLElement>('[data-lb-strip]');
  if (!lb || !strip) return;
  const items = [...strip.children] as HTMLElement[];
  const count = lb.querySelector<HTMLElement>('[data-lb-count]')!;
  const prev = lb.querySelector<HTMLButtonElement>('[data-lb-prev]')!;
  const next = lb.querySelector<HTMLButtonElement>('[data-lb-next]')!;
  prev.hidden = next.hidden = false;
  const current = () => Math.round(strip.scrollLeft / strip.clientWidth);
  const go = (i: number) => strip.scrollTo({ left: Math.max(0, Math.min(items.length - 1, i)) * strip.clientWidth, behavior: 'smooth' });
  const update = () => {
    const i = current();
    count.textContent = (strip.dataset.label ?? '').replace('{i}', String(i + 1)).replace('{n}', String(items.length));
    prev.disabled = i === 0;
    next.disabled = i === items.length - 1;
  };
  prev.addEventListener('click', () => go(current() - 1));
  next.addEventListener('click', () => go(current() + 1));
  strip.addEventListener('scroll', () => requestAnimationFrame(update), { passive: true });
  lb.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); go(current() + 1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(current() - 1); }
  });
  lb.addEventListener('toggle', (e) => {
    if ((e as ToggleEvent).newState === 'open') {
      for (const img of strip.querySelectorAll('img')) img.loading = 'eager';
      strip.focus();
      update();
    }
  });
}

menu();
homeSearch();
gallery();
