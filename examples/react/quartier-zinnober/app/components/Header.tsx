/** Sticky header with the main navigation; under 1080px a full-screen menu (app/client.ts: menu()). */
import { useLocation } from 'react-router';
import { Icon } from './Icon';
import { Wordmark } from './Wordmark';
import './Header.css';

const NAV = [
  { href: '/wohnungen', label: 'Wohnungen' },
  { href: '/lage', label: 'Lage' },
  { href: '/galerie', label: 'Galerie' },
  { href: '/news', label: 'Baustelle' },
  { href: '/dokumente', label: 'Dokumente' },
];

/** `available`: units available right now, from the development's stats. */
export function Header({ available }: { available?: number }) {
  const current = useLocation().pathname;
  const isCurrent = (href: string) => current === href || current.startsWith(`${href}/`);
  const cur = (href: string) => (isCurrent(href) ? ('page' as const) : undefined);
  return (
    <header className="site-header" data-header="">
      <div className="bar wrap">
        <a className="brand" href="/" aria-label="Quartier Zinnober, Startseite"><Wordmark /></a>
        <nav className="nav" aria-label="Hauptnavigation">
          <ul>
            {NAV.map((n) => <li key={n.href}><a href={n.href} aria-current={cur(n.href)}>{n.label}</a></li>)}
          </ul>
        </nav>
        <div className="actions">
          <a className="cta cta--zinnober cta--sm" href="/kontakt" aria-current={cur('/kontakt')}>
            Interesse anmelden
            {available != null && available > 0 && <span className="count num" aria-label={`${available} Wohnungen frei`}>{available} frei</span>}
          </a>
          <button className="menu-btn" type="button" aria-expanded="false" aria-controls="menu" data-menu-open="">
            <Icon name="menu" size={26} /><span className="visually-hidden">Menü öffnen</span>
          </button>
        </div>
      </div>
      <div className="sheet" id="menu" data-menu="" role="dialog" aria-modal="true" aria-label="Menü">
        <div className="sheet-bar wrap">
          <a className="brand" href="/" aria-label="Quartier Zinnober, Startseite"><Wordmark /></a>
          <button className="menu-btn" type="button" data-menu-close=""><Icon name="close" size={28} /><span className="visually-hidden">Menü schliessen</span></button>
        </div>
        <nav className="wrap sheet-nav" aria-label="Menü">
          <ul>
            <li><a href="/">Start</a></li>
            {NAV.map((n) => <li key={n.href}><a href={n.href} aria-current={cur(n.href)}>{n.label}</a></li>)}
            <li><a href="/kontakt" aria-current={cur('/kontakt')}>Kontakt</a></li>
          </ul>
          <a className="cta cta--ink" href="/kontakt">Interesse anmelden <Icon name="arrow" /></a>
        </nav>
      </div>
    </header>
  );
}
