/**
 * Shortlist ("Mes favoris") and saved searches, kept in this browser only
 * (localStorage, nothing is sent). Hearts are server-rendered `hidden` and
 * shown here, so a visitor without JS never sees a dead button.
 *
 * Heart: <button data-save data-id data-href data-title data-price data-place data-facts data-img data-alt hidden>
 * Count: <span data-saved-count hidden>
 * Save search: <button data-save-search data-label hidden>
 * Lists (favoris page): [data-saved-list], [data-searches-list], [data-saved-empty]
 */
type Saved = { id: string; href: string; title: string; price: string; place: string; facts: string; img: string; alt: string };
type Search = { href: string; label: string };

const KEY = 'vellane:saved';
const SKEY = 'vellane:searches';
const read = <T,>(k: string): T[] => {
  try {
    const v = JSON.parse(localStorage.getItem(k) ?? '[]');
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
};
const write = (k: string, v: unknown[]) => {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {
    /* storage full or blocked: the shortlist stays for this page only */
  }
};

const announce = (msg: string) => {
  let live = document.getElementById('saved-live');
  if (!live) {
    live = Object.assign(document.createElement('p'), { id: 'saved-live', className: 'visually-hidden' });
    live.setAttribute('role', 'status');
    document.body.append(live);
  }
  live.textContent = msg;
};

function paintHearts() {
  const ids = new Set(read<Saved>(KEY).map((s) => s.id));
  document.querySelectorAll<HTMLButtonElement>('[data-save]').forEach((b) => {
    if (b.hidden) b.hidden = false;
    const on = String(ids.has(b.dataset.id!));
    if (b.getAttribute('aria-pressed') !== on) b.setAttribute('aria-pressed', on);
  });
  const n = ids.size;
  document.querySelectorAll<HTMLElement>('[data-saved-count]').forEach((c) => {
    if (c.textContent !== String(n)) c.textContent = String(n);
    if (c.hidden !== (n === 0)) c.hidden = n === 0;
  });
}

function toggle(b: HTMLButtonElement) {
  const d = b.dataset;
  let list = read<Saved>(KEY);
  const had = list.some((s) => s.id === d.id);
  list = had
    ? list.filter((s) => s.id !== d.id)
    : [{ id: d.id!, href: d.href!, title: d.title!, price: d.price ?? '', place: d.place ?? '', facts: d.facts ?? '', img: d.img ?? '', alt: d.alt ?? '' }, ...list].slice(0, 60);
  write(KEY, list);
  paintHearts();
  announce(had ? `${d.title} retiré des favoris` : `${d.title} ajouté aux favoris`);
  if (document.querySelector('[data-saved-list]')) renderLists();
}

const el = <K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, text?: string) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text) e.textContent = text;
  return e;
};

function renderLists() {
  const box = document.querySelector<HTMLElement>('[data-saved-list]');
  const sbox = document.querySelector<HTMLElement>('[data-searches-list]');
  const empty = document.querySelector<HTMLElement>('[data-saved-empty]');
  const items = read<Saved>(KEY);
  const searches = read<Search>(SKEY);
  if (box) {
    box.replaceChildren(
      ...items.map((s) => {
        const li = el('li', 'saved-item');
        const a = el('a', 'saved-link');
        a.href = s.href;
        if (s.img) {
          const im = el('img', 'saved-img');
          im.src = s.img;
          im.alt = s.alt;
          im.width = 320;
          im.height = 240;
          im.loading = 'lazy';
          a.append(im);
        } else a.append(el('span', 'saved-img saved-noimg'));
        const body = el('span', 'saved-body');
        body.append(el('span', 'saved-price', s.price), el('span', 'saved-title', s.title), el('span', 'saved-meta', [s.place, s.facts].filter(Boolean).join(' · ')));
        a.append(body);
        const rm = el('button', 'saved-remove', 'Retirer');
        rm.type = 'button';
        rm.setAttribute('aria-label', `Retirer ${s.title} des favoris`);
        rm.addEventListener('click', () => {
          write(KEY, read<Saved>(KEY).filter((x) => x.id !== s.id));
          paintHearts();
          renderLists();
          announce(`${s.title} retiré des favoris`);
        });
        li.append(a, rm);
        return li;
      }),
    );
    box.hidden = items.length === 0;
  }
  if (sbox) {
    sbox.replaceChildren(
      ...searches.map((s) => {
        const li = el('li', 'search-item');
        const a = el('a', 'link', s.label);
        a.href = s.href;
        const rm = el('button', 'saved-remove', 'Supprimer');
        rm.type = 'button';
        rm.setAttribute('aria-label', `Supprimer la recherche ${s.label}`);
        rm.addEventListener('click', () => {
          write(SKEY, read<Search>(SKEY).filter((x) => x.href !== s.href));
          renderLists();
        });
        li.append(a, rm);
        return li;
      }),
    );
    const wrap = sbox.closest<HTMLElement>('[data-searches]');
    if (wrap) wrap.hidden = searches.length === 0;
  }
  if (empty) empty.hidden = items.length + searches.length > 0;
}

function saveSearch(b: HTMLButtonElement) {
  const h1 = document.querySelector('h1')?.textContent?.trim() ?? document.title;
  const href = location.pathname + location.search;
  const list = read<Search>(SKEY).filter((s) => s.href !== href);
  write(SKEY, [{ href, label: h1 }, ...list].slice(0, 20));
  b.setAttribute('aria-pressed', 'true');
  const label = b.querySelector('[data-label]');
  if (label) label.textContent = 'Recherche enregistrée';
  announce('Recherche enregistrée dans vos favoris');
}

function paintSearchButtons() {
  const href = location.pathname + location.search;
  const saved = read<Search>(SKEY).some((s) => s.href === href);
  document.querySelectorAll<HTMLButtonElement>('[data-save-search]').forEach((b) => {
    if (b.hidden) b.hidden = false;
    if (b.getAttribute('aria-pressed') !== String(saved)) b.setAttribute('aria-pressed', String(saved));
    const label = b.querySelector('[data-label]');
    const text = saved ? 'Recherche enregistrée' : 'Enregistrer la recherche';
    if (label && label.textContent !== text) label.textContent = text;
  });
}

document.addEventListener('click', (e) => {
  const t = e.target as Element | null;
  const heart = t?.closest<HTMLButtonElement>('[data-save]');
  if (heart) {
    e.preventDefault();
    e.stopPropagation();
    toggle(heart);
    return;
  }
  const ss = t?.closest<HTMLButtonElement>('[data-save-search]');
  if (ss) saveSearch(ss);
});

const paint = () => {
  paintHearts();
  paintSearchButtons();
  renderLists();
};
paint();
// The kit's search swaps the results without a page load: repaint new hearts and the URL state
// (once per frame; painting only writes what changed, so it never feeds the observer again).
const region = document.querySelector('[data-rs-root]');
if (region) {
  let queued = false;
  new MutationObserver(() => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      paintHearts();
      paintSearchButtons();
    });
  }).observe(region, { childList: true, subtree: true });
}
window.addEventListener('popstate', paintSearchButtons);
window.addEventListener('storage', paint);
