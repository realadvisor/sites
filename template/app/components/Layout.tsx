/**
 * Site layout: the SEO head of every page, then the page. Wiring only:
 * build the header, footer and visual system yourself (DESIGN.md). Every
 * page renders its content inside it.
 */
import type { ReactNode } from 'react';
import { useLocation, useRouteLoaderData } from 'react-router';
import { Seo, useKit, usePageLocale } from '@realadvisor/sites-kit-react/components/Document';
import { canonicalUrl } from '@realadvisor/sites-kit-core/seo';
import { lang, legalPath, privacyPath, t } from '@realadvisor/sites-kit-core/i18n';
import type { RootData } from '../root';

export type PageMeta = {
  title: string;
  description: string;
  /** Absolute URL, ~1200x630: the page's main photo. Default: the agency logo, else the latest listing's photo. */
  image?: string;
  jsonLd?: object | object[];
  noindex?: boolean;
  /**
   * Multi-language sites only: every language version of this page, including
   * this one, e.g. [{ lang: 'fr-CH', href: '/fr/biens' }, { lang: 'de-CH', href: '/de/objekte' }].
   */
  alternates?: { lang: string; href: string }[];
};

export function Layout({ children, ...meta }: PageMeta & { children: ReactNode }) {
  const data = useRouteLoaderData('root') as RootData | undefined;
  const kit = useKit();
  const locale = usePageLocale();
  const { pathname, search } = useLocation();
  const canonical = canonicalUrl(new URL(pathname + search, kit.siteUrl), kit.siteUrl);
  const l = lang(locale);
  return (
    <>
      <Seo {...meta} image={meta.image || data?.ogImage} canonical={canonical} locale={locale} />
      <main id="main">{children}</main>
      <footer>
        {/* On every language: legalPath(locale) / privacyPath(locale) and t(key, {}, lang(locale)). */}
        <a href={legalPath(locale)}>{t('legalNotice', {}, l)}</a> · <a href={privacyPath(locale)}>{t('privacyPolicy', {}, l)}</a>
      </footer>
    </>
  );
}
