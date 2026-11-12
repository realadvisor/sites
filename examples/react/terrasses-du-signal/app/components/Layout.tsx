/**
 * Site shell (the Astro version's Base.astro + Site.astro): SEO head, skip
 * link, header, main, footer, phone action bar. Every page renders its
 * content inside it; header and footer data come from the root loader.
 */
import type { ReactNode } from 'react';
import { useLocation, useRouteLoaderData } from 'react-router';
import { Seo, useKit } from '@realadvisor/sites-kit-react/components/Document';
import { canonicalUrl } from '@realadvisor/sites-kit/seo';
import { LOCALE } from '@realadvisor/sites-kit/format';
import type { RootData } from '../root';
import { Header } from './Header';
import { Footer } from './Footer';
import './Layout.css';

export type PageMeta = {
  title: string;
  description: string;
  /** Absolute URL, ~1200x630: the page's main photo. */
  image?: string;
  jsonLd?: object | object[];
  noindex?: boolean;
  /** Header over the hero photo (home). */
  overlay?: boolean;
  /** Hide the phone action bar (contact page has its own form). */
  bar?: boolean;
};

export function Layout({ children, overlay = false, bar = true, ...meta }: PageMeta & { children: ReactNode }) {
  const data = useRouteLoaderData('root') as RootData | undefined;
  const kit = useKit();
  const { pathname, search } = useLocation();
  const canonical = canonicalUrl(new URL(pathname + search, kit.siteUrl), kit.siteUrl);
  const s = data?.shell;
  return (
    <>
      <Seo {...meta} canonical={canonical} locale={LOCALE} themeColor="#f6f2eb" />
      <a className="skip" href="#main">Aller au contenu</a>
      {s && <Header title={s.title} city={s.city} overlay={overlay} />}
      <main id="main" tabIndex={-1}>{children}</main>
      {s && <Footer s={s} />}
      {bar && (
        <nav className="phone-bar" aria-label="Actions rapides">
          <a href="/appartements">Appartements</a>
          <a href="/contact" className="primary">Nous contacter</a>
        </nav>
      )}
    </>
  );
}
