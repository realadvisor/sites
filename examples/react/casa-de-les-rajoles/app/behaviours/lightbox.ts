/** Gallery: the lightbox (arrows, Escape, counter). */
export default function lightbox() {
  const dlg = document.querySelector<HTMLDialogElement>('[data-lightbox]');
  if (!dlg) return;
  const list = [...(document.querySelector<HTMLTemplateElement>('[data-lb-list]')?.content.querySelectorAll<HTMLElement>('span') ?? [])];
  const im = dlg.querySelector<HTMLImageElement>('[data-lb-img]');
  const count = dlg.querySelector<HTMLElement>('[data-lb-count]');
  let i = 0;
  const show = (n: number) => {
    if (!im || !list.length) return;
    i = (n + list.length) % list.length;
    im.src = list[i]!.dataset.src!;
    im.alt = list[i]!.dataset.alt ?? '';
    if (count) count.textContent = (dlg.dataset.of ?? '{i} / {n}').replace('{i}', String(i + 1)).replace('{n}', String(list.length));
  };
  document.querySelectorAll<HTMLAnchorElement>('[data-gallery] a[data-i]').forEach((a) =>
    a.addEventListener('click', (e) => {
      if (e.metaKey || e.ctrlKey) return;
      e.preventDefault();
      show(Number(a.dataset.i));
      dlg.showModal();
    }),
  );
  dlg.querySelector('[data-lb-prev]')?.addEventListener('click', () => show(i - 1));
  dlg.querySelector('[data-lb-next]')?.addEventListener('click', () => show(i + 1));
  dlg.querySelector('[data-lb-close]')?.addEventListener('click', () => dlg.close());
  dlg.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') show(i - 1);
    if (e.key === 'ArrowRight') show(i + 1);
  });
}
