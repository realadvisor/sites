// Units page: apply the GET filter form instantly. Dims stacking-plan blocks
// that do not match, hides table rows, shows the picked building, updates the
// count and the URL (shareable). Without JS the form submits and the server
// renders the same state.
const form = document.querySelector<HTMLFormElement>('[data-filters]');

if (form) {
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
