/**
 * Project text in German. The CRM keeps a development's description in one
 * language (here Italian), so the API serves it in Italian whatever the
 * `locale`; the German site shows this translation of the same facts
 * (nothing added). Italian pages render the API description itself. Units
 * come translated through `locale` (their CRM texts per language).
 */
import description from './description-de.json';

export const DESCRIPTION_DE: string[] = description;

/** German text for a unit the API has no description for, composed from its data fields only. */
export const unitTextDe = (p: { rooms: string; surface: string; floor: string; house: string; bedrooms?: number; bathrooms?: number; outdoor?: string }) =>
  [
    `${p.rooms}-Wohnung mit ${p.surface} Wohnfläche, ${p.floor}, ${p.house}${p.outdoor ? `, mit ${p.outdoor}` : ''}.`,
    [p.bedrooms ? `${p.bedrooms} ${p.bedrooms === 1 ? 'Schlafzimmer' : 'Schlafzimmer'}` : '', p.bathrooms ? `${p.bathrooms} ${p.bathrooms === 1 ? 'Bad' : 'Bäder'}` : '']
      .filter(Boolean)
      .join(', ')
      .replace(/^(.)/, (m) => m.toUpperCase()) + (p.bedrooms || p.bathrooms ? '.' : ''),
  ].filter((s) => s && s !== '.');
