// Legal notice (Aviso legal): the kit's text from the organisation's data. /legal (es), /en/legal; any other prefix: 404.
import type { Route } from './+types/legal';
import { legalNotice } from '@realadvisor/sites-kit/legal';
import { lang as kitLang, t } from '@realadvisor/sites-kit/i18n';
import { notFound } from '@realadvisor/sites-kit-react/server/seo';
import { LegalPage } from '../components/LegalPage';
import { legalAgency, loadSite } from '../lib/data.server';
import { LANGS, LOCALE_OF, type Lang } from '../lib/i18n';

export async function loader({ params }: Route.LoaderArgs) {
  const lang = params.lang === undefined ? 'es' : (LANGS.slice(1).find((l) => l === params.lang) as Lang | undefined);
  if (!lang) throw notFound();
  const site = await loadSite();
  const l = kitLang(LOCALE_OF[lang]);
  return { lang, devTitle: site.dev.title, orgName: site.org.name, title: t('legalNotice', {}, l), sections: legalNotice(legalAgency(site), l) };
}

export default function Page({ loaderData: d }: Route.ComponentProps) {
  return <LegalPage {...d} route="legal" />;
}
