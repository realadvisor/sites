/** Listing section tabs: the link of the section in view is marked current. */
// Section tabs: the link of the section in view is marked current.
const links = [...document.querySelectorAll<HTMLAnchorElement>('[data-tab]')];
const secs = links.map((a) => document.getElementById(a.dataset.tab!)).filter(Boolean) as HTMLElement[];
if (links.length && 'IntersectionObserver' in window) {
  const set = (id: string) => links.forEach((a) => (a.dataset.tab === id ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current')));
  const io = new IntersectionObserver(
    (es) => {
      const vis = es.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (vis) set(vis.target.id);
    },
    { rootMargin: '-35% 0px -55% 0px' },
  );
  secs.forEach((s) => io.observe(s));
  set(secs[0]?.id ?? '');
}
export {};
