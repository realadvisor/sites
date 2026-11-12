/**
 * Units page, progressive enhancement over the server-rendered table:
 * - filters apply on change, rows and drawing segments update in place, the
 *   URL follows (replaceState) so a filtered view can be shared;
 * - hover / focus on a row highlights its unit in the drawing and the other
 *   way round ([data-unit] on both);
 * - star buttons and the shortlist bar (app/scripts/favourites.ts).
 */
import { matches, parseFilters, toQuery, isActive, type UnitFacts } from '../lib/filters';
import { initFavButtons, readFavs, writeFavs } from './favourites';

export function initUnitsView() {
  const form = document.querySelector<HTMLFormElement>('[data-filters]');
  const table = document.querySelector<HTMLTableElement>('[data-units]');
  if (!form || !table) return;
  const rows = [...table.querySelectorAll<HTMLTableRowElement>('tr[data-unit]')];
  const segs = [...document.querySelectorAll<SVGElement>('[data-iso] [data-unit]')];
  const count = document.querySelector<HTMLElement>('[data-count]');
  const empty = document.querySelector<HTMLElement>('[data-empty]');
  const reset = document.querySelector<HTMLAnchorElement>('[data-reset]');
  form.querySelector<HTMLButtonElement>('[data-submit]')?.setAttribute('hidden', '');

  const facts = (r: HTMLTableRowElement): UnitFacts => ({
    rooms: r.dataset.rooms ?? '',
    house: r.dataset.house ?? '',
    floor: r.dataset.floor ?? '',
    top: r.dataset.top === '1',
    price: r.dataset.price ? Number(r.dataset.price) : null,
    status: r.dataset.status ?? '',
  });

  const apply = () => {
    const q = new URLSearchParams(new FormData(form) as unknown as Record<string, string>);
    const f = parseFilters(q);
    const shown = new Set<string>();
    for (const r of rows) {
      const ok = matches(f, facts(r));
      r.hidden = !ok;
      if (ok) shown.add(r.dataset.unit!);
    }
    for (const g of table.querySelectorAll<HTMLTableRowElement>('tr.group')) {
      g.hidden = ![...g.parentElement!.querySelectorAll<HTMLTableRowElement>('tr[data-unit]')].some((r) => !r.hidden);
    }
    for (const s of segs) s.classList.toggle('is-dim', !shown.has(s.dataset.unit!));
    if (count) {
      const n = shown.size;
      count.textContent = `${n} ${n === 1 ? count.dataset.one!.replace(/^\d+ /, '') : count.dataset.many}`;
      if (n !== rows.length) {
        const of = document.createElement('span');
        of.className = 'muted';
        of.textContent = ` ${count.dataset.of}`;
        count.append(of);
      }
    }
    if (empty) empty.hidden = shown.size > 0;
    if (reset) reset.hidden = !isActive(f);
    const qs = toQuery(f);
    history.replaceState(null, '', qs ? `${location.pathname}?${qs}` : location.pathname);
  };
  form.addEventListener('change', apply);
  form.addEventListener('submit', (e) => { e.preventDefault(); apply(); });
  reset?.addEventListener('click', (e) => { e.preventDefault(); form.reset(); for (const s of form.querySelectorAll('select')) s.value = ''; for (const c of form.querySelectorAll<HTMLInputElement>('input[type=checkbox]')) c.checked = false; apply(); });

  // Row <-> drawing highlight.
  const hot = (id: string | null) => {
    for (const r of rows) r.classList.toggle('is-hot', r.dataset.unit === id);
    for (const s of segs) s.classList.toggle('is-hot', s.dataset.unit === id);
  };
  for (const el of [...rows, ...segs] as HTMLElement[]) {
    el.addEventListener('pointerenter', () => hot(el.dataset.unit!));
    el.addEventListener('pointerleave', () => hot(null));
    el.addEventListener('focusin', () => hot(el.dataset.unit!));
    el.addEventListener('focusout', () => hot(null));
  }

  // Shortlist.
  initFavButtons(table);
  const bar = document.querySelector<HTMLElement>('[data-shortlist]');
  const hint = document.querySelector<HTMLElement>('[data-fav-hint]');
  if (hint) hint.hidden = false;
  if (bar) {
    const names = bar.querySelector<HTMLElement>('[data-shortlist-names]')!;
    const link = bar.querySelector<HTMLAnchorElement>('[data-shortlist-compare]')!;
    const base = link.getAttribute('href')!;
    const label = (id: string) => rows.find((r) => r.dataset.unit === id)?.querySelector('.c-no a')?.textContent?.trim() ?? id;
    const render = (list: string[]) => {
      bar.hidden = list.length === 0;
      if (hint) hint.hidden = list.length > 0;
      names.textContent = `${list.length}/3 · ${list.map(label).join(', ')}`;
      link.href = `${base}?u=${list.join(',')}`;
    };
    bar.querySelector('[data-shortlist-clear]')?.addEventListener('click', () => writeFavs([]));
    document.addEventListener('favs', (e) => render((e as CustomEvent<string[]>).detail));
    render(readFavs());
  }
}
