/**
 * Interactive listings map without a map library (about 4.5 KB gzipped):
 * OpenStreetMap tiles as <img> (the only map host the CSP allows), drag
 * (with a little inertia), continuous wheel / trackpad / pinch zoom (tiles
 * of the next level drawn smaller, so they stay sharp), animated zoom
 * buttons and cluster clicks,
 * keyboard, distance clustering, a popup card per listing, and a list kept in
 * sync with the map (hovering a card highlights its marker and the other way
 * round; moving the map filters the list to the visible area, a pin click
 * selects its cards). Optional `data-view` (first view instead of fitting)
 * and `data-sync` (the view goes into `?map=z/lat/lng`). Each list-filtering
 * move dispatches `ra:map-area` ({ count, total, all? }) on the map root.
 * Used by components/ListingsMap.astro; data comes from `data-*`
 * attributes (no inline script, CSP has no 'unsafe-inline' for scripts).
 * `mountMaps(scope)` sets up maps that arrive later (results swapped in by
 * fetch); a root is only ever set up once.
 */

type Point = { id: string; lat: number; lng: number; url: string; title: string; type?: string; price: string; photo?: string; x: number; y: number };
type Forms = { one: string; other: string };
type Labels = { lang: string; inArea: Forms; listings: Forms; showAll: string; close: string };
/** x / y: Web Mercator position in 0..1 (the same at every zoom). */
type Cluster = { x: number; y: number; points: Point[]; el?: HTMLButtonElement };
type Tile = { im: HTMLImageElement; z: number; done: boolean };

const TILE = 256;
const MIN_Z = 3;
const MAX_Z = 18;
const FIT_Z = 15; // closest first view (one listing, or a cluster click)
const CELL = 60; // px: markers closer than this at a zoom level merge into a cluster
const PAD = 56; // px kept free around the listings when fitting them

const toX = (lng: number) => (lng + 180) / 360;
const toY = (lat: number) => {
  const s = Math.sin((Math.max(-85, Math.min(85, lat)) * Math.PI) / 180);
  return 0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI);
};
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const toLng = (x: number) => ((((x * 360) % 360) + 360) % 360) - 180; // panned past the antimeridian: wrap
const toLat = (y: number) => (Math.atan(Math.sinh(Math.PI * (1 - 2 * y))) * 180) / Math.PI;

/** `data-view` ({ z, lat, lng }, from `?map=`): a malformed one falls back to fitting. */
const readView = (raw: string | undefined) => {
  try {
    const v = JSON.parse(raw ?? 'null') as { z: number; lat: number; lng: number } | null;
    if (!v || ![v.z, v.lat, v.lng].every(Number.isFinite) || Math.abs(v.lat) > 85 || Math.abs(v.lng) > 180) return null;
    return { z: clamp(v.z, MIN_Z, MAX_Z), x: toX(v.lng), y: toY(v.lat) };
  } catch {
    return null;
  }
};

function setup(root: HTMLElement) {
  let points: Point[] = [];
  let labels: Labels;
  try {
    points = (JSON.parse(root.dataset.points ?? '[]') as Point[])
      .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng))
      .map((p) => ({ ...p, x: toX(p.lng), y: toY(p.lat) }));
    labels = JSON.parse(root.dataset.labels ?? '{}') as Labels;
  } catch {
    return;
  }
  const plural = new Intl.PluralRules(labels.lang);
  const say = (f: Forms, n: number) => (plural.select(n) === 'one' ? f.one : f.other).replace('{n}', String(n));

  const viewport = root.querySelector<HTMLElement>('[data-map-viewport]')!;
  const tileLayer = root.querySelector<HTMLElement>('[data-map-tiles]')!;
  const markerLayer = root.querySelector<HTMLElement>('[data-map-markers]')!;
  const popup = root.querySelector<HTMLElement>('[data-map-popup]')!;
  const status = root.querySelector<HTMLElement>('[data-map-status]');
  const zoomButtons = [...root.querySelectorAll<HTMLButtonElement>('[data-map-zoom]')];
  // The list is looked up each time: ListingsSearch swaps it while the map stays.
  const listOf = () => (root.dataset.list ? document.getElementById(root.dataset.list) : null);
  const cardsOf = () => [...(listOf()?.querySelectorAll<HTMLElement>('[data-listing-id]') ?? [])];
  // `server`: the page filters the list by the map area itself (ListingsSearch, `?bbox=`);
  // the map only reports its bounds. Otherwise the map hides the cards outside it.
  const serverList = root.dataset.listMode === 'server';
  const initial = readView(root.dataset.view);
  const sync = root.dataset.sync != null;
  // Hiding cards must not make the browser's scroll anchoring jump the page.
  const list = listOf();
  if (list) list.style.overflowAnchor = 'none';

  // View: `zoom` may be fractional while a gesture runs; (cx, cy) is the centre in 0..1.
  let zoom = 12;
  let cx = 0.5;
  let cy = 0.5;
  let w = 0;
  let h = 0;
  // The visitor moved the map (or the URL carried a view): a resize keeps it instead of refitting.
  let touched = !!initial;
  // Only a visitor's move searches the area (not the first view, not a refit).
  let userMoved = false;
  let areaPending = !!initial; // filter the list to the URL's view once the map has a size
  let frame = 0;
  let clusters: Cluster[] = [];
  let clusterLevel = -1;
  let anchor: Cluster | null = null; // the marker the popup belongs to
  let hoverId: string | null = null;
  const tiles = new Map<string, Tile>();
  const levels = new Map<number, Cluster[]>();

  const size = (z: number) => TILE * 2 ** z;
  const measure = () => {
    w = viewport.clientWidth;
    h = viewport.clientHeight;
  };
  /** Screen position (px from the map's top left) of a 0..1 position. */
  const screen = (x: number, y: number) => {
    const s = size(zoom);
    return [(x - cx) * s + w / 2, (y - cy) * s + h / 2] as const;
  };

  // The area the listings are in. A listing with wrong coordinates (another
  // country) must not zoom the first view out to a continent, but real
  // listings at the edge of the region (the mountains, the next canton) stay in.
  const core = (pts: Point[]) => {
    if (pts.length < 5) return pts;
    const mid = (v: number[]) => v.sort((a, b) => a - b)[v.length >> 1]!;
    const [mx, my] = [mid(pts.map((p) => p.x)), mid(pts.map((p) => p.y))];
    const d = pts.map((p) => Math.hypot(p.x - mx, p.y - my));
    const q = [...d].sort((a, b) => a - b)[Math.floor((d.length - 1) * 0.8)]!;
    const limit = Math.max(q * 3, 0.0005); // 0.0005 ≈ 20 km
    const inside = pts.filter((_, i) => d[i]! <= limit);
    return inside.length >= pts.length * 0.85 ? inside : pts;
  };

  /**
   * Zoom and centre that show all `pts` in the part of the map that is on
   * screen (a tall map below a header starts partly under the fold).
   */
  const fitView = (pts: Point[], maxZ = FIT_Z) => {
    const xs = pts.map((p) => p.x);
    const ys = pts.map((p) => p.y);
    const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
    const r = viewport.getBoundingClientRect();
    let [top, bottom] = [clamp(-r.top, 0, h), clamp(innerHeight - r.top, 0, h)];
    if (bottom - top < Math.min(h, 320) * 0.75) [top, bottom] = [0, h];
    const fz = Math.log2(Math.min((w - 2 * PAD) / ((x1 - x0) * TILE || 1e-9), (bottom - top - 2 * PAD) / ((y1 - y0) * TILE || 1e-9)));
    const z = clamp(Math.floor(fz * 4) / 4, MIN_Z, maxZ);
    return { z, x: (x0 + x1) / 2, y: (y0 + y1) / 2 - ((top + bottom) / 2 - h / 2) / size(z) };
  };
  const fit = () => {
    measure();
    if (!points.length || !w || !h) return;
    const v = fitView(core(points));
    [zoom, cx, cy] = [v.z, v.x, v.y];
  };

  // Clustering per half zoom level, cached: each point joins the nearest
  // cluster within CELL px, then clusters whose bubbles would still overlap
  // merge, so no bubble ever hides another.
  const clusterAt = (level: number): Cluster[] => {
    const cached = levels.get(level);
    if (cached) return cached;
    const s = size(level);
    const out: Cluster[] = [];
    const add = (c: Cluster, p: Point) => {
      c.x = (c.x * c.points.length + p.x) / (c.points.length + 1);
      c.y = (c.y * c.points.length + p.y) / (c.points.length + 1);
      c.points.push(p);
    };
    for (const p of points) {
      let best: Cluster | undefined;
      let bd = CELL;
      for (const c of out) {
        const d = Math.hypot(c.x - p.x, c.y - p.y) * s;
        if (d < bd) [best, bd] = [c, d];
      }
      if (best) add(best, p);
      else out.push({ x: p.x, y: p.y, points: [p] });
    }
    for (let merged = true; merged; ) {
      merged = false;
      for (let i = 0; i < out.length && !merged; i++) {
        for (let j = i + 1; j < out.length; j++) {
          if (Math.hypot(out[i]!.x - out[j]!.x, out[i]!.y - out[j]!.y) * s < CELL * 0.8) {
            for (const p of out[j]!.points) add(out[i]!, p);
            out.splice(j, 1);
            merged = true;
            break;
          }
        }
      }
    }
    levels.set(level, out);
    return out;
  };

  const renderMarkers = (level: number) => {
    clusters = clusterAt(level).map((c) => ({ ...c }));
    clusterLevel = level;
    markerLayer.replaceChildren();
    for (const c of clusters) {
      const b = document.createElement('button');
      b.type = 'button';
      const n = c.points.length;
      b.className = n > 1 ? `ra-map-cluster${n >= 50 ? ' is-l' : n >= 10 ? ' is-m' : ''}` : 'ra-map-pin';
      if (n > 1) {
        b.textContent = String(n);
        b.setAttribute('aria-label', say(labels.listings, n));
      } else {
        b.setAttribute('aria-label', `${c.points[0]!.title}, ${c.points[0]!.price}`);
      }
      b.addEventListener('click', (e) => {
        e.stopPropagation();
        open(c);
      });
      b.addEventListener('pointerenter', () => hoverCards(c, true));
      b.addEventListener('pointerleave', () => hoverCards(c, false));
      c.el = b;
      markerLayer.append(b);
    }
    // The popup and the highlighted card follow the listing into its new cluster.
    if (anchor) anchor = clusters.find((c) => c.points.some((p) => p.id === anchor!.points[0]!.id)) ?? null;
    highlight(hoverId);
  };

  const placeTile = (t: Tile, tx: number, ty: number, left: number, top: number) => {
    const ts = size(zoom) / 2 ** t.z;
    const x0 = Math.round(tx * ts - left);
    const y0 = Math.round(ty * ts - top);
    t.im.style.transform = `translate(${x0}px, ${y0}px)`;
    t.im.style.width = `${Math.round((tx + 1) * ts - left) - x0}px`;
    t.im.style.height = `${Math.round((ty + 1) * ts - top) - y0}px`;
  };

  const draw = () => {
    frame = 0;
    measure();
    if (!w || !h) return;
    const s = size(zoom);
    const left = cx * s - w / 2;
    const top = cy * s - h / 2;
    // Tiles of the next whole level drawn smaller (sharp); just above a level, that level a little larger.
    const level = clamp(Math.ceil(zoom - 0.2), MIN_Z, MAX_Z);
    const n = 2 ** level;
    const ts = s / n;
    const seen = new Set<string>();
    let ready = true;
    for (let ty = Math.floor(top / ts); ty <= Math.floor((top + h) / ts); ty++) {
      if (ty < 0 || ty >= n) continue;
      for (let tx = Math.floor(left / ts); tx <= Math.floor((left + w) / ts); tx++) {
        const key = `${level}/${tx}/${ty}`;
        seen.add(key);
        let t = tiles.get(key);
        if (!t) {
          const im = new Image(TILE, TILE);
          im.alt = '';
          im.decoding = 'async';
          im.draggable = false;
          t = { im, z: level, done: false };
          const tile = t;
          // Done once faded in (.2s): only then may the tiles underneath go.
          const finish = () => {
            im.classList.add('is-loaded');
            setTimeout(() => {
              tile.done = true;
              schedule();
            }, 220);
          };
          im.addEventListener('load', finish);
          im.addEventListener('error', finish);
          im.src = `https://tile.openstreetmap.org/${level}/${((tx % n) + n) % n}/${ty}.png`;
          tiles.set(key, t);
          tileLayer.append(im);
        }
        t.im.style.zIndex = '1';
        placeTile(t, tx, ty, left, top);
        if (!t.done) ready = false;
      }
    }
    // Tiles of other levels stay underneath (scaled) until this level has
    // loaded, so zooming never flashes an empty map.
    for (const [key, t] of tiles) {
      if (seen.has(key)) continue;
      const [, tx, ty] = key.split('/').map(Number) as [number, number, number];
      const tsz = s / 2 ** t.z;
      const off = tx * tsz - left > w || (tx + 1) * tsz - left < 0 || ty * tsz - top > h || (ty + 1) * tsz - top < 0;
      if (ready || t.z === level || off || !t.done || Math.abs(t.z - level) > 3) {
        t.im.remove();
        tiles.delete(key);
      } else {
        t.im.style.zIndex = '0';
        placeTile(t, tx, ty, left, top);
      }
    }

    const half = Math.round(zoom * 2) / 2;
    if (clusterLevel !== half) renderMarkers(half);
    for (const c of clusters) {
      const [x, y] = screen(c.x, c.y);
      // `translate`, not `transform`: the hover `scale` would scale a transform's offset too (the marker jumped away from the pointer).
      c.el!.style.translate = `${Math.round(x)}px ${Math.round(y)}px`;
      c.el!.classList.toggle('is-selected', c === anchor);
    }
    placePopup();
    for (const b of zoomButtons) b.disabled = Number(b.dataset.mapZoom) > 0 ? zoom >= MAX_Z : zoom <= MIN_Z;
  };
  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(draw);
  };

  // Animations (zoom buttons, wheel notches, cluster clicks, popups, inertia).
  // Any new gesture cancels the running one.
  let anim = 0;
  const stop = () => {
    cancelAnimationFrame(anim);
    anim = 0;
  };
  const tween = (ms: number, step: (k: number) => void, done?: () => void) => {
    stop();
    if (reduceMotion()) ms = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const t = ms ? Math.min(1, (now - t0) / ms) : 1;
      step(1 - (1 - t) ** 3);
      draw();
      if (t < 1) anim = requestAnimationFrame(tick);
      else {
        anim = 0;
        done?.();
      }
    };
    anim = requestAnimationFrame(tick);
  };
  /** Zoom so that the point under (px, py) stays there. */
  const setZoomAt = (nz: number, px: number, py: number, ax: number, ay: number) => {
    zoom = nz;
    cx = ax - (px - w / 2) / size(zoom);
    cy = ay - (py - h / 2) / size(zoom);
  };
  const zoomTo = (target: number, px = w / 2, py = h / 2, ms = 220) => {
    target = clamp(target, MIN_Z, MAX_Z);
    const z0 = zoom;
    const ax = cx + (px - w / 2) / size(zoom);
    const ay = cy + (py - h / 2) / size(zoom);
    touched = userMoved = true;
    tween(ms, (k) => setZoomAt(z0 + (target - z0) * k, px, py, ax, ay), moveEnd);
  };
  const flyTo = (target: { z: number; x: number; y: number }, ms = 380, done = moveEnd) => {
    const [z0, x0, y0] = [zoom, cx, cy];
    touched = userMoved = true;
    tween(ms, (k) => {
      zoom = z0 + (target.z - z0) * k;
      cx = x0 + (target.x - x0) * k;
      cy = y0 + (target.y - y0) * k;
    }, () => done());
  };
  const panBy = (dx: number, dy: number, ms = 250) => {
    const [x0, y0] = [cx, cy];
    const s = size(zoom);
    touched = userMoved = true;
    tween(ms, (k) => {
      cx = x0 + (dx * k) / s;
      cy = y0 + (dy * k) / s;
    }, moveEnd);
  };

  type Area = { count: number; total: number; all?: true; user?: boolean; bounds?: { s: number; w: number; n: number; e: number } };
  const tell = (detail: Area) => root.dispatchEvent(new CustomEvent('ra:map-area', { bubbles: true, detail }));
  /** The visible area in degrees. */
  const bounds = () => {
    const s = size(zoom);
    return {
      s: toLat(clamp(cy + h / 2 / s, 0, 1)),
      n: toLat(clamp(cy - h / 2 / s, 0, 1)),
      w: Math.max(-180, (cx - w / 2 / s) * 360 - 180),
      e: Math.min(180, (cx + w / 2 / s) * 360 - 180),
    };
  };

  /** `?map=zoom/lat/lng` (or none), other params, hash and history.state kept. */
  const writeUrl = (on: boolean) => {
    // A timer or animation of a map that was swapped out must not write over the new page's URL.
    if (!sync || !root.isConnected) return;
    const u = new URL(location.href);
    if (on) {
      // Set in place (keeps the param order), then the value by hand: searchParams would write the slashes as %2F.
      u.searchParams.set('map', '');
      const v = `${Math.round(clamp(zoom, MIN_Z, MAX_Z) * 100) / 100}/${toLat(cy).toFixed(5)}/${toLng(cx).toFixed(5)}`;
      u.search = u.search.replace(/([?&]map=)[^&]*/, `$1${v}`);
    } else u.searchParams.delete('map');
    if (u.href !== location.href) history.replaceState(history.state, '', u);
  };

  // List <-> map: the cards of the listings inside the map's bounds.
  const area = () => {
    if (!root.isConnected) return;
    if (serverList) {
      const b = bounds();
      const count = points.filter((p) => p.lat >= b.s && p.lat <= b.n && p.lng >= b.w && p.lng <= b.e).length;
      tell({ count, total: points.length, bounds: b, user: userMoved });
      return;
    }
    const cards = cardsOf();
    if (!cards.length) return;
    const inView = new Set(
      points
        .filter((p) => {
          const [x, y] = screen(p.x, p.y);
          return x >= 0 && x <= w && y >= 0 && y <= h;
        })
        .map((p) => p.id),
    );
    for (const card of cards) card.hidden = !inView.has(card.dataset.listingId!);
    if (status) {
      status.querySelector('[data-map-count]')!.textContent = say(labels.inArea, inView.size);
      status.classList.add('is-open');
    }
    tell({ count: inView.size, total: points.length });
  };
  const moveEnd = () => {
    area();
    if (touched) writeUrl(true);
  };
  const showAll = () => {
    for (const card of cardsOf()) card.hidden = false;
    status?.classList.remove('is-open');
    close();
    writeUrl(false);
    tell({ count: points.length, total: points.length, all: true });
    measure();
    if (!points.length || !w || !h) return;
    flyTo(fitView(core(points)), 380, () => {});
    touched = false;
  };
  status?.querySelector('button')?.addEventListener('click', showAll);

  // Popup: above the marker when it fits, below otherwise, kept clear of the
  // map edges and of the zoom buttons.
  function placePopup() {
    if (!anchor) return;
    const pw = popup.offsetWidth;
    const ph = popup.offsetHeight;
    const [x, y] = screen(anchor.x, anchor.y);
    const above = y - ph - 18 >= 4 || y > h - y;
    const top = above ? y - ph - 18 : y + 18;
    const right = top < 116 ? 68 : 8; // the zoom buttons: 12 + 2 × 44 px from the top
    const left = clamp(x - pw / 2, 8, Math.max(8, w - pw - right));
    popup.style.transform = `translate(${Math.round(left)}px, ${Math.round(top)}px)`;
  }
  /** Pan so the opened popup is fully inside the map. */
  const revealPopup = () => {
    if (!anchor) return;
    const pw = popup.offsetWidth;
    const ph = popup.offsetHeight;
    const [x, y] = screen(anchor.x, anchor.y);
    const tx = clamp(x, pw / 2 + 8, Math.max(pw / 2 + 8, w - pw / 2 - 68));
    const ty = h >= ph + 60 ? clamp(y, ph + 26, h - 24) : h - 24;
    if (Math.abs(tx - x) > 1 || Math.abs(ty - y) > 1) panBy(x - tx, y - ty);
  };

  // The cards of the opened listing(s): `.is-selected` (styled by the page),
  // and scrolled into view when the list is shown (not on a phone's map tab).
  // The listings the popup was opened for: they stay selected when a zoom
  // merges their marker into a bigger cluster.
  let selected = new Set<string>();
  const selectCards = (c: Cluster | null, scroll = true) => {
    if (scroll || !c) selected = new Set(c?.points.map((p) => p.id));
    const ids = selected;
    let first: HTMLElement | undefined;
    for (const card of cardsOf()) {
      const on = ids.has(card.dataset.listingId!);
      card.classList.toggle('is-selected', on);
      if (on) first ??= card;
    }
    // Only when the list sits beside the map: on a phone (list below) the
    // page would scroll the map away from the popup.
    const m = root.getBoundingClientRect();
    const r = first?.getBoundingClientRect();
    const beside = !!r && (r.right <= m.left || r.left >= m.right);
    if (scroll && first && beside && first.offsetParent !== null) first.scrollIntoView({ block: 'nearest', behavior: reduceMotion() ? 'auto' : 'smooth' });
  };

  function close(refocus = false) {
    const was = anchor;
    anchor = null;
    if (was) selectCards(null);
    popup.classList.remove('is-open');
    popup.replaceChildren();
    schedule();
    if (refocus) (was?.el?.isConnected ? was.el : viewport).focus({ preventScroll: true });
  }

  function open(c: Cluster) {
    stop();
    const xs = c.points.map((p) => p.x);
    const ys = c.points.map((p) => p.y);
    // Listings that only part at the closest zoom (same building) open as one popup.
    const apart = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) * size(MAX_Z) >= CELL;
    if (c.points.length > 1 && apart && zoom < MAX_Z) {
      close();
      measure();
      const v = fitView(c.points, MAX_Z);
      flyTo({ ...v, z: Math.max(v.z, zoom + 1) });
      return;
    }
    popup.replaceChildren();
    const x = document.createElement('button');
    x.type = 'button';
    x.className = 'ra-map-close';
    x.textContent = '×';
    x.setAttribute('aria-label', labels.close);
    x.addEventListener('click', (e) => {
      e.stopPropagation();
      close(true);
    });
    popup.append(x);
    for (const p of c.points.slice(0, 12)) {
      const a = document.createElement('a');
      a.href = p.url;
      a.className = 'ra-map-card';
      if (p.photo) {
        const im = new Image(320, 213);
        im.src = p.photo;
        im.alt = '';
        im.decoding = 'async';
        a.append(im);
      }
      if (p.type) {
        const ty = document.createElement('span');
        ty.className = 'ra-map-card-type';
        ty.textContent = p.type;
        a.append(ty);
      }
      const t = document.createElement('span');
      t.className = 'ra-map-card-title';
      t.textContent = p.title;
      const pr = document.createElement('span');
      pr.className = 'ra-map-card-price';
      pr.textContent = p.price;
      a.append(t, pr);
      popup.append(a);
    }
    anchor = c;
    popup.classList.add('is-open');
    selectCards(c);
    draw();
    revealPopup();
    (popup.querySelector('a') as HTMLElement | null)?.focus({ preventScroll: true });
  }

  // Drag (with inertia) and pinch; pointer events cover mouse, pen and touch.
  const pointers = new Map<number, { x: number; y: number }>();
  let downAt = { x: 0, y: 0 };
  let moved = false;
  let pinch: { d: number; z: number; ax: number; ay: number } | null = null;
  let velocity = { x: 0, y: 0, t: 0 };
  const local = (x: number, y: number) => {
    const r = viewport.getBoundingClientRect();
    return [x - r.left, y - r.top] as const;
  };
  const pair = () => {
    const [a, b] = [...pointers.values()] as [{ x: number; y: number }, { x: number; y: number }];
    const [mx, my] = local((a.x + b.x) / 2, (a.y + b.y) / 2);
    return { d: Math.hypot(a.x - b.x, a.y - b.y) || 1, mx, my };
  };
  viewport.addEventListener('pointerdown', (e) => {
    if ((e.target as HTMLElement).closest('button, a, [data-map-popup]')) return;
    stop();
    viewport.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    downAt = { x: e.clientX, y: e.clientY };
    moved = false;
    velocity = { x: 0, y: 0, t: performance.now() };
    if (pointers.size === 2) {
      const p = pair();
      pinch = { d: p.d, z: zoom, ax: cx + (p.mx - w / 2) / size(zoom), ay: cy + (p.my - h / 2) / size(zoom) };
    }
  });
  viewport.addEventListener('pointermove', (e) => {
    const prev = pointers.get(e.pointerId);
    if (!prev) return;
    const now = { x: e.clientX, y: e.clientY };
    pointers.set(e.pointerId, now);
    if (Math.hypot(now.x - downAt.x, now.y - downAt.y) > 4) moved = true;
    touched = userMoved = true;
    if (pointers.size === 1 && !pinch) {
      const s = size(zoom);
      cx -= (now.x - prev.x) / s;
      cy -= (now.y - prev.y) / s;
      const t = performance.now();
      const dt = Math.max(1, t - velocity.t);
      velocity = { x: 0.6 * ((now.x - prev.x) / dt) + 0.4 * velocity.x, y: 0.6 * ((now.y - prev.y) / dt) + 0.4 * velocity.y, t };
      schedule();
    } else if (pointers.size === 2 && pinch) {
      const p = pair();
      setZoomAt(clamp(pinch.z + Math.log2(p.d / pinch.d), MIN_Z, MAX_Z), p.mx, p.my, pinch.ax, pinch.ay);
      schedule();
    }
  });
  const release = (e: PointerEvent) => {
    if (!pointers.has(e.pointerId)) return;
    pointers.delete(e.pointerId);
    if (pinch) {
      if (pointers.size < 2) {
        pinch = null;
        moveEnd();
        // The finger left on the glass drags from where it is now.
        velocity = { x: 0, y: 0, t: performance.now() };
      }
      return;
    }
    if (pointers.size || !moved) return;
    const speed = Math.hypot(velocity.x, velocity.y);
    if (performance.now() - velocity.t < 80 && speed > 0.3) {
      // A flick glides on (px per ms × 300 ms, capped).
      const k = Math.min(1, 1 / speed) * 300;
      panBy(-velocity.x * k, -velocity.y * k, 450);
    } else moveEnd();
  };
  viewport.addEventListener('pointerup', release);
  viewport.addEventListener('pointercancel', release);
  viewport.addEventListener('click', (e) => {
    if (!moved && !(e.target as HTMLElement).closest('[data-map-popup], button')) close();
  });

  // Wheel: a mouse notch zooms one level (animated, notches add up); a
  // trackpad scroll or pinch (small deltas, ctrlKey) zooms continuously.
  let wheelTarget: number | null = null;
  let wheelEnd = 0;
  viewport.addEventListener(
    'wheel',
    (e) => {
      e.preventDefault();
      touched = userMoved = true;
      const [px, py] = local(e.clientX, e.clientY);
      const dy = e.deltaY * (e.deltaMode === 1 ? 33 : e.deltaMode === 2 ? 800 : 1);
      if (!dy) return;
      const notch = !e.ctrlKey && (e.deltaMode !== 0 || (Math.abs(dy) >= 50 && Number.isInteger(dy)));
      clearTimeout(wheelEnd);
      if (notch) {
        wheelTarget = clamp((anim && wheelTarget != null ? wheelTarget : zoom) + (dy < 0 ? 1 : -1), MIN_Z, MAX_Z);
        zoomTo(wheelTarget, px, py, 200);
        return;
      }
      stop();
      wheelTarget = null;
      const ax = cx + (px - w / 2) / size(zoom);
      const ay = cy + (py - h / 2) / size(zoom);
      setZoomAt(clamp(zoom - dy * (e.ctrlKey ? 0.01 : 0.004), MIN_Z, MAX_Z), px, py, ax, ay);
      schedule();
      wheelEnd = window.setTimeout(moveEnd, 160);
    },
    { passive: false },
  );
  viewport.addEventListener('dblclick', (e) => {
    if ((e.target as HTMLElement).closest('button, a, [data-map-popup]')) return;
    const [px, py] = local(e.clientX, e.clientY);
    zoomTo(zoom + 1, px, py);
  });
  viewport.addEventListener('keydown', (e) => {
    if ((e.target as HTMLElement).closest('a')) {
      if (e.key === 'Escape') close(true);
      return;
    }
    const step = 128;
    const keys: Record<string, () => void> = {
      ArrowLeft: () => panBy(-step, 0, 150),
      ArrowRight: () => panBy(step, 0, 150),
      ArrowUp: () => panBy(0, -step, 150),
      ArrowDown: () => panBy(0, step, 150),
      '+': () => zoomTo(zoom + 1),
      '=': () => zoomTo(zoom + 1),
      '-': () => zoomTo(zoom - 1),
      Escape: () => close(true),
    };
    const run = keys[e.key];
    if (!run) return;
    e.preventDefault();
    run();
  });
  for (const b of zoomButtons) b.addEventListener('click', () => zoomTo(zoom + Number(b.dataset.mapZoom)));

  // Card hover/focus highlights its marker (or the cluster holding it), and a
  // marker hover highlights its cards (`.is-map-hover`, styled by the page).
  function highlight(id: string | null) {
    hoverId = id;
    for (const c of clusters) c.el!.classList.toggle('is-active', !!id && c.points.some((p) => p.id === id));
  }
  function hoverCards(c: Cluster, on: boolean) {
    const ids = new Set(c.points.map((p) => p.id));
    for (const card of cardsOf()) if (ids.has(card.dataset.listingId!)) card.classList.toggle('is-map-hover', on);
  }
  // Delegated, so a list swapped in later is covered too; removed with the map.
  const cardOf = (e: Event) =>
    (e.target as Element | null)?.closest?.<HTMLElement>(`#${CSS.escape(root.dataset.list ?? '')} [data-listing-id]`) ?? null;
  const onCard = (e: Event) => {
    if (!root.isConnected) return off();
    const card = cardOf(e);
    if (!card) return;
    const enter = e.type === 'pointerover' || e.type === 'focusin';
    const to = (e as PointerEvent | FocusEvent).relatedTarget as Node | null;
    if (!enter && to && card.contains(to)) return;
    highlight(enter ? card.dataset.listingId! : null);
  };
  // After ListingsSearch swapped the list: the opened listing stays selected.
  const onSwap = () => {
    if (!root.isConnected) return off();
    const l = listOf();
    if (l) l.style.overflowAnchor = 'none';
    if (anchor) selectCards(anchor, false);
  };
  const types = ['pointerover', 'pointerout', 'focusin', 'focusout'] as const;
  const off = () => {
    for (const t of types) document.removeEventListener(t, onCard);
    document.removeEventListener('ra:list-swap', onSwap);
  };
  if (root.dataset.list) {
    for (const t of types) document.addEventListener(t, onCard);
    document.addEventListener('ra:list-swap', onSwap);
  }

  // First view once the map has a size; until the visitor moves the map, a
  // layout change (fonts, sticky column, phone toolbar) refits it.
  // A view from the URL is used as is, and the list follows it once there is a size.
  // A map swapped out of the page stops observing (the observer would keep it alive).
  const ro = new ResizeObserver(() => {
    if (!root.isConnected) return ro.disconnect();
    measure();
    if (!w || !h) return;
    if (!touched) fit();
    schedule();
    if (areaPending) {
      areaPending = false;
      area();
    }
  });
  ro.observe(viewport);
  if (initial) [zoom, cx, cy] = [initial.z, initial.x, initial.y];
  else fit();
  root.classList.add('is-ready');
  draw();
  // The map usually has its size already: filter now, not on the first
  // ResizeObserver callback (late in a background tab, after paint).
  if (areaPending && w && h) {
    areaPending = false;
    area();
  }
}

/**
 * Set up every map in `scope` (the page, or a results region swapped in by
 * fetch). `data-ra-mounted` marks a root as done, so a second import or call
 * never binds its handlers twice.
 */
export function mountMaps(scope: ParentNode = document) {
  const roots = [...scope.querySelectorAll<HTMLElement>('[data-ra-map]')];
  if (scope instanceof HTMLElement && scope.matches('[data-ra-map]')) roots.unshift(scope);
  for (const root of roots) {
    if (root.hasAttribute('data-ra-mounted')) continue;
    root.setAttribute('data-ra-mounted', '');
    setup(root);
  }
}

mountMaps();
