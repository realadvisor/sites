/**
 * Three-zone header: links left, wordmark centred, brochure + contact right.
 * `overlay`: transparent over the home hero (a scrim keeps it readable).
 * Phone: wordmark and a menu button (44x44, Escape closes, scroll locked).
 * Behaviour: header() in app/client.ts.
 */
import { useLocation } from 'react-router';
import { NAV, CONTACT, BROCHURE } from '../lib/nav';
import './Header.css';

export function Header({ title, city, overlay = false }: { title: string; city?: string | null; overlay?: boolean }) {
  const path = useLocation().pathname.replace(/\/$/, '') || '/';
  const current = (href: string) => (path === href || path.startsWith(`${href}/`) ? 'page' : undefined);
  return (
    <header className={['site-header', overlay && 'overlay'].filter(Boolean).join(' ')} data-header="">
      <div className="bar wrap">
        <nav className="left" aria-label="Navigation principale">
          <ul>
            {NAV.slice(0, 3).map((n) => <li key={n.href}><a href={n.href} aria-current={current(n.href)}>{n.label}</a></li>)}
          </ul>
        </nav>
        <a className="mark" href="/">
          <span className="name">{title}</span>
          {city && <span className="city">{city}</span>}
        </a>
        <div className="right">
          <a href={NAV[3].href} className="text" aria-current={current(NAV[3].href)}>{NAV[3].label}</a>
          <a href={CONTACT.href} className="cta" aria-current={current(CONTACT.href)}>Nous contacter</a>
          <button className="menu-btn" type="button" aria-expanded="false" aria-controls="menu" data-menu-btn="">
            <span className="sr-only">Menu</span>
            <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 8h18M3 16h18" stroke="currentColor" strokeWidth="1.4" fill="none" /></svg>
          </button>
        </div>
      </div>
      <div className="menu" id="menu" data-menu="">
        <nav aria-label="Menu">
          <ul>
            {[...NAV, CONTACT].map((n) => <li key={n.href}><a href={n.href} aria-current={current(n.href)}>{n.label}</a></li>)}
          </ul>
          <p className="menu-foot">
            <a href={BROCHURE} download>Télécharger la brochure (PDF)</a>
          </p>
        </nav>
      </div>
    </header>
  );
}
