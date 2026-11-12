/**
 * Fields the API does not have yet (fixture only: a unit's position on its
 * floor), by record id. Loaders pass the ones a page needs (data.server.ts
 * `extras()`, empty on live data); every read goes through `extraNum` and is
 * marked `// fixture only:` where it is used. Never present them as API data.
 */
export type Extras = Record<string, Record<string, unknown>>;

export const extraNum = (ex: Extras, id: string, key: string) => {
  const v = ex[id]?.[key];
  return typeof v === 'number' && Number.isFinite(v) ? v : undefined;
};
