/**
 * Facts about the building that the CRM does not carry, taken from the site
 * brief (the developer's own description of the project). Nothing here is a
 * figure computed from units: those always come from the data.
 */
import type { Wing } from '../lib/units';

/** Street number of each wing (the development address is the 1908 building). */
export const WING_ADDRESS: Record<Wing, string> = {
  '1908': 'Carrer de Sueca 38',
  nueva: 'Carrer de Sueca 40',
};
