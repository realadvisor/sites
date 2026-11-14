/**
 * Which photo a card or a hero shows. The CRM's first photo is often a floor
 * plan, a "Reserved" or "Sold" banner, a home-staging label or an off-market
 * graphic; lots of one development often share one set of renders. Display
 * only: the listing keeps all its photos, in order.
 *
 *   const photo = pickPhoto(listing, 'card');                    // first clean photo
 *   const hero = pickPhoto(best, 'hero', { overrides: HERO });   // a clean exterior, or undefined
 *   const photos = lotPhotos(listings);                          // id -> photo, no image twice in a row
 *   <RaImage photo={photos[l.id] ?? pickPhoto(l, 'card')} ... />
 *
 * A photo is "labelled" when its URL (the original behind an image-proxy URL
 * included) or its alt names a plan or a burned-in label: plan, floor plan,
 * Grundriss, plano, planimetria, staging, reserved / réservé / reserviert /
 * reservado / riservato, off-market, sold / vendu / verkauft / vendido /
 * venduto, loué / vermietet, banner, watermark. Labels the file name and alt
 * do not name cannot be seen: list those listings in `overrides`.
 */
import type { Photo } from '@realadvisor/sites-sdk/types';

export type PhotoPurpose = 'card' | 'hero';

/** Listing id -> the photo to use: its index in `photos`, or a piece of its URL. */
export type PhotoOverrides = Record<string, number | string>;

export type PickOptions = {
  overrides?: PhotoOverrides;
};

type WithPhotos = { id: string; photos?: Photo[] | null; address?: { city?: string } | null };

const LABEL = new RegExp(
  [
    String.raw`(?:^|[^\p{L}])(?:floor[-_ ]?)?plans?(?:$|[^\p{L}])`,
    String.raw`floorplan|grundriss|plano(?:$|[^\p{L}])|planimetri|plan[-_ ]de[-_ ]|plan[-_]?masse`,
    String.raw`staging|r[ée]serv|reserviert|riservat|off[-_ ]?market`,
    String.raw`(?:^|[^\p{L}])(?:sold|vendu|vendue|verkauft|vendido|vendida|venduto|venduta|lou[ée]e?|vermietet|alquilado|affittato)(?:$|[^\p{L}])`,
    String.raw`banner|bandeau|watermark|filigrane`,
  ].join('|'),
  'iu',
);
const EXTERIOR = /ext[ée]rieur|exterior|esterno|esterni|au(?:ss|ß)en|fa[cç]ade|fachada|aerial|a[ée]rien|drone|garden|jardin|garten|giardino|piscine|pool|piscina/i;

/** The original URL behind an image-proxy URL (base64 in the last path segment), else the URL. */
function original(url: string): string {
  const last = url.split('?')[0]!.split('/').pop() ?? '';
  const b64 = last.replace(/\.\w+$/, '');
  if (b64.length >= 16 && /^[\w-]+$/.test(b64)) {
    try {
      const s = atob(b64.replace(/-/g, '+').replace(/_/g, '/'));
      if (/^https?:\/\//.test(s)) return s;
    } catch {}
  }
  return url;
}

const text = (p: Photo) => {
  let u = p.url;
  try { u = decodeURIComponent(p.url); } catch {}
  return `${u} ${original(p.url)} ${p.alt ?? ''}`;
};

/** The photo names a plan or a burned-in label (see the header). */
export const isLabelledPhoto = (p: Photo): boolean => LABEL.test(text(p));

/** The photo's URL or alt says it shows the outside (façade, garden, pool, aerial view). */
export const isExteriorPhoto = (p: Photo): boolean => EXTERIOR.test(text(p));

function override(x: WithPhotos, o?: PhotoOverrides): Photo | undefined {
  const v = o?.[x.id];
  const photos = x.photos ?? [];
  if (v == null) return undefined;
  return typeof v === 'number' ? photos[v] : photos.find((p) => p.url.includes(v));
}

/**
 * The photo for a card or a hero: the override, else the first clean photo
 * (a hero prefers a clean exterior). A card falls back to the first photo that
 * is not a plan; a hero returns undefined rather than a labelled photo (pick
 * another listing).
 */
export function pickPhoto(x: WithPhotos, purpose: PhotoPurpose = 'card', opts: PickOptions = {}): Photo | undefined {
  const o = override(x, opts.overrides);
  if (o) return o;
  const photos = x.photos ?? [];
  const clean = photos.filter((p) => p?.url && !isLabelledPhoto(p));
  if (purpose === 'hero') return clean.find(isExteriorPhoto) ?? clean[0];
  return clean[0] ?? photos.find((p) => p?.url && !/plan|grundriss|plano|planimetri/i.test(text(p)));
}

/**
 * The same image in another size or behind another proxy URL gets the same key:
 * the original URL without its query, size suffixes (-800x600, @2x, _1200w) and
 * image-proxy resize steps.
 */
export function photoKey(p: Photo | string): string {
  const url = original(typeof p === 'string' ? p : p.url);
  return url
    .split(/[?#]/)[0]!
    .toLowerCase()
    .replace(/[-_]\d{2,5}x\d{2,5}(?=\.\w+$)/, '')
    .replace(/@\dx(?=\.\w+$)/, '')
    .replace(/[-_]\d{3,4}w(?=\.\w+$)/, '')
    .replace(/\.(?:jpe?g|png|webp|avif)$/, '');
}

/**
 * Card photos for a list in its display order (a search page, a home
 * selection): each listing gets its card photo, unless that image is already
 * used by a card before it; then it gets its least-used clean photo. Lots of
 * one development that share one set of renders thus each show a different
 * render, and the same image never shows twice side by side while the set has
 * more than one. Two photos are the same image when `photoKey` matches, or
 * when listings in one city carry a file of the same name (lots uploaded one
 * by one: a timestamp or size suffix in the name is ignored). Returns listing id -> photo (listings without photos are left
 * out). Counts and order are untouched.
 */
export function lotPhotos(listings: WithPhotos[], opts: PickOptions = {}): Record<string, Photo> {
  const used = new Map<string, number>();
  const out: Record<string, Photo> = {};
  for (const x of listings) {
    const city = (x.address?.city ?? '').toLowerCase();
    const keys = (p: Photo) => {
      const name = photoKey(p).split('/').pop()!.replace(/[-_]\d{4}-\d{2}-\d{2}(?:[-_]\d+)?$/, '').replace(/__[\w-]+$/, '');
      return city ? [photoKey(p), `${city}|${name}`] : [photoKey(p)];
    };
    const count = (p: Photo) => Math.max(...keys(p).map((k) => used.get(k) ?? 0));
    const first = pickPhoto(x, 'card', opts);
    if (!first) continue;
    const pinned = override(x, opts.overrides);
    const candidates = pinned ? [pinned] : [first, ...(x.photos ?? []).filter((p) => p !== first && p?.url && !isLabelledPhoto(p))];
    let pick = candidates[0]!;
    for (const c of candidates) if (count(c) < count(pick)) pick = c;
    for (const k of keys(pick)) used.set(k, (used.get(k) ?? 0) + 1);
    out[x.id] = pick;
  }
  return out;
}
