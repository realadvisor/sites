// Listing gallery: tiles open the photo dialog at the clicked photo; the
// phone strip updates its "1 / n" counter while swiping.
for (const root of document.querySelectorAll<HTMLElement>('[data-gallery]')) {
  const dlg = root.querySelector<HTMLDialogElement>('[data-dialog]');
  const grid = root.querySelector<HTMLElement>('.gal__grid');
  const count = root.querySelector<HTMLElement>('[data-count]');
  let opener: HTMLElement | null = null;
  root.querySelectorAll<HTMLElement>('[data-open]').forEach((el) => {
    el.addEventListener('click', (e) => {
      if (!dlg) return;
      e.preventDefault();
      opener = el;
      dlg.showModal();
      document.documentElement.style.overflow = 'hidden';
      const i = Number(el.dataset.open ?? 0);
      const target = dlg.querySelector<HTMLElement>(`[data-photo="${i}"]`);
      if (i > 0 && target) target.scrollIntoView({ block: 'start' });
      else dlg.scrollTop = 0;
    });
  });
  dlg?.querySelector('[data-close]')?.addEventListener('click', () => dlg.close());
  dlg?.addEventListener('close', () => {
    document.documentElement.style.overflow = '';
    opener?.focus();
  });
  if (grid && count) {
    grid.addEventListener(
      'scroll',
      () => {
        if (getComputedStyle(grid).display !== 'flex') return;
        count.textContent = String(Math.round(grid.scrollLeft / grid.clientWidth) + 1);
      },
      { passive: true },
    );
  }
}
