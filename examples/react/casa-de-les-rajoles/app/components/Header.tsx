/**
 * Header: language codes left, the development's name centred, the dossier
 * right; the section nav on a second row (desktop). Phones: name and a menu
 * button that opens a sheet (app/client.ts: Escape and link clicks close it).
 */
import { Fragment } from 'react';
import { LANGS, LOCALE_OF, href, tr, type Lang, type Route } from '../lib/i18n';
import { docHref } from '../lib/docs';
import { Icon } from './Icon';
import './Header.css';

const NAV: Route[] = ['units', 'plans', 'area', 'gallery', 'docs', 'contact'];

export function Header({ title, lang, route, alternates }: { title: string; lang: Lang; route?: Route; alternates: { lang: string; href: string }[] }) {
  const t = tr(lang);
  const altOf = (l: Lang) => alternates.find((a) => a.lang === LOCALE_OF[l])?.href ?? href('home', l);
  const cur = (r: Route) => (r === route ? 'page' : undefined);
  return (
    <header className="hdr">
      <div className="top wrap">
        <nav className="langs" aria-label={t.langSwitch}>
          {LANGS.map((l, i) => (
            <Fragment key={l}>
              {i > 0 && <span aria-hidden="true">·</span>}
              <a href={altOf(l)} hrefLang={LOCALE_OF[l]} lang={LOCALE_OF[l]} aria-current={l === lang ? 'true' : undefined}>{l.toUpperCase()}</a>
            </Fragment>
          ))}
        </nav>
        <a className="mark" href={href('home', lang)} aria-label={`${title}, ${t.nav.home}`}>
          <span className="name">{title}</span>
          <span className="place">{t.place}</span>
        </a>
        <div className="right">
          <a className="cta ghost dossier" href={docHref('dossier', lang)}>{t.dossier} <span className="visually-hidden">(PDF)</span></a>
          <button className="burger" type="button" aria-expanded="false" aria-controls="menu" data-menu-open="">
            <Icon name="menu" size={24} /><span className="visually-hidden">{t.menu}</span>
          </button>
        </div>
      </div>
      <nav className="main wrap" aria-label={t.mainNav}>
        <ul>
          {NAV.map((r) => (
            <li key={r}><a href={href(r, lang)} aria-current={cur(r)}>{t.nav[r as keyof typeof t.nav]}</a></li>
          ))}
        </ul>
      </nav>
      <div className="sheet" id="menu" data-menu="">
        <div className="sheet-top">
          <span className="name">{title}</span>
          <button className="burger" type="button" data-menu-close=""><Icon name="close" size={24} /><span className="visually-hidden">{t.close}</span></button>
        </div>
        <nav aria-label={t.mainNav}>
          <ul>
            <li><a href={href('home', lang)} aria-current={route === 'home' ? 'page' : undefined}>{t.nav.home}</a></li>
            {NAV.map((r) => <li key={r}><a href={href(r, lang)} aria-current={cur(r)}>{t.nav[r as keyof typeof t.nav]}</a></li>)}
          </ul>
        </nav>
        <div className="sheet-foot">
          <a className="cta ghost" href={docHref('dossier', lang)}><Icon name="download" size={18} /> {t.dossierPdf}</a>
          <p className="langs">
            {LANGS.map((l) => <a key={l} href={altOf(l)} hrefLang={LOCALE_OF[l]} lang={LOCALE_OF[l]} aria-current={l === lang ? 'true' : undefined}>{l.toUpperCase()}</a>)}
          </p>
        </div>
      </div>
    </header>
  );
}
