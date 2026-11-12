/**
 * Construction photos: site content, not data. The fixture's
 * construction_photos (fixture only) show finished buildings, so the gallery
 * uses illustration photos of a residential building site instead
 * (Pexels, src/content/photo-credits.md), one per stage of the works.
 * They are labelled as illustrations: they do not show this site.
 */
const bucket = (id: string) => `https://storage.googleapis.com/img.realadvisor.ch/sites-demo-pexels-${id}.jpg`;

export type BuildPhoto = { url: string; width: number; height: number; stage: string; alt: string };

export const CONSTRUCTION: BuildPhoto[] = [
  { url: bucket('11680715'), width: 2400, height: 1597, stage: 'Terrassement', alt: 'Pelle mécanique sur le fond de fouille d’un chantier résidentiel' },
  { url: bucket('15110001'), width: 2400, height: 1800, stage: 'Fondations', alt: 'Fouille blindée et coffrages des fondations d’un immeuble' },
  { url: bucket('34360408'), width: 2400, height: 1800, stage: 'Gros œuvre', alt: 'Structure en béton d’un immeuble d’habitation en construction' },
  { url: bucket('12843084'), width: 2400, height: 1600, stage: 'Dalles et étages', alt: 'Dalles et garde-corps provisoires d’un immeuble en construction' },
  { url: bucket('5511097'), width: 2400, height: 1600, stage: 'Façades', alt: 'Échafaudages le long de la façade d’un immeuble en construction' },
];
