/**
 * The site's one browser script (bundled, loaded by <KitScripts>, never
 * inline): the kit's parts (enquiry, consent) and the site's small
 * behaviours, the same vanilla scripts as the Astro version (Header.astro's
 * menu, scripts/units-filter.ts, scripts/lightbox.ts). No React islands.
 */
import { kit } from '@realadvisor/sites-kit-react/client';

kit();

/** Header: the full-screen menu under 1080px (focus kept inside while open). */
function menu() {
  const sheet = document.querySelector<HTMLElement>('[data-menu]');
  const open = document.querySelector<HTMLButtonElement>('[data-menu-open]');
  const close = sheet?.querySelector<HTMLButtonElement>('[data-menu-close]');
  if (!sheet || !open) return;
  const setOpen = (on: boolean) => {
    sheet.classList.toggle('is-open', on);
    open.setAttribute('aria-expanded', String(on));
    document.body.classList.toggle('menu-open', on);
    (on ? close : open)?.focus();
  };
  open.addEventListener('click', () => setOpen(true));
  close?.addEventListener('click', () => setOpen(false));
  sheet.addEventListener('click', (e) => {
    if ((e.target as Element).closest('a')) setOpen(false);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sheet.classList.contains('is-open')) setOpen(false);
    // Keep focus inside the open menu.
    if (e.key === 'Tab' && sheet.classList.contains('is-open')) {
      const f = [...sheet.querySelectorAll<HTMLElement>('a, button')];
      const first = f[0];
      const last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
    }
  });
}

/**
 * Units page: apply the GET filter form instantly. Dims stacking-plan blocks
 * that do not match, hides table rows, shows the picked building, updates the
 * count and the URL (shareable). Without JS the form submits and the server
 * renders the same state.
 */
function unitsFilter() {
  const form = document.querySelector<HTMLFormElement>('[data-filters]');
  if (!form) return;
  {
    const apply = form.querySelector<HTMLElement>('[data-apply]');
    const reset = form.querySelector<HTMLAnchorElement>('[data-reset]');
    const count = form.querySelector<HTMLElement>('[data-count]');
    const word = form.querySelector<HTMLElement>('[data-count-word]');
    const empty = document.querySelector<HTMLElement>('[data-empty]');
    if (apply) apply.hidden = true;

    const read = () => {
      const d = new FormData(form);
      const s = (k: string) => String(d.get(k) ?? '');
      return { haus: s('haus'), zimmer: s('zimmer'), miete: s('miete'), geschoss: s('geschoss'), bezug: s('bezug'), frei: s('frei') === '1' };
    };

    const ok = (el: HTMLElement, f: ReturnType<typeof read>, withHouse: boolean) => {
      const ds = el.dataset;
      const rent = ds.rent ? Number(ds.rent) : Infinity;
      return (
        (!withHouse || !f.haus || ds.haus === f.haus) &&
        (!f.zimmer || ds.rooms === f.zimmer) &&
        (!f.miete || rent <= Number(f.miete)) &&
        (!f.geschoss || ds.floor === f.geschoss) &&
        (!f.bezug || ds.movein === f.bezug) &&
        (!f.frei || ds.status === 'available')
      );
    };

    const run = () => {
      const f = read();
      for (const p of document.querySelectorAll<HTMLElement>('[data-building-panel]')) p.hidden = !!f.haus && p.dataset.buildingPanel !== f.haus;
      for (const u of document.querySelectorAll<HTMLElement>('[data-unit]')) u.classList.toggle('is-dim', !ok(u, f, false));
      let n = 0;
      for (const r of document.querySelectorAll<HTMLElement>('[data-row]')) {
        const show = ok(r, f, true);
        r.hidden = !show;
        if (show) n++;
      }
      if (count) count.textContent = String(n);
      if (word) word.textContent = n === 1 ? 'Wohnung' : 'Wohnungen';
      if (empty) empty.hidden = n > 0;
      const q = new URLSearchParams();
      if (f.haus) q.set('haus', f.haus);
      if (f.zimmer) q.set('zimmer', f.zimmer);
      if (f.miete) q.set('miete', f.miete);
      if (f.geschoss) q.set('geschoss', f.geschoss);
      if (f.bezug) q.set('bezug', f.bezug);
      if (f.frei) q.set('frei', '1');
      const qs = q.toString();
      if (reset) reset.hidden = !qs;
      history.replaceState(null, '', qs ? `?${qs}` : location.pathname);
    };

    form.addEventListener('change', run);
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      run();
    });
    reset?.addEventListener('click', (e) => {
      e.preventDefault();
      form.reset();
      for (const el of form.querySelectorAll<HTMLInputElement>('input[type=radio][value=""]')) el.checked = true;
      for (const el of form.querySelectorAll<HTMLSelectElement>('select')) el.value = '';
      const frei = form.querySelector<HTMLInputElement>('input[name=frei]');
      if (frei) frei.checked = false;
      run();
    });
  }
}

/**
 * Gallery lightbox: native <dialog>, whole photo (object-fit: contain),
 * arrows and Escape, focus returns to the tile. Tiles are links to the large
 * photo, so the gallery works without JS.
 */
function lightbox() {
  const dlg = document.querySelector<HTMLDialogElement>('[data-lb]');
  const links = [...document.querySelectorAll<HTMLAnchorElement>('[data-lightbox]')];
  if (dlg && links.length && typeof dlg.showModal === 'function') {
    const im = dlg.querySelector<HTMLImageElement>('[data-lb-img]')!;
    const cap = dlg.querySelector<HTMLElement>('[data-lb-cap]')!;
    const count = dlg.querySelector<HTMLElement>('[data-lb-count]')!;
    let i = 0;
    let opener: HTMLElement | null = null;
    const show = (n: number) => {
      i = (n + links.length) % links.length;
      const a = links[i]!;
      im.src = a.href;
      im.alt = a.dataset.alt ?? '';
      cap.textContent = a.dataset.alt ?? '';
      count.textContent = `${i + 1} / ${links.length}`;
      // Warm the next one.
      const next = links[(i + 1) % links.length];
      if (next) new Image().src = next.href;
    };
    links.forEach((a, n) =>
      a.addEventListener('click', (e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey) return;
        e.preventDefault();
        opener = a;
        show(n);
        dlg.showModal();
        document.body.classList.add('menu-open');
      }),
    );
    dlg.querySelector('[data-lb-close]')?.addEventListener('click', () => dlg.close());
    dlg.querySelector('[data-lb-prev]')?.addEventListener('click', () => show(i - 1));
    dlg.querySelector('[data-lb-next]')?.addEventListener('click', () => show(i + 1));
    dlg.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') show(i - 1);
      if (e.key === 'ArrowRight') show(i + 1);
    });
    dlg.addEventListener('click', (e) => {
      if (e.target === dlg) dlg.close();
    });
    dlg.addEventListener('close', () => {
      document.body.classList.remove('menu-open');
      im.removeAttribute('src');
      opener?.focus();
    });
  }
}

menu();
unitsFilter();
lightbox();
