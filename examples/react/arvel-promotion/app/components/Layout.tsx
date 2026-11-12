/**
 * Site layout (the Astro version's Base.astro + Site.astro): SEO head, skip
 * link, header, main (hero, then the programme bar on programme pages),
 * footer. Every page renders its content inside it; header and footer data
 * come from the root loader.
 */
import type { ReactNode } from 'react';
import { useLocation, useRouteLoaderData } from 'react-router';
import { Seo, useKit } from '@realadvisor/sites-kit-react/components/Document';
import { canonicalUrl } from '@realadvisor/sites-kit/seo';
import { LOCALE } from '@realadvisor/sites-kit/format';
import type { RootData } from '../root';
import { Header } from './Header';
import { Footer } from './Footer';
import { ProgrammeNav, type NavProgramme } from './ProgrammeNav';
import './Layout.css';

export type PageMeta = {
  title: string;
  description: string;
  /** Absolute URL, ~1200x630: the page's main photo. */
  image?: string;
  jsonLd?: object | object[];
  noindex?: boolean;
};

type Props = PageMeta & {
  current?: string;
  /** Programme pages: the sub navigation for this programme. */
  programme?: NavProgramme;
  section?: string;
  hero?: ReactNode;
  children?: ReactNode;
};

export function Layout({ children, hero, current, programme, section, ...meta }: Props) {
  const data = useRouteLoaderData('root') as RootData | undefined;
  const kit = useKit();
  const { pathname, search } = useLocation();
  const canonical = canonicalUrl(new URL(pathname + search, kit.siteUrl), kit.siteUrl);
  const s = data?.layout;
  return (
    <>
      <Seo {...meta} image={meta.image || s?.ogImage} canonical={canonical} locale={LOCALE} themeColor="#0E1A24" />
      <a className="skip" href="#main">Aller au contenu</a>
      <Header name={s?.name ?? ''} programmes={s?.programmes ?? []} current={current} />
      <main id="main" tabIndex={-1} className={hero ? undefined : 'no-hero'}>
        {hero}
        {programme && <ProgrammeNav programme={programme} section={section} />}
        {children}
      </main>
      {s && <Footer name={s.name} legalName={s.legalName} team={s.team} programmes={s.programmes} />}
    </>
  );
}
