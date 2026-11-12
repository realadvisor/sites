// Privacy policy. Text from the kit (organisation data only): restyled, never rewritten.
import type { Route } from './+types/privacy';
import { privacyPolicy } from '@realadvisor/sites-kit/legal';
import { t } from '@realadvisor/sites-kit/i18n';
import { analyticsId } from '@realadvisor/sites-kit/env';
import { LegalPage } from '../components/LegalPage';
import { agency } from '../lib/data.server';

export async function loader() {
  const a = await agency();
  return { orgName: a.name, sections: privacyPolicy(a, { analytics: !!analyticsId() }, 'fr', 'FR') };
}

export default function Page({ loaderData: { orgName, sections } }: Route.ComponentProps) {
  return <LegalPage title={t('privacyPolicy', {}, 'fr')} orgName={orgName} sections={sections} />;
}
