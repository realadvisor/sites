/**
 * Site layout: SEO head (the Astro version's Base.astro), skip link, header,
 * main, footer. Every page renders its content inside it. Header and footer
 * data come from the root loader.
 */
import type { ReactNode } from 'react';
import { useLocation, useRouteLoaderData } from 'react-router';
import { Seo, useKit } from '@realadvisor/sites-kit-react/components/Document';
import { canonicalUrl } from '@realadvisor/sites-kit/seo';
import { LOCALE } from '@realadvisor/sites-kit/format';
import { legalPath, privacyPath, t } from '@realadvisor/sites-kit/i18n';
import type { RootData } from '../root';
import { Header } from './Header';
import { areaUrl } from '../lib/urls';
import { telHref } from '../lib/format';
import './Layout.css';

export const LEFT = [
  { href: '/kaufen', label: 'Kaufen' },
  { href: '/mieten', label: 'Mieten' },
  { href: '/verkaufen', label: 'Verkaufen' },
  { href: '/verkauft', label: 'Verkauft' },
];
export const RIGHT = [
  { href: '/team', label: 'Team' },
  { href: '/ueber-uns', label: 'Über uns' },
  { href: '/journal', label: 'Journal' },
  { href: '/kontakt', label: 'Kontakt' },
];

export type PageMeta = {
  title: string;
  description: string;
  /** Absolute URL, ~1200x630: the page's main photo. Default: the logo or the newest listing's photo. */
  image?: string;
  jsonLd?: object | object[];
  noindex?: boolean;
};

export function Layout({ children, ...meta }: PageMeta & { children: ReactNode }) {
  const data = useRouteLoaderData('root') as RootData | undefined;
  const kit = useKit();
  const { pathname, search } = useLocation();
  const canonical = canonicalUrl(new URL(pathname + search, kit.siteUrl), kit.siteUrl);
  const s = data?.layout;
  const a = s?.team.address;
  const year = new Date().getFullYear();
  return (
    <>
      <Seo {...meta} image={meta.image || s?.ogImage} canonical={canonical} locale={LOCALE} themeColor="#faf8f4" />
      <a className="skip" href="#main">Zum Inhalt springen</a>
      <Header brand={s?.brand ?? ''} left={LEFT} right={RIGHT} phone={s?.team.phone} />
      <main id="main" tabIndex={-1}>{children}</main>
      {s && a && (
        <footer className="ft on-accent">
          <div className="wrap ft-grid">
            <div className="ft-brand">
              <p className="ft-mark">{s.brand}</p>
              {s.team.description_text && <p className="ft-about">{s.team.description_text}</p>}
            </div>
            <div className="ft-contact">
              <h2 className="ft-h">Kontakt</h2>
              <address>
                {a.street && <span>{a.street}</span>}
                {(a.postcode || a.city) && <span>{[a.postcode, a.city].filter(Boolean).join(' ')}</span>}
              </address>
              <ul className="ft-list">
                {s.team.phone && <li><a href={telHref(s.team.phone)}>{s.team.phone}</a></li>}
                {s.team.email && <li><a href={`mailto:${s.team.email}`}>{s.team.email}</a></li>}
              </ul>
            </div>
            <nav aria-label="Angebot">
              <h2 className="ft-h">Angebot</h2>
              <ul className="ft-list">{LEFT.map((l) => <li key={l.href}><a href={l.href}>{l.label}</a></li>)}</ul>
            </nav>
            <nav aria-label="Studio">
              <h2 className="ft-h">Studio</h2>
              <ul className="ft-list">{RIGHT.map((l) => <li key={l.href}><a href={l.href}>{l.label}</a></li>)}</ul>
            </nav>
            {s.places.length > 0 && (
              <nav aria-label="Orte">
                <h2 className="ft-h">Orte</h2>
                <ul className="ft-list">{s.places.map((p) => <li key={p.slug}><a href={areaUrl(p.city)}>{p.city}</a></li>)}</ul>
              </nav>
            )}
          </div>
          <div className="wrap"><div className="ft-base">
            <p>© {year} {s.orgName}</p>
            <ul className="ft-legal">
              <li><a href={legalPath()}>{t('legalNotice')}</a></li>
              <li><a href={privacyPath()}>{t('privacyPolicy')}</a></li>
            </ul>
          </div></div>
        </footer>
      )}
    </>
  );
}
