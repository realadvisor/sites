/**
 * The strings of PhotoViewer and ListingArea, in the site languages (the
 * same file in both kits). A site overrides any of them with `labels`.
 */
import { lang, t, type Lang } from '@realadvisor/sites-kit-core/i18n';

type Strings = Record<Lang, string>;

const S = {
  photos: { de: 'Fotos', fr: 'Photos', it: 'Foto', es: 'Fotos', en: 'Photos' },
  open: { de: 'Foto vergrössern', fr: 'Agrandir la photo', it: 'Ingrandisci la foto', es: 'Ampliar la foto', en: 'Enlarge the photo' },
  prev: { de: 'Vorheriges Foto', fr: 'Photo précédente', it: 'Foto precedente', es: 'Foto anterior', en: 'Previous photo' },
  next: { de: 'Nächstes Foto', fr: 'Photo suivante', it: 'Foto successiva', es: 'Foto siguiente', en: 'Next photo' },
  all: { de: 'Alle {n} Fotos', fr: 'Les {n} photos', it: 'Tutte le {n} foto', es: 'Las {n} fotos', en: 'All {n} photos' },
  photo: { de: 'Foto {n}', fr: 'Photo {n}', it: 'Foto {n}', es: 'Foto {n}', en: 'Photo {n}' },
  activate: { de: 'Karte aktivieren', fr: 'Activer la carte', it: 'Attiva la mappa', es: 'Activar el mapa', en: 'Activate the map' },
  approx: { de: 'Ungefähre Lage', fr: 'Situation approximative', it: 'Posizione approssimativa', es: 'Ubicación aproximada', en: 'Approximate location' },
  openOsm: { de: 'In OpenStreetMap öffnen', fr: 'Ouvrir dans OpenStreetMap', it: 'Apri in OpenStreetMap', es: 'Abrir en OpenStreetMap', en: 'Open in OpenStreetMap' },
} satisfies Record<string, Strings>;

export type PhotoViewerLabels = {
  /** The viewer's name (dialog label). */
  photos: string;
  /** Added to each tile's link label: "<alt>: Enlarge the photo". */
  open: string;
  close: string;
  prev: string;
  next: string;
  /** "All {n} photos" (the 5th tile and the phone's link). */
  all: string;
  /** Alt of a photo without one: "<alt>, Photo {n}". */
  photo: string;
};

export type ListingAreaLabels = {
  /** The unlock button: «Activer la carte». */
  activate: string;
  /** Under the map, and the static map's label. */
  approx: string;
  /** The secondary link to openstreetmap.org. */
  openOsm: string;
  /** © credit text (the kit map's own). */
  credit: string;
  /** The live map's label (screen readers; default: approx). */
  map: string;
};

const pick = (l: Lang, keys: readonly (keyof typeof S)[]) => Object.fromEntries(keys.map((k) => [k, S[k][l]]));

export function photoViewerLabels(locale?: string, over: Partial<PhotoViewerLabels> = {}): PhotoViewerLabels {
  const l = lang(locale);
  return { ...(pick(l, ['photos', 'open', 'prev', 'next', 'all', 'photo']) as Omit<PhotoViewerLabels, 'close'>), close: t('close', {}, l), ...over };
}

export function listingAreaLabels(locale?: string, over: Partial<ListingAreaLabels> = {}): ListingAreaLabels {
  const l = lang(locale);
  return {
    ...(pick(l, ['activate', 'approx', 'openOsm']) as Pick<ListingAreaLabels, 'activate' | 'approx' | 'openOsm'>),
    credit: t('osmContributors', {}, l),
    map: over.approx ?? S.approx[l],
    ...over,
  };
}

/** "{n}" in a label. */
export const fill = (s: string, n: number) => s.replace('{n}', String(n));

/**
 * The static map and the area circle (Web Mercator, 256px tiles): the tiles
 * around the place, its position inside them, and the circle's radius in px
 * for `radiusM` metres at this zoom.
 */
export function areaTiles(lat: number, lng: number, z: number, radiusM: number, cols = 7, rows = 3) {
  const TILE = 256;
  const n = 2 ** z;
  const rad = (lat * Math.PI) / 180;
  const x = ((lng + 180) / 360) * n;
  const y = ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * n;
  const x0 = Math.floor(x) - (cols >> 1);
  const y0 = Math.floor(y) - (rows >> 1);
  const tiles: { src: string; left: number; top: number }[] = [];
  for (let dy = 0; dy < rows; dy++) {
    for (let dx = 0; dx < cols; dx++) {
      const ty = y0 + dy;
      if (ty < 0 || ty >= n) continue;
      tiles.push({ src: `https://tile.openstreetmap.org/${z}/${(((x0 + dx) % n) + n) % n}/${ty}.png`, left: dx * TILE, top: dy * TILE });
    }
  }
  const metresPerPx = (40075016.686 * Math.cos(rad)) / (TILE * n);
  return { tiles, width: cols * TILE, height: rows * TILE, px: (x - x0) * TILE, py: (y - y0) * TILE, r: Math.round(radiusM / metresPerPx) };
}

/** openstreetmap.org at the area, without a marker (the place is approximate). */
export const osmUrl = (lat: number, lng: number, z: number) => `https://www.openstreetmap.org/#map=${z}/${lat.toFixed(4)}/${lng.toFixed(4)}`;
