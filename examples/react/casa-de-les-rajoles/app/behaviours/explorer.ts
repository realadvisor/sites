/** Units page: switch wing and floor in place and keep the URL in step; plate and list highlight each other. */
export default function explorer() {
  const root = document.querySelector<HTMLElement>('[data-explorer]');
  if (!root) return;
  const show = (wing: string, floor: string, push = true) => {
    root.querySelectorAll<HTMLElement>('[data-rail]').forEach((r) => (r.hidden = r.dataset.rail !== wing));
    root.querySelectorAll<HTMLElement>('[data-panel]').forEach((p) => (p.hidden = p.dataset.panel !== `${wing}:${floor}`));
    root.querySelectorAll<HTMLAnchorElement>('[data-floor-link]').forEach((a) => {
      if (a.dataset.floorLink === `${wing}:${floor}`) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });
    root.querySelectorAll<HTMLAnchorElement>('[data-wing-link]').forEach((a) => {
      if (a.dataset.wingLink === wing) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });
    if (push) {
      const u = new URL(location.href);
      u.searchParams.set('ala', wing);
      u.searchParams.set('planta', floor);
      u.hash = 'planta';
      history.replaceState(null, '', u);
    }
  };
  root.addEventListener('click', (e) => {
    const a = (e.target as Element).closest<HTMLAnchorElement>('[data-floor-link],[data-wing-link]');
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    if (a.dataset.floorLink) {
      const [w, f] = a.dataset.floorLink.split(':');
      show(w!, f!);
    } else {
      const w = a.dataset.wingLink!;
      const rail = root.querySelector<HTMLElement>(`[data-rail="${w}"]`);
      show(w, rail?.dataset.default ?? '1');
    }
  });
  root.addEventListener('pointerover', (e) => {
    const el = (e.target as Element).closest<HTMLElement>('[data-unit],[data-unit-row]');
    root.querySelectorAll('.hl').forEach((x) => x.classList.remove('hl'));
    const id = el?.dataset.unit ?? el?.dataset.unitRow;
    if (id) root.querySelectorAll(`[data-unit="${id}"],[data-unit-row="${id}"]`).forEach((x) => x.classList.add('hl'));
  });
}
