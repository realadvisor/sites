/**
 * Privacy policy. Required on every site. Text from the kit (agency data
 * only): restyle it, never rewrite it. Other languages as in legal.tsx.
 */
import type { Route } from './+types/privacy';
import { LegalContent } from '@realadvisor/sites-kit-react/components/LegalContent';
import { notFound } from '@realadvisor/sites-kit-react/server/seo';
import { privacyPolicy } from '@realadvisor/sites-kit-core/legal';
import { LOCALES, lang, privacyPath, t } from '@realadvisor/sites-kit-core/i18n';
import { analyticsId } from '@realadvisor/sites-kit-core/env';
import { Layout } from '../components/Layout';
import { agency } from '../lib/data.server';

export async function loader({ params }: Route.LoaderArgs) {
  const locale = params.lang ? LOCALES.slice(1).find((l) => lang(l) === params.lang) : LOCALES[0];
  if (!locale) throw notFound();
  const a = await agency();
  return { locale, name: a.name, sections: privacyPolicy(a, { analytics: !!analyticsId() }, lang(locale)) };
}

export default function Page({ loaderData: { locale, name, sections } }: Route.ComponentProps) {
  const title = t('privacyPolicy', {}, lang(locale));
  const alternates = LOCALES.length > 1 ? LOCALES.map((l) => ({ lang: l, href: privacyPath(l) })) : undefined;
  return (
    <Layout title={`${title} | ${name}`} description={`${title} ${name}`} alternates={alternates}>
      <h1>{title}</h1>
      <LegalContent sections={sections} />
    </Layout>
  );
}
