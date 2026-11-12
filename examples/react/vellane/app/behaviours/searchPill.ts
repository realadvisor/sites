/** Home search pill. Clean URLs: empty choices are left out of the query (the form still works without this). */
document.querySelectorAll<HTMLFormElement>('.sp__form').forEach((f) =>
  f.addEventListener('submit', () => f.querySelectorAll('select').forEach((s) => (s.disabled = !s.value))),
);
// Back from the results: re-enable them.
window.addEventListener('pageshow', () => document.querySelectorAll<HTMLSelectElement>('.sp__form select').forEach((s) => (s.disabled = false)));
export {};
