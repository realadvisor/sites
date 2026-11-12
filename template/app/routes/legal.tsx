/**
 * Legal notice (Impressum / Mentions légales / Note legali / Aviso legal).
 * Required on every site. Text from the kit (agency data only): restyle it,
 * never rewrite it. /legal is the first language of site.json `locales`,
 * /en/legal, /de/legal, ... the others; a single-language site answers 404
 * on those.
 */
import type { Route } from './+types/legal';
import { LegalContent } from '@realadvisor/sites-kit-react/components/LegalContent';
import { notFound } from '@realadvisor/sites-kit-react/server/seo';
import { legalNotice } from '@realadvisor/sites-kit-core/legal';
import { LOCALES, lang, legalPath, t } from '@realadvisor/sites-kit-core/i18n';
import { Layout } from '../components/Layout';
import { agency } from '../lib/data.server';

export async function loader({ params }: Route.LoaderArgs) {
  const locale = params.lang ? LOCALES.slice(1).find((l) => lang(l) === params.lang) : LOCALES[0];
  if (!locale) throw notFound();
  const a = await agency();
  return { locale, name: a.name, sections: legalNotice(a, lang(locale)) };
}

export default function Page({ loaderData: { locale, name, sections } }: Route.ComponentProps) {
  const title = t('legalNotice', {}, lang(locale));
  const alternates = LOCALES.length > 1 ? LOCALES.map((l) => ({ lang: l, href: legalPath(l) })) : undefined;
  return (
    <Layout title={`${title} | ${name}`} description={`${title} ${name}`} alternates={alternates}>
      <h1>{title}</h1>
      <LegalContent sections={sections} />
    </Layout>
  );
}
