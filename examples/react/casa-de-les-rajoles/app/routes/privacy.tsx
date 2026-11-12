// Privacy policy (Política de privacidad): the kit's text from the organisation's data. /privacy (es), /en/privacy; any other prefix: 404.
import type { Route } from './+types/privacy';
import { privacyPolicy } from '@realadvisor/sites-kit/legal';
import { lang as kitLang, t } from '@realadvisor/sites-kit/i18n';
import { analyticsId } from '@realadvisor/sites-kit/env';
import { notFound } from '@realadvisor/sites-kit-react/server/seo';
import { LegalPage } from '../components/LegalPage';
import { legalAgency, loadSite } from '../lib/data.server';
import { LANGS, LOCALE_OF, type Lang } from '../lib/i18n';

export async function loader({ params }: Route.LoaderArgs) {
  const lang = params.lang === undefined ? 'es' : (LANGS.slice(1).find((l) => l === params.lang) as Lang | undefined);
  if (!lang) throw notFound();
  const site = await loadSite();
  const l = kitLang(LOCALE_OF[lang]);
  return { lang, devTitle: site.dev.title, orgName: site.org.name, title: t('privacyPolicy', {}, l), sections: privacyPolicy(legalAgency(site), { analytics: !!analyticsId() }, l) };
}

export default function Page({ loaderData: d }: Route.ComponentProps) {
  return <LegalPage {...d} route="privacy" />;
}
