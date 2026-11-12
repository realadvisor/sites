/**
 * Site shell (the Astro version's Site.astro + Base.astro SEO head): skip
 * link, header, main, footer and the phone tab bar. Every page renders its
 * content inside it. Header and footer data come from the root loader.
 */
import type { ReactNode } from 'react';
import { useLocation, useRouteLoaderData } from 'react-router';
import { Seo, useKit } from '@realadvisor/sites-kit-react/components/Document';
import { canonicalUrl } from '@realadvisor/sites-kit/seo';
import { LOCALE_OF, tr, type Lang, type Route } from '../lib/i18n';
import type { RootData } from '../root';
import { Header } from './Header';
import { Footer } from './Footer';
import { TabBar } from './TabBar';
import './Layout.css';

export type PageMeta = {
  lang: Lang;
  /** The page's route, for the current nav item. */
  route?: Route;
  title: string;
  description: string;
  /** Absolute URL, ~1200x630: the page's main photo. */
  image?: string;
  jsonLd?: object | object[];
  noindex?: boolean;
  /** Every language version of this page. */
  alternates: { lang: string; href: string }[];
  /** Targets of the language switch, when they differ from `alternates` (legal pages: the other language's home, check:deploy rule). */
  langLinks?: { lang: string; href: string }[];
  /** Class on <main> that scopes the page's styles (the Astro version's scoped <style>). */
  page?: string;
};

export function Layout({ children, lang, route, title, description, image, jsonLd, noindex, alternates, langLinks = alternates, page }: PageMeta & { children: ReactNode }) {
  const data = useRouteLoaderData('root') as RootData | undefined;
  const kit = useKit();
  const { pathname, search } = useLocation();
  const canonical = canonicalUrl(new URL(pathname + search, kit.siteUrl), kit.siteUrl);
  const t = tr(lang);
  const s = data?.layout;
  return (
    <>
      <Seo title={title} description={description} image={image} jsonLd={jsonLd} noindex={noindex} alternates={alternates} canonical={canonical} locale={LOCALE_OF[lang]} themeColor="#f7f2e9" />
      <a className="skip" href="#main">{t.skip}</a>
      {s && <Header title={s.dev.title} lang={lang} route={route} alternates={langLinks} />}
      <main id="main" tabIndex={-1} className={page}>{children}</main>
      {s && <Footer site={s} lang={lang} alternates={langLinks} />}
      <TabBar lang={lang} route={route} />
    </>
  );
}
