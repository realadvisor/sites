/**
 * Header: wordmark left, links and the language switch in the middle, the
 * brochure button right (no hero form: the brochure is a header button).
 * Phone: wordmark and a menu button (44x44, Escape closes, scroll locked).
 * The shortlist count appears once a unit is saved (app/client.ts).
 */
import type { Site } from '../lib/data.server';
import { href, LOCALE, type L, type RouteKey } from '../lib/routes';
import { c } from '../lib/copy';
import { brochure } from '../lib/docs';
import './Header.css';

export type PageRoute = RouteKey | 'unit' | '404';
type Alt = { lang: string; href: string };

export function Header({ site, l, route, alternates }: { site: Site; l: L; route: PageRoute; alternates?: Alt[] }) {
  const NAV: { key: RouteKey; label: string }[] = [
    { key: 'units', label: c('units', l) },
    { key: 'location', label: c('location', l) },
    { key: 'gallery', label: c('gallery', l) },
    { key: 'documents', label: c('documents', l) },
    { key: 'contact', label: c('contact', l) },
  ];
  const active = (k: RouteKey) => (k === route || (k === 'units' && (route === 'unit' || route === 'compare')) ? 'page' : undefined);
  const other = (['it', 'de'] as const).map((x) => ({ l: x, href: alternates?.find((a) => a.lang === LOCALE[x])?.href ?? href('home', x) }));
  const pdf = brochure(l);
  const city = site.dev.address.city;
  return (
    <header className="site-header" data-header="">
      <div className="bar wrap">
        <a className="mark" href={href('home', l)}>
          <span className="name">{site.dev.title.replace(/^Residenza\s+/i, '')}</span>
          <span className="place">Castagnola{city ? ` · ${city}` : ''}</span>
        </a>
        <nav className="nav" aria-label={c('mainNav', l)}>
          <ul>
            {NAV.map((n) => <li key={n.key}><a href={href(n.key, l)} aria-current={active(n.key)}>{n.label}</a></li>)}
          </ul>
        </nav>
        <div className="tools">
          <a className="fav" href={href('compare', l)} data-fav-link="" hidden>
            {c('favourites', l)} <span className="count" data-fav-count="">0</span>
          </a>
          <ul className="langs" aria-label={c('language', l)}>
            {other.map((o) => (
              <li key={o.l}><a href={o.href} hrefLang={LOCALE[o.l]} lang={LOCALE[o.l]} aria-current={o.l === l ? 'true' : undefined}>{o.l.toUpperCase()}</a></li>
            ))}
          </ul>
          {pdf && (
            <a className="btn ghost brochure" href={pdf} download>
              <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 2v8m0 0 3.2-3.2M8 10 4.8 6.8M3 13h10" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
              {c('brochure', l)}
            </a>
          )}
          <button className="menu-btn" type="button" aria-expanded="false" aria-controls="menu" data-menu-btn="">
            <span className="sr-only">{c('menu', l)}</span>
            <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h16M4 15h16" stroke="currentColor" strokeWidth="1.5" fill="none" /></svg>
          </button>
        </div>
      </div>
      <div className="menu" id="menu" data-menu="">
        <nav aria-label={c('menu', l)}>
          <ul className="menu-list">
            <li><a href={href('home', l)} aria-current={route === 'home' ? 'page' : undefined}>{site.dev.title}</a></li>
            {NAV.map((n) => <li key={n.key}><a href={href(n.key, l)} aria-current={active(n.key)}>{n.label}</a></li>)}
          </ul>
          {pdf && <p className="menu-foot"><a className="btn ghost" href={pdf} download>{c('brochurePdf', l)}</a></p>}
        </nav>
      </div>
    </header>
  );
}
