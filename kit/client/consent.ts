/**
 * Browser side of the analytics consent banner (components/ConsentBanner.astro,
 * the React kit's ConsentBanner.tsx): shows it until a choice, loads GA4 only
 * after "Accept". Runs on import.
 */
(() => {
  const el = document.querySelector<HTMLElement>('[data-consent]');
  if (!el) return;
  const id = el.dataset.consent ?? '';
  const KEY = 'ra-consent';
  const load = () => {
    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(id);
    document.head.append(s);
    const w = window as unknown as { dataLayer: unknown[]; gtag: (...args: unknown[]) => void };
    w.dataLayer = w.dataLayer || [];
    // gtag.js expects the arguments object itself, not an array.
    w.gtag = function () { w.dataLayer.push(arguments); };
    w.gtag('js', new Date());
    w.gtag('config', id, { anonymize_ip: true });
  };
  let choice = null;
  try { choice = localStorage.getItem(KEY); } catch {}
  if (choice === 'granted') return load();
  if (choice === 'denied') return;
  el.hidden = false;
  el.addEventListener('click', (e) => {
    const c = (e.target as Element | null)?.closest<HTMLElement>('[data-choice]')?.dataset.choice;
    if (!c) return;
    try { localStorage.setItem(KEY, c); } catch {}
    el.hidden = true;
    if (c === 'granted') load();
  });
})();

export {};
