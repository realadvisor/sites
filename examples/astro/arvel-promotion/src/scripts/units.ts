/**
 * Live filters of the Logements page. The form is a plain GET form (the page
 * renders the same state on the server); this applies a change at once,
 * keeps the URL shareable (?type=T3&dispo=1) and updates the count.
 */
const form = document.querySelector<HTMLFormElement>('[data-unit-filters]');
if (form) {
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
    type ? url.searchParams.set('type', type) : url.searchParams.delete('type');
    only ? url.searchParams.set('dispo', '1') : url.searchParams.delete('dispo');
    history.replaceState(null, '', url);
  };
  form.addEventListener('change', apply);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    apply();
  });
}
