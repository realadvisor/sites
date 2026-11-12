// Legal notice: the kit's text from the organisation's data, never our own words.
import type { Route } from './+types/legal';
import { legalNotice } from '@realadvisor/sites-kit/legal';
import { t } from '@realadvisor/sites-kit/i18n';
import { LegalPage } from '../components/LegalPage';
import { legalAgency, loadSite } from '../lib/data.server';

export async function loader() {
  const s = await loadSite();
  return { devTitle: s.dev.title, orgName: s.org.name, sections: legalNotice(legalAgency(s)) };
}

export default function Page({ loaderData: d }: Route.ComponentProps) {
  return <LegalPage devTitle={d.devTitle} orgName={d.orgName} title={t('legalNotice')} sections={d.sections} />;
}
