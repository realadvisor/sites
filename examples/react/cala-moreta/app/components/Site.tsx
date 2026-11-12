/**
 * Site shell (the Astro version's Base.astro + Site.astro): SEO head, skip
 * link, header (three zones, language switch, phone menu), main, footer with
 * the legal links of the page language. Agency data come from the root loader.
 */
import { Fragment, type ReactNode } from 'react';
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
  /** Absolute URL, ~1200x630: the page's main photo. */
  image?: string;
  jsonLd?: object | object[];
  noindex?: boolean;
  /** Every language version of this page (hreflang, language switch). */
  alternates?: { lang: string; href: string }[];
  /** Header over the first photo (home, area pages). */
  overlay?: boolean;
  current?: Route;
  /**
   * Legal pages: the language switch goes to the other language's home, since
   * check:deploy fails any link from one language to the other's legal page.
   */
  switchToHome?: boolean;
  children: ReactNode;
};

const LEFT: Route[] = ['buy', 'rent', 'sell', 'areas'];
const RIGHT: Route[] = ['team', 'about', 'blog', 'contact'];

export function Site({ lang, title, description, image, jsonLd, noindex, alternates, overlay = false, current, switchToHome = false, children }: SiteProps) {
  const data = useRouteLoaderData('root') as RootData | undefined;
  const kit = useKit();
  const { pathname, search } = useLocation();
  const canonical = canonicalUrl(new URL(pathname + search, kit.siteUrl), kit.siteUrl);
  const ui = UI[lang];
  const s = data?.site;
  const name = s?.name ?? '';
  const locale = LOCALE_OF[lang];
  const label = (r: Route) => (ui.nav as Record<string, string>)[r] ?? r;
  const other = (l: Lang) => (switchToHome && l !== lang ? undefined : alternates?.find((a) => a.lang === LOCALE_OF[l])?.href) ?? href('home', l);
  const year = new Date().getFullYear();
  const addr = s?.addr;
  const cur = (r: Route) => (current === r ? 'page' : undefined);
  const langLinks = LANGS.map((l, i) => (
    <Fragment key={l}>
      {i > 0 && <span aria-hidden="true">·</span>}
      <a href={other(l)} hrefLang={LOCALE_OF[l]} lang={l} aria-current={l === lang ? 'true' : undefined}>{l.toUpperCase()}</a>
    </Fragment>
  ));
  return (
    <>
      <Seo title={title} description={description} image={image} jsonLd={jsonLd} noindex={noindex} alternates={alternates} locale={locale} canonical={canonical} themeColor="#f6f0e7" />
      <a className="skip" href="#main">{ui.skip}</a>
      <header className={['hdr', overlay && 'hdr-overlay'].filter(Boolean).join(' ')} data-header="">
        <div className="hdr-in">
          <nav className="hdr-nav hdr-left" aria-label={ui.mainNav}>
            {LEFT.map((r) => <a key={r} href={href(r, lang)} aria-current={cur(r)}>{label(r)}</a>)}
          </nav>
          <a className="mark" href={href('home', lang)}>
            <span className="mark-name">{name}</span>
            {addr?.city && <span className="mark-sub">{addr.city} · Costa Brava</span>}
          </a>
          <div className="hdr-right">
            <nav className="hdr-nav" aria-label={ui.nav.about}>
              {RIGHT.map((r) => <a key={r} href={href(r, lang)} aria-current={cur(r)}>{label(r)}</a>)}
            </nav>
            <nav className="langs" aria-label={ui.langSwitch}>{langLinks}</nav>
            <button className="menu-btn" type="button" aria-expanded="false" aria-controls="site-menu" aria-label={ui.menu} data-menu-open="">
              <span className="menu-lines" aria-hidden="true"><span></span><span></span></span>
              <span className="menu-label">{ui.menu}</span>
            </button>
          </div>
        </div>
      </header>

      <div className="menu" id="site-menu" data-menu="" role="dialog" aria-modal="true" aria-label={ui.menu}>
        <div className="menu-top">
          <span className="mark-name">{name}</span>
          <button className="menu-close" type="button" data-menu-close="" aria-label={ui.close}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M5 5l14 14M19 5 5 19" /></svg>
          </button>
        </div>
        <nav className="menu-nav" aria-label={ui.mainNav}>
          {[...LEFT, 'sold' as Route, ...RIGHT].map((r) => <a key={r} href={href(r, lang)} aria-current={cur(r)}>{label(r)}</a>)}
        </nav>
        <div className="menu-foot">
          <nav className="langs" aria-label={ui.langSwitch}>{langLinks}</nav>
          {s?.phone && <a className="num" href={telHref(s.phone)}>{s.phone}</a>}
          {s?.email && <a href={`mailto:${s.email}`}>{s.email}</a>}
        </div>
      </div>

      <main id="main" tabIndex={-1}>{children}</main>

      <footer className="ftr">
        <div className="wrap ftr-grid">
          <div className="ftr-brand">
            <a className="ftr-mark" href={href('home', lang)}>{name}</a>
            <p>{ui.footerTag}</p>
          </div>
          <div>
            <h2 className="ftr-h">{ui.footerVisit}</h2>
            {addr && (
              <address>
                {addr.street && <>{addr.street}<br /></>}
                {[addr.postcode, addr.city].filter(Boolean).join(' ')}
              </address>
            )}
            <p className="ftr-contact">
              {s?.phone && <a className="num" href={telHref(s.phone)}>{s.phone}</a>}
              {s?.email && <a href={`mailto:${s.email}`}>{s.email}</a>}
            </p>
          </div>
          <div>
            <h2 className="ftr-h">{ui.footerExplore}</h2>
            <ul>
              {(['buy', 'rent', 'sell', 'sold', 'areas'] as Route[]).map((r) => <li key={r}><a href={href(r, lang)}>{label(r)}</a></li>)}
            </ul>
          </div>
          <div>
            <h2 className="ftr-h">{ui.footerAgency}</h2>
            <ul>
              {(['team', 'about', 'blog', 'contact'] as Route[]).map((r) => <li key={r}><a href={href(r, lang)}>{label(r)}</a></li>)}
            </ul>
          </div>
        </div>
        <div className="wrap ftr-base">
          <p>© {year} {s?.orgName}</p>
          <p className="ftr-legal">
            <a href={href('legal', lang)}>{t('legalNotice', {}, lang)}</a>
            <a href={href('privacy', lang)}>{t('privacyPolicy', {}, lang)}</a>
            <span className="langs">{langLinks}</span>
          </p>
        </div>
      </footer>
    </>
  );
}
