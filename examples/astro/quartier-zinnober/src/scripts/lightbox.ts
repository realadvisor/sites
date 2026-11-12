// Gallery lightbox: native <dialog>, whole photo (object-fit: contain),
// arrows and Escape, focus returns to the tile. Tiles are links to the large
// photo, so the gallery works without JS.
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
