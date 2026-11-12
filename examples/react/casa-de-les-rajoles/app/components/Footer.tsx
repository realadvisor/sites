/** Footer: a strip of the tile motif, address, sales office, pages, legal links. */
import { t as kt, lang as kitLang } from '@realadvisor/sites-kit/i18n';
import { LANGS, LOCALE_OF, href, tr, type Lang, type Route } from '../lib/i18n';
import { tel } from '../lib/docs';
import type { LayoutData } from '../root';
import { Tiles } from './Tiles';
import './Footer.css';

const PAGES: Route[] = ['units', 'plans', 'area', 'gallery', 'docs', 'contact'];

export function Footer({ site, lang, alternates }: { site: LayoutData; lang: Lang; alternates: { lang: string; href: string }[] }) {
  const { dev, org, team } = site;
  const t = tr(lang);
  const kl = kitLang(LOCALE_OF[lang]);
  const altOf = (l: Lang) => alternates.find((a) => a.lang === LOCALE_OF[l])?.href ?? href('home', l);
  const year = new Date().getFullYear();
  return (
    <footer className="ftr">
      <Tiles id="tiles-footer" size={24} />
      <div className="wrap grid">
        <div className="brand">
          <p className="name">{dev.title}</p>
          <p className="muted">{dev.address.street}<br />{dev.address.postcode} {dev.address.city}</p>
        </div>
        <div>
          <h2>{t.footerSales}</h2>
          <p>{org.name}</p>
          {org.address?.street && <p className="muted">{org.address.street}<br />{org.address.postcode} {org.address.city}</p>}
          <p className="contacts">
            {team?.phone && <a href={tel(team.phone)}>{team.phone}</a>}
            {team?.email && <a href={`mailto:${team.email}`}>{team.email}</a>}
          </p>
        </div>
        <nav aria-label={t.footerPages}>
          <h2>{t.footerPages}</h2>
          <ul>{PAGES.map((r) => <li key={r}><a href={href(r, lang)}>{t.nav[r as keyof typeof t.nav]}</a></li>)}</ul>
        </nav>
      </div>
      <div className="wrap base">
        <p>© {year} {site.developer ?? org.name}</p>
        <p className="links">
          <a href={href('legal', lang)}>{kt('legalNotice', {}, kl)}</a>
          <a href={href('privacy', lang)}>{kt('privacyPolicy', {}, kl)}</a>
          <span className="langs">{LANGS.map((l) => <a key={l} href={altOf(l)} hrefLang={LOCALE_OF[l]} lang={LOCALE_OF[l]} aria-current={l === lang ? 'true' : undefined}>{l.toUpperCase()}</a>)}</span>
        </p>
      </div>
    </footer>
  );
}
