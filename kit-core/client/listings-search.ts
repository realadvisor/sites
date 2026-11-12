/**
 * Progressive enhancement for components/ListingsSearch.astro. Without
 * this script the search is a GET form and links; with it, a filter, sort,
 * chip, page or view change fetches the next URL and swaps only what
 * changed, so the page does not reload, scroll or lose the open sheet:
 *
 * - `[data-rs-swap=<name>]` blocks (count, chips, results, pager, pill…);
 * - the options of the native selects (facets follow buy / rent), never the
 *   form itself (the city combobox keeps its enhancement and focus);
 * - the page's own `[data-rs-sync=<name>]` elements (h1, intro), the title,
 *   canonical and hreflang links.
 *
 * Map view: when the visitor moves the map, the list, count and pages follow
 * the visible area (`?bbox=s,w,n,e`, filtered on the server) while the map
 * itself stays in place; "search as I move the map" (on by default) does it
 * at once, otherwise a "search this area" button does.
 *
 * Any failure falls back to a normal navigation.
 */
import { mountMaps } from './listings-map';

const ORDER = ['offerType', 'propertyType', 'city', 'minPrice', 'maxPrice', 'minRooms', 'status', 'sort', 'view', 'map', 'bbox'];
type Box = { s: number; w: number; n: number; e: number };
type Area = { count: number; total: number; all?: true; user?: boolean; bounds?: Box };
/** Same normalisation as parseSearch: one area is one URL. */
const boxParam = (b: Box) => [b.s, b.w, b.n, b.e].map((x) => +x.toFixed(5)).join(',');
// The visitor's choice outlives a map swapped in by a filter change.
let follow = true;

function setup(root: HTMLElement) {
  if (root.dataset.rsReady) return;
  root.dataset.rsReady = '1';
  root.classList.add('is-js');
  const form = root.querySelector<HTMLFormElement>('[data-rs-form]');
  const sheet = root.querySelector<HTMLElement>('#rs-sheet');
  let ctrl: AbortController | null = null;
  let timer = 0;

  const formUrl = () => {
    const u = new URL(form!.action, location.href);
    // Defaults stay out of the URL (same as searchHref in lib/search.ts).
    const defaults: Record<string, string> = { sort: 'newest', status: 'available', view: 'list' };
    const got = new Map<string, string>();
    for (const [k, v] of new FormData(form!)) if (typeof v === 'string' && v && defaults[k] !== v) got.set(k, v);
    // Same order as searchHref, so one search is one URL (and one cache entry).
    // Map view: a filter applies inside the area the visitor is looking at.
    if (got.get('view') === 'map') {
      const here = new URLSearchParams(location.search);
      for (const k of ['map', 'bbox']) if (here.get(k)) got.set(k, here.get(k)!);
    }
    for (const k of ORDER) if (got.has(k)) u.searchParams.set(k, got.get(k)!);
    // `/` and `,` stay readable (searchHref writes them so too).
    u.search = u.search.replace(/%2F/gi, '/').replace(/%2C/gi, ',');
    return u.href;
  };

  const swap = (doc: Document, keepMap = false) => {
    const next = doc.querySelector<HTMLElement>('[data-rs-root]');
    if (!next) return false;
    // An area search keeps the map (its tiles, view, open popup): only the list changes.
    const oldMap = keepMap ? root.querySelector<HTMLElement>('[data-rs-map]') : null;
    if (oldMap && !next.querySelector('[data-rs-map]')) return false;
    for (const el of root.querySelectorAll<HTMLElement>('[data-rs-swap]')) {
      const fresh = next.querySelector<HTMLElement>(`[data-rs-swap="${el.dataset.rsSwap}"]`);
      if (fresh) el.replaceWith(document.importNode(fresh, true));
    }
    // Blocks that did not exist before (the pill after an empty result).
    for (const fresh of next.querySelectorAll<HTMLElement>('[data-rs-swap]')) {
      if (!root.querySelector(`[data-rs-swap="${fresh.dataset.rsSwap}"]`)) root.append(document.importNode(fresh, true));
    }
    for (const el of root.querySelectorAll<HTMLElement>('[data-rs-swap]')) {
      if (!next.querySelector(`[data-rs-swap="${el.dataset.rsSwap}"]`)) el.remove();
    }
    if (form) {
      const nextForm = next.querySelector<HTMLFormElement>('[data-rs-form]');
      for (const sel of form.querySelectorAll('select')) {
        const fresh = nextForm?.querySelector<HTMLSelectElement>(`select[name="${sel.name}"]`);
        if (!fresh) continue;
        const combo = sel.closest<HTMLElement>('[data-combobox]');
        if (!combo && sel.innerHTML !== fresh.innerHTML) sel.innerHTML = fresh.innerHTML;
        sel.value = fresh.value;
        // A removed city chip clears the combobox's visible text too.
        const input = combo?.querySelector<HTMLInputElement>('input[role=combobox]');
        if (input && document.activeElement !== input) input.value = sel.value ? sel.selectedOptions[0]?.text ?? '' : '';
      }
      for (const r of form.querySelectorAll<HTMLInputElement>('input[type=radio]')) {
        r.checked = !!nextForm?.querySelector<HTMLInputElement>(`input[type=radio][name="${r.name}"][value="${r.value}"]`)?.checked;
      }
      // Hidden state fields (view, status, minPrice) follow the server.
      form.querySelectorAll('input[type=hidden]').forEach((h) => h.remove());
      nextForm?.querySelectorAll('input[type=hidden]').forEach((h) => form.prepend(document.importNode(h, true)));
    }
    for (const el of document.querySelectorAll<HTMLElement>('[data-rs-sync]')) {
      const fresh = doc.querySelector(`[data-rs-sync="${el.dataset.rsSync}"]`);
      if (fresh) el.innerHTML = fresh.innerHTML;
    }
    if (doc.title) document.title = doc.title;
    // Canonical and hreflang follow the filters (shared links, language switch).
    for (const sel of ['link[rel=canonical]', 'link[rel=alternate][hreflang]']) {
      const fresh = [...doc.querySelectorAll<HTMLLinkElement>(sel)];
      document.querySelectorAll<HTMLLinkElement>(sel).forEach((el, i) => fresh[i] && (el.href = fresh[i].href));
    }
    if (oldMap) root.querySelector('[data-rs-map]')!.replaceWith(oldMap);
    const box = root.querySelector<HTMLInputElement>('[data-rs-follow]');
    if (box) box.checked = follow;
    root.className = next.className + ' is-js';
    root.dataset.rsView = next.dataset.rsView;
    document.dispatchEvent(new CustomEvent('ra:list-swap'));
    return true;
  };

  const go = async (url: string, opts: { push?: boolean; focus?: boolean; top?: boolean; keepMap?: boolean } = {}) => {
    const { push = true, focus = false, top = false, keepMap = false } = opts;
    ctrl?.abort();
    const c = (ctrl = new AbortController());
    root.setAttribute('aria-busy', 'true');
    try {
      const res = await fetch(url, { signal: c.signal, headers: { accept: 'text/html' } });
      if (!res.ok) throw new Error(String(res.status));
      const doc = new DOMParser().parseFromString(await res.text(), 'text/html');
      if (c.signal.aborted) return;
      if (!swap(doc, keepMap)) {
        if (keepMap) return go(url, { ...opts, keepMap: false });
        throw new Error('no search root');
      }
      if (push && url !== location.href) history.pushState({ rs: 1 }, '', url);
      else if (!push) history.replaceState(history.state, '', url);
      mountMaps(root);
      if (top) {
        const y = root.getBoundingClientRect().top;
        if (y < 0) root.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      }
      if (focus) root.querySelector<HTMLElement>('[data-rs-count]')?.focus({ preventScroll: true });
    } catch (e) {
      if ((e as Error).name !== 'AbortError') location.assign(url);
    } finally {
      if (ctrl === c) root.removeAttribute('aria-busy');
    }
  };

  if (form) {
    form.addEventListener('change', (e) => {
      // The combobox text field changes on blur; its select carries the value.
      if ((e.target as HTMLElement).getAttribute('role') === 'combobox') return;
      clearTimeout(timer);
      timer = window.setTimeout(() => go(formUrl()), 120);
    });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      clearTimeout(timer);
      if (sheet?.matches(':popover-open')) sheet.hidePopover();
      go(formUrl());
    });
  }

  root.addEventListener('click', (e) => {
    const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[data-rs-nav]');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    go(a.href, { focus: true, top: !!a.closest('[data-rs-pager]') || a.hasAttribute('data-rs-view') || a.hasAttribute('data-rs-pill') });
  });

  // Map area -> list. Debounced: a drag with inertia or a zoom ends in one search.
  let pending: Box | null = null;
  let areaTimer = 0;
  const searchArea = (b: Box) => {
    pending = null;
    root.querySelector<HTMLElement>('[data-rs-search-area]')?.toggleAttribute('hidden', true);
    const u = new URL(location.href);
    if (u.searchParams.get('bbox') === boxParam(b)) return;
    u.searchParams.set('bbox', boxParam(b));
    u.searchParams.delete('page');
    go(u.href.replace(/%2F/gi, '/').replace(/%2C/gi, ','), { push: false, keepMap: true });
  };
  root.addEventListener('ra:map-area', (e) => {
    const d = (e as CustomEvent<Area>).detail;
    if (d.all) {
      // The map's own "show all": drop the area.
      const u = new URL(location.href);
      if (u.searchParams.has('bbox')) {
        u.searchParams.delete('bbox');
        u.searchParams.delete('page');
        go(u.href, { push: false, keepMap: true });
      }
      return;
    }
    if (!d.user || !d.bounds) return;
    clearTimeout(areaTimer);
    if (follow) areaTimer = window.setTimeout(() => searchArea(d.bounds!), 350);
    else {
      pending = d.bounds;
      root.querySelector<HTMLElement>('[data-rs-search-area]')?.toggleAttribute('hidden', false);
    }
  });
  root.addEventListener('change', (e) => {
    const box = (e.target as HTMLElement).closest<HTMLInputElement>('[data-rs-follow]');
    if (!box) return;
    follow = box.checked;
    if (follow && pending) searchArea(pending);
  });
  root.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).closest('[data-rs-search-area]') && pending) searchArea(pending);
  });

  addEventListener('popstate', () => {
    if (root.isConnected) go(location.href, { push: false });
  });
}

document.querySelectorAll<HTMLElement>('[data-rs-root]').forEach(setup);
