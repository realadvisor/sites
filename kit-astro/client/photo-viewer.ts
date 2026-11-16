/**
 * PhotoViewer's browser side (the same file in both kits): every
 * `[data-photo-viewer]` gets a full-screen viewer over its native modal
 * <dialog>. A tile (`data-pv-open="<i>"`) opens it on its photo; prev / next
 * buttons, ← → Home End step; Escape closes (native); swipe is the track's
 * own scroll-snap touch scrolling. Focus goes to the close button on open and
 * back to the tile on close; the page does not scroll while it is open
 * (`ra-pv-locked` on <html>). Reduced motion: no smooth scrolling.
 * `photoViewers(scope)` sets up viewers that arrive later; each once.
 */

const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const LOCK = 'ra-pv-locked';

function setup(root: HTMLElement) {
  const dialog = root.querySelector<HTMLDialogElement>('[data-pv-dialog]');
  const track = root.querySelector<HTMLElement>('[data-pv-track]');
  const index = root.querySelector<HTMLElement>('[data-pv-index]');
  const close = root.querySelector<HTMLButtonElement>('[data-pv-close]');
  if (!dialog || !track || !index || !close || typeof dialog.showModal !== 'function') return;
  const count = track.children.length;
  let opener: HTMLElement | null = null;
  let at = 0;
  // While a step scrolls there, the index already shows its target (a second
  // press steps on from it, not from the photo half way).
  let target = -1;
  const current = () => Math.round(track.scrollLeft / Math.max(track.clientWidth, 1));
  const show = (i: number) => {
    at = i;
    index.textContent = String(i + 1);
  };
  const go = (i: number, smooth = true) => {
    const to = Math.max(0, Math.min(count - 1, i));
    target = Math.abs(track.scrollLeft - to * track.clientWidth) > 1 ? to : -1;
    track.scrollTo({ left: to * track.clientWidth, behavior: smooth && !reduceMotion() ? 'smooth' : 'auto' });
    show(to);
  };

  root.addEventListener('click', (e) => {
    const el = (e.target as Element).closest<HTMLElement>('[data-pv-open]');
    if (!el || dialog.contains(el) || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    opener = el;
    document.documentElement.classList.add(LOCK);
    dialog.showModal();
    close.focus();
    const i = Number(el.dataset.pvOpen) || 0;
    go(i, false);
    // The track has its size only once the dialog is laid out.
    requestAnimationFrame(() => go(i, false));
  });
  close.addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    document.documentElement.classList.remove(LOCK);
    opener?.focus({ preventScroll: true });
    opener = null;
  });
  dialog.addEventListener('click', (e) => {
    const step = (e.target as Element).closest<HTMLElement>('[data-pv-step]');
    if (step) go(at + Number(step.dataset.pvStep));
  });
  dialog.addEventListener('keydown', (e) => {
    const to = ({ ArrowRight: at + 1, ArrowLeft: at - 1, Home: 0, End: count - 1 } as Record<string, number>)[e.key];
    if (to === undefined || e.altKey || e.ctrlKey || e.metaKey) return;
    e.preventDefault();
    go(to);
  });
  let raf = 0;
  track.addEventListener(
    'scroll',
    () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        if (target < 0) return show(current());
        if (Math.abs(track.scrollLeft - target * track.clientWidth) <= 1) target = -1;
      });
    },
    { passive: true },
  );
  // The visitor's own swipe or wheel takes over from a step.
  for (const type of ['pointerdown', 'touchstart', 'wheel'] as const) track.addEventListener(type, () => (target = -1), { passive: true });
  // A resize or rotation keeps the photo on screen (scrollLeft is in px).
  addEventListener('resize', () => {
    if (dialog.open) go(at, false);
  });
}

export function photoViewers(scope: ParentNode = document) {
  const roots = [...scope.querySelectorAll<HTMLElement>('[data-photo-viewer]')];
  for (const root of roots) {
    if (root.hasAttribute('data-pv-mounted')) continue;
    root.setAttribute('data-pv-mounted', '');
    setup(root);
  }
}

photoViewers();
