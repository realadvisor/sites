/**
 * Fixed header over the page: transparent with a scrim over the hero, solid
 * once the page scrolls (CSS scroll timeline, no JS). Mobile: a full-screen
 * menu (button with aria-expanded, Escape and link click close it, body
 * scroll locked while open: menu() in app/client.ts).
 */
import type { ProgrammeLink } from '../root';
import { programmeUrl, PROGRAMMES_PATH } from '../lib/fr';
import { Wordmark } from './Wordmark';
import './Header.css';

const LINKS = [
  { href: PROGRAMMES_PATH, label: 'Nos programmes', key: 'programmes' },
  { href: '/a-propos', label: 'À propos', key: 'about' },
];

export function Header({ name, programmes, current }: { name: string; programmes: ProgrammeLink[]; current?: string }) {
  return (
    <header className="site-header" data-header="">
      <div className="sh-bar">
        <a className="sh-home" href="/" aria-label={`${name}, accueil`}><Wordmark name={name} /></a>
        <nav className="sh-nav" aria-label="Navigation principale">
          <ul>
            {LINKS.map((l) => <li key={l.key}><a href={l.href} aria-current={current === l.key ? 'page' : undefined}>{l.label}</a></li>)}
          </ul>
        </nav>
        <a className="sh-cta" href="/contact" aria-current={current === 'contact' ? 'page' : undefined}>Nous contacter</a>
        <button className="sh-burger" type="button" aria-expanded="false" aria-controls="menu" data-menu-open="">
          <span className="sr-only">Menu</span>
          <span className="sh-lines" aria-hidden="true"></span>
        </button>
      </div>
      <div className="sh-menu" id="menu" data-menu="">
        <nav aria-label="Menu" className="sh-menu-inner">
          <p className="sh-menu-h">Nos programmes</p>
          <ul className="sh-menu-programmes">
            {programmes.map((d) => (
              <li key={d.id}><a href={programmeUrl(d)}><span className="sh-mp-title">{d.title}</span><span className="sh-mp-city">{d.address.city}</span></a></li>
            ))}
          </ul>
          <ul className="sh-menu-links">
            <li><a href={PROGRAMMES_PATH}>Tous nos programmes</a></li>
            <li><a href="/a-propos">À propos</a></li>
            <li><a href="/contact">Nous contacter</a></li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
