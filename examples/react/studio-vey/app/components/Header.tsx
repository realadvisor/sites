/**
 * Three-zone header: spaced-caps links left and right, the wordmark centred.
 * Under 1080px: wordmark left, a menu button that opens a full-screen sheet
 * (behaviour: menu() in app/client.ts).
 */
import { useLocation } from 'react-router';
import './Header.css';

type Link = { href: string; label: string };
type Props = { brand: string; left: Link[]; right: Link[]; phone?: string };

export function Header({ brand, left, right, phone }: Props) {
  const path = useLocation().pathname.replace(/\/$/, '') || '/';
  const current = (href: string) => (path === href || (href !== '/' && path.startsWith(`${href}/`)) ? 'page' : undefined);
  const items = (links: Link[]) => links.map((l) => <li key={l.href}><a href={l.href} aria-current={current(l.href)}>{l.label}</a></li>);
  return (
    <header className="hd" data-header="">
      <div className="hd-in">
        <nav className="hd-nav hd-left" aria-label="Hauptnavigation"><ul>{items(left)}</ul></nav>
        <a className="hd-mark" href="/">{brand.split(/\s+/).map((w, i) => <span key={i}>{w}</span>)}</a>
        <nav className="hd-nav hd-right" aria-label="Weitere Seiten"><ul>{items(right)}</ul></nav>
        <button className="hd-toggle" type="button" aria-expanded="false" aria-controls="site-menu" data-menu-toggle="">
          <span className="hd-toggle-lines" aria-hidden="true"><span></span><span></span></span>
          <span className="sr-only">Menü</span>
        </button>
      </div>
      <div className="menu" id="site-menu" data-menu="">
        <nav className="menu-in wrap" aria-label="Menü">
          <ul className="menu-main">{items(left)}</ul>
          <ul className="menu-sub">{items(right)}</ul>
          {phone && <p className="menu-phone"><a className="more" href={`tel:${phone.replace(/\s+/g, '')}`}>{phone}</a></p>}
        </nav>
      </div>
    </header>
  );
}
