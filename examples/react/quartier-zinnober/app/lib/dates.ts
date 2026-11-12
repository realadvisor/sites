const DATE = new Intl.DateTimeFormat('de-CH', { day: 'numeric', month: 'long', year: 'numeric' });
const MONTH = new Intl.DateTimeFormat('de-CH', { month: 'long', year: 'numeric' });
/** News dates (yyyy-mm-dd, read as UTC midnight like the Astro collection's z.coerce.date). */
export const newsDate = (iso: string) => DATE.format(new Date(iso));
export const newsMonth = (iso: string) => MONTH.format(new Date(iso));
