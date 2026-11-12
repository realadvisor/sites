/**
 * The site frame on every page (the Astro version's Site.astro + Base.astro
 * head): SEO tags, header, <main id="main">, footer. Pages pass their route
 * key and segments; the language switch and hreflang alternates come from
 * the same table (lib/routes.ts). Header and footer data come from the root loader.
 */
import type { ReactNode } from 'react';
import { useLocation, useRouteLoaderData } from 'react-router';
import type { Team } from '@realadvisor/sites-sdk/types';
import { Seo, useKit } from '@realadvisor/sites-kit-react/components/Document';
import { canonicalUrl } from '@realadvisor/sites-kit-core/seo';
import { Header } from './Header';
import { Footer } from './Footer';
import { alternates, href, LANGS, LOCALE, type L, type RouteKey } from '../lib/routes';
import './Site.css';

export type LayoutOrg = { name: string };
export type LayoutTeam = Pick<Team, 'id' | 'name' | 'address' | 'phone' | 'email'>;
export type LayoutData = { org: LayoutOrg; teams: LayoutTeam[]; ogImage?: string };

type Props = {
  l: L;
  title: string;
  description: string;
  image?: string;
  jsonLd?: object | object[];
  noindex?: boolean;
  route: RouteKey;
  segs?: string[];
  section?: RouteKey;
  /** Explicit per-language paths when they differ (404). */
  switchTo?: Record<L, string>;
  /** Header over the hero photo (home). */
  overlay?: boolean;
  /** Extra bottom space on phones for a sticky action bar. */
  barSpace?: boolean;
  children: ReactNode;
};

export function Site({ l, title, description, image, jsonLd, noindex, route, segs = [], section = route, overlay = false, barSpace = false, children, ...rest }: Props) {
  const data = useRouteLoaderData('root') as { layout?: LayoutData } | undefined;
  const layout = data?.layout ?? { org: { name: '' }, teams: [] };
  const kit = useKit();
  const { pathname, search } = useLocation();
  const canonical = canonicalUrl(new URL(pathname + search, kit.siteUrl), kit.siteUrl);
  // Kit gap: check:deploy reads a language-switch link from /legal to /fr/legal as a
  // legal link in the wrong language, so on legal pages the switch goes to the other home.
  const legalPage = route === 'legal' || route === 'privacy';
  const switchTo = rest.switchTo ?? (Object.fromEntries(LANGS.map((x) => [x, x === l || !legalPage ? href(route, x, ...segs) : href('home', x)])) as Record<L, string>);
  const alts = rest.switchTo ? undefined : alternates(route, ...segs);
  return (
    <>
      <Seo title={title} description={description} image={image || layout.ogImage} jsonLd={jsonLd} noindex={noindex} alternates={alts}
        locale={LOCALE[l]} canonical={canonical} themeColor="#121110" />
      <Header l={l} org={layout.org} section={section} switchTo={switchTo} overlay={overlay} />
      <main id="main" tabIndex={-1} className={barSpace ? 'bar-space' : undefined}>{children}</main>
      <Footer l={l} org={layout.org} teams={layout.teams} />
    </>
  );
}
