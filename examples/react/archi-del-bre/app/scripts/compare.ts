/**
 * Compare page: without ?u= it opens the stored shortlist; with ?u= (a shared
 * link) that list becomes the shortlist on this device; "remove" links keep
 * the stored list in step.
 */
import { readFavs, writeFavs } from './favourites';

const root = document.querySelector<HTMLElement>('[data-compare]');
const params = new URLSearchParams(location.search);
if (root && !params.get('u')) {
  const list = readFavs();
  if (list.length) location.replace(`${location.pathname}?u=${list.join(',')}`);
} else if (root) {
  const ids = (params.get('u') ?? '').split(',').filter((x) => /^[0-9a-f]{8}$/.test(x));
  if (ids.length) writeFavs(ids);
  for (const a of root.querySelectorAll<HTMLAnchorElement>('[data-remove]')) {
    a.addEventListener('click', () => writeFavs(readFavs().filter((x) => x !== a.dataset.remove)));
  }
}
