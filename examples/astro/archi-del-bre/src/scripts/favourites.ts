/**
 * Shortlist ("Preferiti" / "Merkliste"): up to 3 unit ids (8-char prefixes)
 * in localStorage. The compare page itself is server-rendered from ?u= so a
 * shortlist can be shared as a link; this file only keeps the list.
 * Every read and write is guarded: private mode or blocked storage just
 * means an empty list.
 */
const KEY = 'archi-del-bre:preferiti';
export const MAX = 3;
const valid = (s: unknown): s is string => typeof s === 'string' && /^[0-9a-f]{8}$/.test(s);

export function readFavs(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    return Array.isArray(v) ? [...new Set(v.filter(valid))].slice(0, MAX) : [];
  } catch {
    return [];
  }
}
export function writeFavs(ids: string[]) {
  const list = [...new Set(ids.filter(valid))].slice(0, MAX);
  try { localStorage.setItem(KEY, JSON.stringify(list)); } catch { /* storage blocked */ }
  document.dispatchEvent(new CustomEvent('favs', { detail: list }));
  return list;
}
export const toggleFav = (id: string) => {
  const list = readFavs();
  return writeFavs(list.includes(id) ? list.filter((x) => x !== id) : list.length < MAX ? [...list, id] : list);
};

/** Header: "Preferiti 2", linking to the compare page with the list in the URL. */
export function initFavCount() {
  const link = document.querySelector<HTMLAnchorElement>('[data-fav-link]');
  const count = link?.querySelector<HTMLElement>('[data-fav-count]');
  if (!link || !count) return;
  const base = link.getAttribute('href')!.split('?')[0];
  const render = (list: string[]) => {
    link.hidden = list.length === 0;
    count.textContent = String(list.length);
    link.href = list.length ? `${base}?u=${list.join(',')}` : base!;
  };
  render(readFavs());
  document.addEventListener('favs', (e) => render((e as CustomEvent<string[]>).detail));
  addEventListener('storage', () => render(readFavs()));
}

/**
 * Star buttons ([data-fav="<id8>"], rendered hidden: they need JS). aria-pressed
 * shows the state; when the list is full the others are disabled with a note.
 */
export function initFavButtons(root: ParentNode = document) {
  const buttons = [...root.querySelectorAll<HTMLButtonElement>('[data-fav]')];
  if (!buttons.length) return;
  const render = (list: string[]) => {
    for (const b of buttons) {
      const on = list.includes(b.dataset.fav!);
      b.setAttribute('aria-pressed', String(on));
      const full = !on && list.length >= MAX;
      b.disabled = full;
      const label = on ? b.dataset.labelOff : full ? b.dataset.labelFull : b.dataset.labelOn;
      if (label) {
        b.title = label;
        const text = b.querySelector('[data-fav-text]');
        if (text) text.textContent = label;
        else b.setAttribute('aria-label', `${label}: ${b.dataset.unit ?? ''}`.trim());
      }
    }
  };
  for (const b of buttons) {
    b.hidden = false;
    b.addEventListener('click', () => render(toggleFav(b.dataset.fav!)));
  }
  render(readFavs());
  document.addEventListener('favs', (e) => render((e as CustomEvent<string[]>).detail));
}
