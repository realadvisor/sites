// Privacy policy: the kit's text from the organisation's data.
import type { Route } from './+types/privacy';
import { privacyPolicy } from '@realadvisor/sites-kit-core/legal';
import { t } from '@realadvisor/sites-kit-core/i18n';
import { analyticsId } from '@realadvisor/sites-kit-core/env';
import { LegalPage } from '../components/LegalPage';
import { legalAgency, loadSite } from '../lib/data.server';

export async function loader() {
  const s = await loadSite();
  return { devTitle: s.dev.title, orgName: s.org.name, sections: privacyPolicy(legalAgency(s), { analytics: !!analyticsId() }) };
}

export default function Page({ loaderData: d }: Route.ComponentProps) {
  return <LegalPage devTitle={d.devTitle} orgName={d.orgName} title={t('privacyPolicy')} sections={d.sections} />;
}
