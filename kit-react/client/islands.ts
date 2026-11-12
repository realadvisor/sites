/**
 * Hydrates the [data-island] roots that <Island> rendered: each with its own
 * React root, the server's useId prefix and its JSON props. React loads only
 * on a page that has an island, and only when the first one is due.
 */
import type { ComponentType } from 'react';

type Loader = () => Promise<{ default: ComponentType<any> }>;

export function islands(loaders: Record<string, Loader>) {
  for (const el of document.querySelectorAll<HTMLElement>('[data-island]:not([data-hydrated])')) {
    const load = loaders[el.dataset.island!];
    if (!load) continue;
    const go = () => void hydrate(el, load);
    if (el.dataset.when === 'load') go();
    else if (el.dataset.when === 'idle') ('requestIdleCallback' in window ? requestIdleCallback(go) : setTimeout(go, 200));
    else {
      const io = new IntersectionObserver((es) => es.some((e) => e.isIntersecting) && (io.disconnect(), go()), { rootMargin: '200px' });
      io.observe(el.firstElementChild ?? el);
    }
  }
}

async function hydrate(el: HTMLElement, load: Loader) {
  if (el.dataset.hydrated) return;
  el.dataset.hydrated = 'pending';
  const [{ createElement }, { hydrateRoot }, { default: C }] = await Promise.all([import('react'), import('react-dom/client'), load()]);
  hydrateRoot(el, createElement(C, JSON.parse(el.dataset.props ?? '{}')), {
    identifierPrefix: el.dataset.prefix,
    onRecoverableError: (e) => console.error('[island]', el.dataset.island, e),
  });
  el.dataset.hydrated = 'true';
}
