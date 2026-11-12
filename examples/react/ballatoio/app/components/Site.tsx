/**
 * Every page (the Astro version's Site.astro + Base.astro head): SEO tags,
 * skip link, the three-zone header (links, wordmark, links), the phone menu,
 * the footer with legal links in the page language. Header and footer data
 * come from the root loader; the menu script is in app/client.ts.
 */
import type { ReactNode } from 'react';
import { useLocation, useRouteLoaderData } from 'react-router';
import { Seo, useKit } from '@realadvisor/sites-kit-react/components/Document';
import { canonicalUrl } from '@realadvisor/sites-kit/seo';
import { t } from '@realadvisor/sites-kit/i18n';
import type { RootData } from '../root';
import { LANGS, LOCALE_OF, UI, href, type Lang, type Route } from '../lib/i18n';
import { telHref } from '../lib/format';
import './Site.css';

export type SiteProps = {
  lang: Lang;
  title: string;
  description: string;
  image?: string;
  jsonLd?: object | object[];
  noindex?: boolean;
  alternates?: { lang: string; href: string }[];
  /** The section this page belongs to (marks the nav link). */
  current?: Route;
  /** Language links go to the other home page (legal pages: check:deploy refuses a link to another language's legal page). */
  switchToHome?: boolean;
  children: ReactNode;
};

type NavKey = keyof (typeof UI)['it']['nav'];
const LEFT: NavKey[] = ['buy', 'rent', 'sell'];
const RIGHT: NavKey[] = ['areas', 'journal', 'contact'];
const MENU: NavKey[] = ['buy', 'rent', 'sell', 'sold', 'areas', 'team', 'about', 'journal', 'contact'];
const FOOT_HOMES: NavKey[] = ['buy', 'rent', 'sold', 'sell', 'areas'];
const FOOT_AGENCY: NavKey[] = ['about', 'team', 'journal', 'contact'];

const MenuIcon = () => (
  <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M3 8h18M3 16h18" /></svg>
);
const CloseIcon = () => (
  <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M5 5l14 14M19 5L5 19" /></svg>
);

export function Site({ lang, title, description, image, jsonLd, noindex, alternates, current, switchToHome = false, children }: SiteProps) {
  const data = useRouteLoaderData('root') as RootData | undefined;
  const kit = useKit();
  const { pathname, search } = useLocation();
  const canonical = canonicalUrl(new URL(pathname + search, kit.siteUrl), kit.siteUrl);
  const s = data?.site;
  const ui = UI[lang];
  const locale = LOCALE_OF[lang];
  const name = s?.name ?? '';
  const other = (l: Lang) => (switchToHome && l !== lang ? href('home', l) : alternates?.find((a) => a.lang === LOCALE_OF[l])?.href ?? href('home', l));
  const langLinks = () => LANGS.map((l) => (
    <a key={l} href={other(l)} hrefLang={LOCALE_OF[l]} lang={l} aria-current={l === lang ? 'true' : undefined}>{l.toUpperCase()}</a>
  ));
  const nav = (r: NavKey) => <a key={r} href={href(r, lang)} aria-current={current === r ? 'page' : undefined}>{ui.nav[r]}</a>;
  const addr = s?.address;
  const year = new Date().getFullYear();
  return (
    <>
      <Seo title={title} description={description} image={image || s?.ogImage} jsonLd={jsonLd} noindex={noindex} alternates={alternates} locale={locale} canonical={canonical} />
      <a className="skip" href="#main">{ui.skip}</a>
      <header className="hd">
        <div className="hd-in">
          <nav className="hd-nav hd-left" aria-label={ui.mainNav}>{LEFT.map(nav)}</nav>
          <a className="wordmark" href={href('home', lang)} aria-label={`${name}, ${ui.nav.home}`}>{name}</a>
          <div className="hd-right">
            <nav className="hd-nav" aria-label={ui.nav.areas}>{RIGHT.map(nav)}</nav>
            <p className="langs" aria-label={ui.langSwitch}>{langLinks()}</p>
            <button type="button" className="menu-btn" aria-expanded="false" aria-controls="menu" data-menu-open="">
              <span>{ui.menu}</span>
              <MenuIcon />
            </button>
          </div>
        </div>
      </header>

      <div id="menu" className="menu" data-menu="" role="dialog" aria-modal="true" aria-label={ui.menu}>
        <div className="menu-top">
          <a className="wordmark" href={href('home', lang)}>{name}</a>
          <button type="button" className="menu-btn is-close" data-menu-close="">
            <span>{ui.close}</span>
            <CloseIcon />
          </button>
        </div>
        <nav className="menu-nav" aria-label={ui.mainNav}>{MENU.map(nav)}</nav>
        <div className="menu-foot">
          {s?.phone && <a href={telHref(s.phone)}>{s.phone}</a>}
          {s?.email && <a href={`mailto:${s.email}`}>{s.email}</a>}
          <p className="langs">{langLinks()}</p>
        </div>
      </div>

      <main id="main" tabIndex={-1}>{children}</main>

      <footer className="ft on-dark">
        <div className="wrap ft-grid">
          <div className="ft-office">
            <p className="ft-name">{name}</p>
            {s?.description && <p className="ft-desc">{s.description.split('. ')[0]}.</p>}
          </div>
          <div>
            <h2 className="ft-h">{ui.footerOffice}</h2>
            {addr && <p>{addr.street}<br />{[addr.postcode, addr.city].filter(Boolean).join(' ')}</p>}
            <p className="ft-contacts">
              {s?.phone && <a href={telHref(s.phone)}>{s.phone}</a>}
              {s?.email && <a href={`mailto:${s.email}`}>{s.email}</a>}
            </p>
          </div>
          <nav aria-label={ui.footerHomes}>
            <h2 className="ft-h">{ui.footerHomes}</h2>
            <ul>{FOOT_HOMES.map((r) => <li key={r}><a href={href(r, lang)}>{ui.nav[r]}</a></li>)}</ul>
          </nav>
          <nav aria-label={ui.footerAgency}>
            <h2 className="ft-h">{ui.footerAgency}</h2>
            <ul>{FOOT_AGENCY.map((r) => <li key={r}><a href={href(r, lang)}>{ui.nav[r]}</a></li>)}</ul>
          </nav>
        </div>
        <div className="wrap ft-base">
          <p>© {year} {s?.orgName}</p>
          <p className="ft-legal">
            <a href={href('legal', lang)}>{t('legalNotice', {}, lang)}</a>
            <a href={href('privacy', lang)}>{t('privacyPolicy', {}, lang)}</a>
            <span className="langs">{langLinks()}</span>
          </p>
        </div>
      </footer>
    </>
  );
}
