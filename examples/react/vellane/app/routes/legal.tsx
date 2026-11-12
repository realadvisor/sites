// Legal notice. Text from the kit (organisation data only): restyled, never rewritten.
import type { Route } from './+types/legal';
import { legalNotice } from '@realadvisor/sites-kit/legal';
import { t } from '@realadvisor/sites-kit/i18n';
import { LegalPage } from '../components/LegalPage';
import { agency } from '../lib/data.server';

export async function loader() {
  const a = await agency();
  return { orgName: a.name, sections: legalNotice(a, 'fr', 'FR') };
}

export default function Page({ loaderData: { orgName, sections } }: Route.ComponentProps) {
  return <LegalPage title={t('legalNotice', {}, 'fr')} orgName={orgName} sections={sections} />;
}
