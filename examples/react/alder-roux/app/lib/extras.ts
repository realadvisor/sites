/**
 * Fields the API does not have yet (fixture only), by record id. Loaders
 * pass the ones a page needs (data.server.ts `extras()`, empty on live
 * data); every read goes through these two functions and is marked
 * `// fixture only:` where it is used. Never present them as API data.
 */
export type Extras = Record<string, Record<string, unknown>>;

export const extraStr = (ex: Extras, id: string, key: string) => {
  const v = ex[id]?.[key];
  return typeof v === 'string' && v.trim() ? v : undefined;
};
export const extraNum = (ex: Extras, id: string, key: string) => {
  const v = ex[id]?.[key];
  return typeof v === 'number' && Number.isFinite(v) ? v : undefined;
};
