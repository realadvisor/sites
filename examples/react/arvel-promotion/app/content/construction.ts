/**
 * Construction photos: site content, not data. The fixture's
 * construction_photos (fixture only) show finished buildings or repeat the
 * programme photos, so the gallery shows illustration photos of residential
 * building sites instead (Pexels, src/content/photo-credits.md), labelled as
 * illustrations: they do not show this programme. Keyed by development slug.
 * A programme that is still on sale (works not started) has none.
 */
import type { PhotoName } from './photos';

export type BuildPhoto = { name: PhotoName; alt: string };

export const CONSTRUCTION: Record<string, BuildPhoto[]> = {
  'quai-des-tanneurs': [
    { name: 'chantier-grues', alt: 'Grues à tour au-dessus d’un immeuble en gros œuvre, sous échafaudages' },
    { name: 'chantier-structure', alt: 'Structure en béton d’un immeuble en construction, à côté du mât d’une grue' },
    { name: 'chantier-filets', alt: 'Façade d’un immeuble en construction, sous échafaudages et filets de protection' },
  ],
  'le-clos-des-tilleuls': [
    { name: 'chantier-voiles-beton', alt: 'Voiles de béton et balcons bruts d’un immeuble en construction' },
    { name: 'chantier-echafaudages', alt: 'Façades sous échafaudages et voirie en travaux au pied d’immeubles neufs' },
    { name: 'chantier-finitions', alt: 'Immeuble aux balcons vitrés en finitions, flèche d’une grue dans le ciel' },
  ],
};

export const constructionFor = (slug: string): BuildPhoto[] => CONSTRUCTION[slug] ?? [];
