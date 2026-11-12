/**
 * Lightbox for [data-lightbox] links: a native <dialog> (focus trapped,
 * Escape closes), previous / next with buttons, arrow keys and swipe; the
 * photo shown whole (object-fit: contain). Without JS the links open the photo.
 */
const dialog = document.querySelector<HTMLDialogElement>('[data-dialog]');
const links = [...document.querySelectorAll<HTMLAnchorElement>('[data-lightbox]')];

if (dialog && links.length) {
  const image = dialog.querySelector<HTMLImageElement>('[data-img]')!;
  const cap = dialog.querySelector<HTMLElement>('[data-cap]')!;
  const counter = dialog.querySelector<HTMLElement>('[data-count]')!;
  let index = 0;
  let opener: HTMLElement | null = null;

  const show = (i: number) => {
    index = (i + links.length) % links.length;
    const a = links[index]!;
    image.src = a.href;
    image.alt = a.dataset.alt ?? '';
    cap.textContent = a.dataset.alt ?? '';
    counter.textContent = `${index + 1} / ${links.length}`;
    // Warm the next photo so stepping through feels instant.
    const next = links[(index + 1) % links.length];
    if (next) new Image().src = next.href;
  };

  links.forEach((a, i) =>
    a.addEventListener('click', (e) => {
      e.preventDefault();
      opener = a;
      show(i);
      dialog.showModal();
      document.documentElement.style.overflow = 'hidden';
    }),
  );
  dialog.addEventListener('close', () => {
    document.documentElement.style.overflow = '';
    opener?.focus();
  });
  dialog.querySelector('[data-close]')?.addEventListener('click', () => dialog.close());
  dialog.querySelector('[data-prev]')?.addEventListener('click', () => show(index - 1));
  dialog.querySelector('[data-next]')?.addEventListener('click', () => show(index + 1));
  dialog.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') show(index - 1);
    if (e.key === 'ArrowRight') show(index + 1);
  });
  let x0: number | null = null;
  dialog.addEventListener('touchstart', (e) => (x0 = e.touches[0]?.clientX ?? null), { passive: true });
  dialog.addEventListener('touchend', (e) => {
    const x1 = e.changedTouches[0]?.clientX;
    if (x0 != null && x1 != null && Math.abs(x1 - x0) > 50) show(index + (x1 < x0 ? 1 : -1));
    x0 = null;
  });
}
