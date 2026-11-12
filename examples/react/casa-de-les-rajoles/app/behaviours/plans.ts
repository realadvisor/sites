/** Plans page: typology tabs in place, and a plan opens in a dialog. */
export default function plans() {
  const root = document.querySelector<HTMLElement>('[data-tabs]');
  root?.addEventListener('click', (e) => {
    const a = (e.target as Element).closest<HTMLAnchorElement>('[data-tab]');
    if (!a || e.metaKey || e.ctrlKey) return;
    e.preventDefault();
    const k = a.dataset.tab!;
    root.querySelectorAll<HTMLElement>('[data-tab-panel]').forEach((p) => (p.hidden = p.dataset.tabPanel !== k));
    root.querySelectorAll<HTMLAnchorElement>('[data-tab]').forEach((x) => (x.dataset.tab === k ? x.setAttribute('aria-current', 'true') : x.removeAttribute('aria-current')));
    const u = new URL(location.href);
    u.searchParams.set('tipo', k);
    history.replaceState(null, '', u);
  });
  const dlg = document.querySelector<HTMLDialogElement>('[data-viewer]');
  if (!dlg) return;
  const im = dlg.querySelector<HTMLImageElement>('[data-viewer-img]');
  const ttl = dlg.querySelector<HTMLElement>('[data-viewer-title]');
  document.addEventListener('click', (e) => {
    const a = (e.target as Element).closest<HTMLAnchorElement>('[data-plan]');
    if (!a || !im || e.metaKey || e.ctrlKey) return;
    e.preventDefault();
    im.src = a.dataset.plan!;
    im.alt = a.dataset.planTitle ?? '';
    if (ttl) ttl.textContent = a.dataset.planTitle ?? '';
    dlg.showModal();
  });
  dlg.querySelector('[data-viewer-close]')?.addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
}
