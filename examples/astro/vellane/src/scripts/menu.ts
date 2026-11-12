/** Phone menu: a button with aria-expanded; Escape, a link or the backdrop closes it; body scroll locked while open. */
const btn = document.querySelector<HTMLButtonElement>('[data-menu-btn]');
const panel = document.querySelector<HTMLElement>('[data-menu]');
if (btn && panel) {
  const set = (open: boolean) => {
    btn.setAttribute('aria-expanded', String(open));
    btn.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
    panel.classList.toggle('is-open', open);
    document.body.classList.toggle('is-locked', open);
    if (open) setTimeout(() => panel.querySelector<HTMLElement>('a')?.focus(), 60);
  };
  btn.addEventListener('click', () => set(btn.getAttribute('aria-expanded') !== 'true'));
  panel.addEventListener('click', (e) => {
    if ((e.target as Element).closest('a') || e.target === panel) set(false);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && btn.getAttribute('aria-expanded') === 'true') {
      set(false);
      btn.focus();
    }
  });
  matchMedia('(min-width: 960px)').addEventListener('change', (m) => m.matches && set(false));
}
