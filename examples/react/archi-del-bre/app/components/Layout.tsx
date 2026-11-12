/**
 * Site shell (the Astro version's Base.astro + Site.astro): SEO head tags,
 * skip link, header, footer, phone action bar. Every page renders through it;
 * the site data comes from the root loader. `scope` is the page's class on
 * <main>: its stylesheet is written under it (the Astro <style> scoping).
 */
import type { ReactNode } from 'react';
import { useLocation, useRouteLoaderData } from 'react-router';
import { Seo, useKit } from '@realadvisor/sites-kit-react/components/Document';
import { canonicalUrl } from '@realadvisor/sites-kit-core/seo';
import type { RootData } from '../root';
import { Header, type PageRoute } from './Header';
import { Footer } from './Footer';
import { alternates as alts, href, LOCALE, type L } from '../lib/routes';
import { c } from '../lib/copy';
import './Layout.css';

type Alt = { lang: string; href: string };

export type LayoutProps = {
  l: L;
  /** Route key: nav state and, without `alternates`, the language versions. */
  route: PageRoute;
  /** The page's class on <main> (its stylesheet's scope). */
  scope: string;
  alternates?: Alt[];
  title: string;
  description: string;
  /** Absolute URL, ~1200x630: the page's main photo. */
  image?: string;
  jsonLd?: object | object[];
  noindex?: boolean;
  /** Hide the phone action bar (pages with their own form). */
  bar?: boolean;
  children: ReactNode;
};

export function Layout({ l, route, scope, title, description, image, jsonLd, noindex, bar = true, children, ...p }: LayoutProps) {
  const site = (useRouteLoaderData('root') as RootData | undefined)?.site;
  const kit = useKit();
  const { pathname, search } = useLocation();
  const canonical = canonicalUrl(new URL(pathname + search, kit.siteUrl), kit.siteUrl);
  const alternates = p.alternates ?? (route === 'unit' || route === '404' ? undefined : alts(route));
  // Kit gap: check:deploy fails a legal page that links the other language's legal page,
  // so there the language switch goes to the other language's home (hreflang stays in <head>).
  const switchTo = route === 'legal' || route === 'privacy' ? undefined : alternates;
  return (
    <>
      <Seo title={title} description={description} image={image} jsonLd={jsonLd} noindex={noindex} alternates={alternates} locale={LOCALE[l]} canonical={canonical} themeColor="#f6f1e8" />
      <a className="skip" href="#main">{c('skip', l)}</a>
      {site && <Header site={site} l={l} route={route} alternates={switchTo} />}
      <main id="main" tabIndex={-1} className={`main ${scope}`}>{children}</main>
      {site && <Footer site={site} l={l} alternates={switchTo} />}
      {bar && (
        <nav className="phone-bar" aria-label={c('quick', l)}>
          <a href={href('units', l)}>{c('units', l)}</a>
          <a href={href('contact', l)} className="primary">{c('writeUs', l)}</a>
        </nav>
      )}
    </>
  );
}
