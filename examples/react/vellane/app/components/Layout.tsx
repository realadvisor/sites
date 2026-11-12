/**
 * The site frame (the Astro version's Base.astro + Site.astro): SEO head,
 * skip link, sticky header (nav, favourites, phone menu), main, footer with
 * the agencies. Every page renders through it; header and footer data come
 * from the root loader. Behaviour: menu() and saved() in app/client.ts.
 */
import type { ReactNode } from 'react';
import { useLocation, useRouteLoaderData } from 'react-router';
import { Seo, useKit } from '@realadvisor/sites-kit-react/components/Document';
import { canonicalUrl } from '@realadvisor/sites-kit/seo';
import { t as kt } from '@realadvisor/sites-kit/i18n';
import type { RootData } from '../root';
import { Icon } from './Icon';
import { R, searchUrl, teamHref, teamShortName, tel } from '../lib/site';
import './Layout.css';

export type Nav = 'buy' | 'rent' | 'sell' | 'agencies' | 'team' | 'saved' | 'none';

export type PageMeta = {
  title: string;
  description: string;
  /** Absolute URL, ~1200x630: the page's main photo. Default: the newest listing's photo. */
  image?: string;
  jsonLd?: object | object[];
  noindex?: boolean;
  nav?: Nav;
  /** Extra bottom padding on phones for a page's own sticky bar. */
  stickyBar?: boolean;
};

export function Layout({ children, nav = 'none', stickyBar, ...meta }: PageMeta & { children: ReactNode }) {
  const data = useRouteLoaderData('root') as RootData | undefined;
  const kit = useKit();
  const { pathname, search } = useLocation();
  const canonical = canonicalUrl(new URL(pathname + search, kit.siteUrl), kit.siteUrl);
  const s = data?.layout;
  const orgName = s?.orgName ?? '';
  const brand = orgName.replace(/\s+(SAS|SA|SARL|SASU)$/i, '');
  const [word, ...rest] = brand.split(' ');
  const links: { key: Nav; label: string; href: string }[] = [
    { key: 'buy', label: 'Acheter', href: searchUrl('buy') },
    { key: 'rent', label: 'Louer', href: searchUrl('rent') },
    { key: 'sell', label: 'Vendre', href: R.sell },
    { key: 'agencies', label: 'Agences', href: R.agencies },
    { key: 'team', label: 'Équipe', href: R.team },
  ];
  const cur = (k: Nav) => (nav === k ? 'page' : undefined);
  const year = new Date().getFullYear();
  const mark = (
    <>
      <span className="logo__word">{word}</span>
      {rest.length > 0 && <span className="logo__rest">{rest.join(' ')}</span>}
    </>
  );
  return (
    <>
      <Seo {...meta} image={meta.image || s?.ogImage} canonical={canonical} locale="fr-FR" themeColor="#ffffff" />
      <a className="skip" href="#main">Aller au contenu</a>
      <header className="hd">
        <div className="wrap hd__in">
          <a className="logo" href={R.home} aria-label={`${orgName}, accueil`}>{mark}</a>
          <nav className="hd__nav" aria-label="Navigation principale">
            <ul>{links.map((x) => <li key={x.key}><a href={x.href} aria-current={cur(x.key)}>{x.label}</a></li>)}</ul>
          </nav>
          <div className="hd__tools">
            <a className="hd__saved" href={R.saved} aria-current={cur('saved')}>
              <Icon name="heart" />
              <span className="hd__saved-label">Favoris</span>
              <span className="hd__count" data-saved-count="" hidden></span>
            </a>
            <a className="vb vb--ghost hd__cta" href={R.sell}>Estimer mon bien</a>
            <button type="button" className="hd__menu" data-menu-btn="" aria-expanded="false" aria-controls="menu" aria-label="Ouvrir le menu">
              <Icon name="menu" size={22} />
            </button>
          </div>
        </div>
        <div className="menu" id="menu" data-menu="">
          <nav className="menu__panel" aria-label="Menu">
            <ul>
              {links.map((x) => <li key={x.key}><a href={x.href} aria-current={cur(x.key)}>{x.label}</a></li>)}
              <li><a href={R.sold}>Biens vendus</a></li>
              <li><a href={R.about}>À propos</a></li>
              <li><a href={R.contact}>Contact</a></li>
            </ul>
            <a className="vb menu__cta" href={R.sell}>Estimer mon bien</a>
          </nav>
        </div>
      </header>

      <main id="main" className={stickyBar ? 'has-bar' : undefined} tabIndex={-1}>{children}</main>

      <footer className="ft">
        <div className="wrap">
          <div className="ft__top">
            <p className="ft__brand">{mark}</p>
            <nav className="ft__links" aria-label="Pied de page">
              <a href={searchUrl('buy')}>Acheter</a>
              <a href={searchUrl('rent')}>Louer</a>
              <a href={R.sell}>Estimer mon bien</a>
              <a href={R.sold}>Biens vendus</a>
              <a href={R.cities}>Villes</a>
              <a href={R.about}>À propos</a>
              <a href={R.contact}>Contact</a>
            </nav>
          </div>
          <ul className="ft__agencies">
            {(s?.teams ?? []).map((tm) => (
              <li key={tm.id}>
                <a className="ft__agency" href={teamHref(tm)}>{teamShortName(tm)}</a>
                <address>
                  {tm.address.street && <span>{tm.address.street}</span>}
                  <span>{[tm.address.postcode, tm.address.city].filter(Boolean).join(' ')}</span>
                  {tm.phone && <a href={tel(tm.phone)}>{tm.phone}</a>}
                </address>
              </li>
            ))}
          </ul>
          <div className="ft__legal">
            <span>© {year} {orgName}</span>
            <a href={R.legal}>{kt('legalNotice', {}, 'fr')}</a>
            <a href={R.privacy}>{kt('privacyPolicy', {}, 'fr')}</a>
          </div>
        </div>
      </footer>
    </>
  );
}
