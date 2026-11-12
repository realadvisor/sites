/**
 * Units page, in place: rooms and "only available" filters dim the stacking
 * plan and hide table rows; the table sorts on its headers. State stays in
 * the URL (replaceState), so a filtered view can be shared. Without JS the
 * same URLs are rendered by the server.
 */
document.documentElement.classList.add('js');

const form = document.querySelector<HTMLFormElement>('[data-filters]');
const tbody = document.querySelector<HTMLTableSectionElement>('[data-table] tbody');
const count = document.querySelector<HTMLElement>('[data-count]');
const countLabel = document.querySelector<HTMLElement>('[data-count-label]');
const empty = document.querySelector<HTMLElement>('[data-empty]');

const state = () => {
  const p = new URL(location.href).searchParams;
  return { pieces: p.get('pieces') ?? '', dispo: p.get('dispo') === '1', tri: p.get('tri') ?? 'etage', ordre: p.get('ordre') === 'desc' ? 'desc' : 'asc' };
};

function writeUrl(s: ReturnType<typeof state>) {
  const p = new URLSearchParams();
  if (s.pieces) p.set('pieces', s.pieces);
  if (s.dispo) p.set('dispo', '1');
  if (s.tri !== 'etage') p.set('tri', s.tri);
  if (s.ordre === 'desc') p.set('ordre', 'desc');
  const q = p.toString();
  history.replaceState(null, '', `${location.pathname}${q ? `?${q}` : ''}${location.hash}`);
}

function applyFilter() {
  if (!form) return;
  const data = new FormData(form);
  const pieces = String(data.get('pieces') ?? '');
  const dispo = data.get('dispo') === '1';
  const ok = (el: HTMLElement) => (!pieces || el.dataset.rooms === pieces) && (!dispo || el.dataset.status === 'available');
  document.querySelectorAll<HTMLElement>('[data-unit]').forEach((el) => el.classList.toggle('dim', !ok(el)));
  let n = 0;
  document.querySelectorAll<HTMLElement>('[data-row]').forEach((el) => {
    const show = ok(el);
    el.classList.toggle('hide', !show);
    if (show) n++;
  });
  if (count) count.textContent = String(n);
  if (countLabel) countLabel.textContent = n > 1 ? 'lots' : 'lot';
  if (empty) empty.hidden = n > 0;
  writeUrl({ ...state(), pieces, dispo });
}

form?.addEventListener('change', applyFilter);
form?.addEventListener('submit', (e) => {
  e.preventDefault();
  applyFilter();
});

document.querySelectorAll<HTMLAnchorElement>('[data-sort]').forEach((a) => {
  a.addEventListener('click', (e) => {
    if (!tbody) return;
    e.preventDefault();
    const s = state();
    const key = a.dataset.sort!;
    const ordre = s.tri === key && s.ordre === 'asc' ? 'desc' : 'asc';
    const dir = ordre === 'desc' ? -1 : 1;
    const val = (tr: HTMLElement) => {
      const v = tr.dataset[`k${key[0]!.toUpperCase()}${key.slice(1)}`];
      return v === '' || v == null ? null : Number(v);
    };
    const rows = [...tbody.querySelectorAll<HTMLElement>('[data-row]')];
    rows.sort((x, y) => {
      const a1 = val(x), b1 = val(y);
      if (a1 == null || b1 == null) return a1 === b1 ? 0 : a1 == null ? 1 : -1;
      return (a1 - b1) * dir;
    });
    tbody.append(...rows);
    document.querySelectorAll<HTMLElement>('th[aria-sort]').forEach((th) => th.removeAttribute('aria-sort'));
    a.closest('th')?.setAttribute('aria-sort', ordre === 'desc' ? 'descending' : 'ascending');
    writeUrl({ ...s, tri: key, ordre });
  });
});

export {};
