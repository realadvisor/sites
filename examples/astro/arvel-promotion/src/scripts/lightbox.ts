/** Opens [data-lightbox] links in the page's <dialog>; without JS they open the image. */
const dialog = document.querySelector<HTMLDialogElement>('[data-lightbox-dialog]');
if (dialog) {
  const media = dialog.querySelector<HTMLElement>('[data-lb-media]')!;
  const image = document.createElement('img');
  image.decoding = 'async';
  const cap = dialog.querySelector<HTMLElement>('[data-lb-cap]')!;
  let list: HTMLAnchorElement[] = [];
  let index = 0;
  let opener: HTMLElement | null = null;
  const show = (i: number) => {
    index = (i + list.length) % list.length;
    const a = list[index]!;
    if (!image.isConnected) media.append(image);
    image.src = a.href;
    image.alt = a.dataset.alt ?? '';
    cap.textContent = `${a.dataset.alt ?? ''} · ${index + 1} / ${list.length}`;
  };
  document.addEventListener('click', (e) => {
    const a = (e.target as Element).closest<HTMLAnchorElement>('a[data-lightbox]');
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    const group = a.closest('[data-gallery]');
    list = [...(group ?? document).querySelectorAll<HTMLAnchorElement>('a[data-lightbox]')];
    opener = a;
    show(list.indexOf(a));
    dialog.showModal();
  });
  dialog.querySelector('[data-lb-close]')!.addEventListener('click', () => dialog.close());
  dialog.querySelector('[data-lb-prev]')!.addEventListener('click', () => show(index - 1));
  dialog.querySelector('[data-lb-next]')!.addEventListener('click', () => show(index + 1));
  dialog.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') show(index - 1);
    if (e.key === 'ArrowRight') show(index + 1);
  });
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog || e.target === dialog.firstElementChild) dialog.close();
  });
  dialog.addEventListener('close', () => {
    image.remove();
    image.removeAttribute('src');
    opener?.focus();
  });
}
