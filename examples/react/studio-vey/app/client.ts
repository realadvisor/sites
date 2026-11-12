/**
 * The site's one browser script (bundled, loaded by <KitScripts>, never
 * inline): the kit's parts (enquiry, consent, search, map), the site's own
 * small behaviours (menu, offer tabs, gallery). No React in the browser:
 * a real React island would be <Island> + islands() (kit README).
 */
import { kit } from '@realadvisor/sites-kit-react/client';

kit();

/** Header: the full-screen menu under 1080px. */
function menu() {
  const toggle = document.querySelector<HTMLButtonElement>('[data-menu-toggle]');
  const sheet = document.querySelector<HTMLElement>('[data-menu]');
  if (!toggle || !sheet) return;
  const set = (open: boolean) => {
    toggle.setAttribute('aria-expanded', String(open));
    sheet.classList.toggle('is-open', open);
    document.body.classList.toggle('is-locked', open);
    if (open) sheet.querySelector<HTMLAnchorElement>('a')?.focus();
  };
  toggle.addEventListener('click', () => set(toggle.getAttribute('aria-expanded') !== 'true'));
  sheet.addEventListener('click', (e) => {
    if ((e.target as Element).closest('a')) set(false);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sheet.classList.contains('is-open')) {
      set(false);
      toggle.focus();
    }
  });
  matchMedia('(min-width: 1080px)').addEventListener('change', (e) => e.matches && set(false));
}

/** Listing gallery: the lightbox (native <dialog>, scroll-snap track, arrows and keys). */
function gallery() {
  for (const root of document.querySelectorAll<HTMLElement>('[data-gallery]')) {
    const dialog = root.querySelector<HTMLDialogElement>('[data-lightbox]')!;
    const track = root.querySelector<HTMLElement>('[data-lb-track]')!;
    const index = root.querySelector<HTMLElement>('[data-lb-index]')!;
    const slides = [...track.children] as HTMLElement[];
    const current = () => Math.round(track.scrollLeft / Math.max(track.clientWidth, 1));
    const go = (i: number, smooth = true) => {
      const to = Math.max(0, Math.min(slides.length - 1, i));
      const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
      track.scrollTo({ left: to * track.clientWidth, behavior: smooth && !reduce ? 'smooth' : 'auto' });
    };
    root.addEventListener('click', (e) => {
      const opener = (e.target as Element).closest<HTMLElement>('[data-open]');
      if (!opener) return;
      e.preventDefault();
      dialog.showModal();
      document.body.classList.add('is-locked');
      requestAnimationFrame(() => go(Number(opener.dataset.open), false));
    });
    dialog.addEventListener('close', () => document.body.classList.remove('is-locked'));
    dialog.querySelector('[data-lb-close]')?.addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', (e) => {
      const step = (e.target as Element).closest<HTMLElement>('[data-lb-step]');
      if (step) go(current() + Number(step.dataset.lbStep));
    });
    dialog.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); go(current() + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(current() - 1); }
    });
    let raf = 0;
    track.addEventListener('scroll', () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => (index.textContent = String(current() + 1)));
    }, { passive: true });
  }
}

/** Home: buy / rent panels become ARIA tabs (arrow keys, Home/End). */
function offerTabs() {
  for (const root of document.querySelectorAll<HTMLElement>('[data-offer-tabs]')) {
    const list = root.querySelector<HTMLElement>('[data-tablist]');
    if (!list) continue;
    const tabs = [...list.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
    const panels = tabs.map((t) => document.getElementById(t.getAttribute('aria-controls') ?? ''));
    const select = (i: number, focus = false) => {
      tabs.forEach((t, j) => {
        const on = i === j;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        const panel = panels[j];
        if (panel) {
          panel.hidden = !on;
          panel.setAttribute('aria-labelledby', t.id);
        }
      });
      if (focus) tabs[i]?.focus();
    };
    for (const p of panels) {
      p?.setAttribute('role', 'tabpanel');
      p?.setAttribute('tabindex', '-1');
    }
    tabs.forEach((t, i) => t.addEventListener('click', () => select(i)));
    list.addEventListener('keydown', (e) => {
      const i = tabs.indexOf(document.activeElement as HTMLButtonElement);
      if (i < 0) return;
      const next = ({ ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 } as Record<string, number>)[e.key];
      if (next == null) return;
      e.preventDefault();
      select((next + tabs.length) % tabs.length, true);
    });
    root.classList.add('is-tabbed');
    list.hidden = false;
    select(0);
  }
}

menu();
offerTabs();
gallery();
