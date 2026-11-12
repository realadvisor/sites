/**
 * Every page (the Astro version's layouts/Site.astro + Base.astro): SEO head,
 * skip link, header, main, footer. Header and footer data come from the root
 * loader. `page` names the page on <main> (`p-<page>`): the page's CSS is
 * scoped under it, as Astro scoped it to the page.
 */
import type { ReactNode } from 'react';
import { useLocation, useRouteLoaderData } from 'react-router';
import { Seo, useKit } from '@realadvisor/sites-kit-react/components/Document';
import { canonicalUrl } from '@realadvisor/sites-kit/seo';
import type { RootData } from '../root';
import { Header } from './Header';
import { Footer } from './Footer';

export type PageMeta = {
  title: string;
  description: string;
  /** Absolute URL, ~1200x630: the page's main photo. */
  image?: string;
  jsonLd?: object | object[];
  noindex?: boolean;
};

export function Layout({ children, page, ...meta }: PageMeta & { page: string; children: ReactNode }) {
  const data = useRouteLoaderData('root') as RootData | undefined;
  const kit = useKit();
  const { pathname, search } = useLocation();
  const canonical = canonicalUrl(new URL(pathname + search, kit.siteUrl), kit.siteUrl);
  const s = data?.layout;
  return (
    <>
      <Seo {...meta} canonical={canonical} locale="de-CH" themeColor="#E4572E" />
      <a className="skip" href="#main">Zum Inhalt springen</a>
      <Header available={s?.available} />
      <main id="main" tabIndex={-1} className={`p-${page}`}>{children}</main>
      {s && <Footer site={s} />}
    </>
  );
}
