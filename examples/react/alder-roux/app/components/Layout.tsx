/**
 * The site frame on every page (Base.astro + Site.astro of the Astro
 * version): SEO head, header, <main id="main">, footer. Pages pass their
 * language, route key and segments; the language switch and hreflang
 * alternates come from the same table (app/lib/routes.ts). Header and
 * footer data come from the root loader.
 */
import type { ReactNode } from 'react';
import { useLocation, useRouteLoaderData } from 'react-router';
import { Seo, useKit } from '@realadvisor/sites-kit-react/components/Document';
import { canonicalUrl } from '@realadvisor/sites-kit-core/seo';
import type { RootData } from '../root';
import { Header } from './Header';
import { Footer } from './Footer';
import { alternates, href, LANGS, LOCALE, type L, type RouteKey } from '../lib/routes';
import './Layout.css';

export type PageProps = {
  l: L;
  title: string;
  description: string;
  /** Absolute URL, ~1200x630: the page's main photo. Default: the newest listing's photo. */
  image?: string;
  jsonLd?: object | object[];
  noindex?: boolean;
  /** Route of this page, for the language switch and hreflang. */
  route: RouteKey;
  segs?: string[];
  /** Header section to mark current (default: route). */
  section?: RouteKey;
  /** Explicit per-language paths when they differ (404). */
  switchTo?: Record<L, string>;
  children: ReactNode;
};

export function Layout({ l, title, description, image, jsonLd, noindex, route, segs = [], section = route, children, ...rest }: PageProps) {
  const data = useRouteLoaderData('root') as RootData | undefined;
  const kit = useKit();
  const { pathname, search } = useLocation();
  const canonical = canonicalUrl(new URL(pathname + search, kit.siteUrl), kit.siteUrl);
  // Kit gap (as on the Astro version): check:deploy reads a language-switch link from /legal to /de/legal as a
  // legal link in the wrong language, so on legal pages the switch goes to the other home.
  const legalPage = route === 'legal' || route === 'privacy';
  const switchTo = rest.switchTo ?? (Object.fromEntries(LANGS.map((x) => [x, x === l || !legalPage ? href(route, x, ...segs) : href('home', x)])) as Record<L, string>);
  const alts = rest.switchTo ? undefined : alternates(route, ...segs);
  const s = data?.layout;
  return (
    <>
      <Seo title={title} description={description} image={image || s?.ogImage} jsonLd={jsonLd} noindex={noindex} alternates={alts} locale={LOCALE[l]} canonical={canonical} themeColor="#1f3a5f" />
      {s && <Header l={l} org={s.org} teams={s.teams} section={section} switchTo={switchTo} hasDevelopments={s.hasDevelopments} />}
      <main id="main" tabIndex={-1}>{children}</main>
      {s && <Footer l={l} org={s.org} teams={s.teams} areas={s.areas} switchTo={switchTo} hasDevelopments={s.hasDevelopments} />}
    </>
  );
}
