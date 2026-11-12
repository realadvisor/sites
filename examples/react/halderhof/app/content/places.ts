/**
 * Site content, not API data: place photos for the region and office pages,
 * from the RealAdvisor image pool,
 * keyed by the office's city slug. A region without an entry shows no photo.
 */
import type { L } from '../lib/routes';

const P = (id: string) => `https://storage.googleapis.com/img.realadvisor.ch/sites-demo-pexels-${id}.jpg`;

export type Place = { photo: string; alt: Record<L, string> };

export const PLACES: Record<string, Place[]> = {
  zuerich: [
    { photo: P('18415770'), alt: { de: 'Die Limmat mit Fraumünster und Grossmünster', fr: 'La Limmat avec le Fraumünster et le Grossmünster', en: 'The Limmat with the Fraumünster and Grossmünster' } },
    { photo: P('29148082'), alt: { de: 'St. Peter und die Schipfe an der Limmat', fr: 'St-Pierre et la Schipfe au bord de la Limmat', en: 'St. Peter and the Schipfe on the Limmat' } },
  ],
  basel: [
    { photo: P('31804756'), alt: { de: 'Das Basler Münster über dem Rhein', fr: 'La cathédrale de Bâle au-dessus du Rhin', en: 'Basel Minster above the Rhine' } },
    { photo: P('31716418'), alt: { de: 'Die Mittlere Brücke in Basel', fr: 'Le Mittlere Brücke à Bâle', en: 'The Mittlere Brücke in Basel' } },
  ],
  bern: [
    { photo: P('40735698'), alt: { de: 'Die Aareschlaufe mit der Berner Altstadt', fr: 'La boucle de l’Aar et la vieille ville de Berne', en: 'The Aare loop and Bern old town' } },
    { photo: P('7938597'), alt: { de: 'Die Berner Altstadt mit dem Münster', fr: 'La vieille ville de Berne et sa cathédrale', en: 'Bern old town with the Minster' } },
  ],
};

export const placeOf = (slug: string, i = 0): Place | undefined => PLACES[slug]?.[i] ?? PLACES[slug]?.[0];
