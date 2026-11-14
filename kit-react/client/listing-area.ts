/**
 * ListingArea's browser side (the same file in both kits). When the area
 * comes near the screen (400px ahead), the kit's ListingsMap is cloned from
 * its <template> over the static tiles and mounted by the kit's map script
 * (@realadvisor/sites-kit-core/client/listings-map, loaded then). It stays
 * locked (`inert`, page scroll and swipes pass through) until the visitor
 * taps «Activer la carte»; then it pans and zooms like the listings map.
 *
 * The circle is not a marker: it follows the map's view, read from the
 * map's own tiles (each tile's level, place and drawn size), so it keeps its
 * size in metres (`data-radius`) at every zoom: `--la-x`, `--la-y` (centre,
 * px in the map) and `--la-r` (radius, px) on the root.
 * `listingAreas(scope)` sets up areas that arrive later; each once.
 */

const TILE = 256;
const EARTH = 40075016.686; // m, at the equator

const toX = (lng: number) => (lng + 180) / 360;
const toY = (lat: number) => {
  const s = Math.sin((Math.max(-85, Math.min(85, lat)) * Math.PI) / 180);
  return 0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI);
};

function follow(root: HTMLElement, map: HTMLElement, lat: number, lng: number, radius: number) {
  const layer = map.querySelector<HTMLElement>('[data-map-tiles]');
  if (!layer) return;
  const [px, py] = [toX(lng), toY(lat)];
  const sync = () => {
    // The tile of the level on screen (z-index 1; the others wait underneath)
    // nearest the place: tile sizes are whole px, so a far one would drift.
    let best: { x: number; y: number; level: number; size: number; d: number } | null = null;
    for (const im of layer.querySelectorAll('img')) {
      if (im.style.zIndex !== '1' || !im.style.width) continue;
      const m = im.src.match(/\/(\d+)\/(\d+)\/(\d+)\.png$/);
      const t = im.style.transform.match(/translate\((-?[\d.]+)px,\s*(-?[\d.]+)px\)/);
      if (!m || !t) continue;
      const [level, tx, ty] = [Number(m[1]), Number(m[2]), Number(m[3])];
      const n = 2 ** level;
      const size = parseFloat(im.style.width) || TILE;
      // The tile's column is wrapped into the world (src); the place may sit a world away.
      let dx = px * n - tx;
      dx -= Math.round(dx / n) * n;
      const dy = py * n - ty;
      const d = Math.abs(dx - 0.5) + Math.abs(dy - 0.5);
      if (!best || d < best.d) best = { x: Number(t[1]) + dx * size, y: Number(t[2]) + dy * size, level, size, d };
    }
    if (!best) return;
    const { x, y, level, size } = best;
    const zoom = level + Math.log2(size / TILE);
    const metresPerPx = (EARTH * Math.cos((lat * Math.PI) / 180)) / (TILE * 2 ** zoom);
    root.style.setProperty('--la-x', `${Math.round(x)}px`);
    root.style.setProperty('--la-y', `${Math.round(y)}px`);
    root.style.setProperty('--la-r', `${Math.round(radius / metresPerPx)}px`);
    root.classList.add('is-live');
  };
  // Right after the map's own draw, before the frame paints (reads no layout).
  new MutationObserver(sync).observe(layer, { subtree: true, childList: true, attributes: true, attributeFilter: ['style'] });
}

function setup(root: HTMLElement) {
  const live = root.querySelector<HTMLElement>('[data-la-live]');
  const tpl = root.querySelector<HTMLTemplateElement>('[data-la-tpl]');
  const unlock = root.querySelector<HTMLButtonElement>('[data-la-unlock]');
  const lat = Number(root.dataset.lat);
  const lng = Number(root.dataset.lng);
  if (!live || !tpl || !unlock || !Number.isFinite(lat) || !Number.isFinite(lng)) return;
  const radius = Number(root.dataset.radius) || 750;

  const mount = () => {
    live.append(tpl.content.cloneNode(true));
    root.classList.add('is-locked');
    live.inert = true;
    unlock.hidden = false;
    const map = live.querySelector<HTMLElement>('[data-ra-map]');
    if (!map) return;
    // One place, not "the properties": the map's name for screen readers.
    if (root.dataset.label) map.querySelector('[data-map-viewport]')?.setAttribute('aria-label', root.dataset.label);
    follow(root, map, lat, lng, radius);
    void import('@realadvisor/sites-kit-core/client/listings-map').then((m) => m.mountMaps(live));
  };
  unlock.addEventListener('click', () => {
    root.classList.remove('is-locked');
    live.inert = false;
    unlock.hidden = true;
    live.querySelector<HTMLElement>('[data-map-viewport]')?.focus({ preventScroll: true });
  });
  if (!('IntersectionObserver' in window)) return mount();
  const io = new IntersectionObserver(
    (entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io.disconnect();
      mount();
    },
    { rootMargin: '400px 0px' },
  );
  io.observe(root);
}

export function listingAreas(scope: ParentNode = document) {
  for (const root of scope.querySelectorAll<HTMLElement>('[data-listing-area]')) {
    if (root.hasAttribute('data-la-mounted')) continue;
    root.setAttribute('data-la-mounted', '');
    setup(root);
  }
}

listingAreas();
