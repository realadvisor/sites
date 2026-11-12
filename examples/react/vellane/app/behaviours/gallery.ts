/** Listing gallery: the photo dialog and the phone strip counter. */
document.querySelectorAll<HTMLElement>('[data-gallery]').forEach((g) => {
  const dlg = g.querySelector<HTMLDialogElement>('[data-gal-dialog]');
  const strip = g.querySelector<HTMLElement>('[data-gal-strip]');
  const index = g.querySelector<HTMLElement>('[data-gal-index]');
  if (!dlg || typeof dlg.showModal !== 'function') return;
  g.querySelectorAll<HTMLButtonElement>('[data-gal-open]').forEach((b) => {
    b.disabled = false;
    b.hidden = false;
    b.addEventListener('click', () => {
      dlg.showModal();
      document.body.classList.add('is-locked');
      const i = Number(b.dataset.galOpen) || 0;
      dlg.querySelector(`#photo-${i}`)?.scrollIntoView({ block: 'start' });
    });
  });
  dlg.querySelector('[data-gal-close]')?.addEventListener('click', () => dlg.close());
  dlg.addEventListener('close', () => document.body.classList.remove('is-locked'));
  dlg.addEventListener('click', (e) => e.target === dlg && dlg.close());
  // Phone strip: the counter follows the swipe.
  if (strip && index) {
    const items = [...strip.children] as HTMLElement[];
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => e.isIntersecting && (index.textContent = String(items.indexOf(e.target as HTMLElement) + 1))),
      { root: strip, threshold: 0.6 },
    );
    items.forEach((it) => io.observe(it));
  }
});
export {};
