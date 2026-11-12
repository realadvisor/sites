// Privacy policy. Text from the kit (agency data only): restyled, never rewritten.
import type { Route } from './+types/privacy';
import { agencyOf } from '@realadvisor/sites-kit-core/agency';
import { LegalContent } from '@realadvisor/sites-kit-react/components/LegalContent';
import { privacyPolicy } from '@realadvisor/sites-kit-core/legal';
import { lang, t } from '@realadvisor/sites-kit-core/i18n';
import { analyticsId } from '@realadvisor/sites-kit-core/env';
import { Layout } from '../components/Layout';
import { LegalPage } from '../components/LegalPage';
import { site } from '../lib/data.server';

export async function loader() {
  const s = await site();
  return { name: s.org.name, sections: privacyPolicy(agencyOf(s.org, s.team), { analytics: !!analyticsId() }, lang()) };
}

export default function Page({ loaderData: { name, sections } }: Route.ComponentProps) {
  const title = t('privacyPolicy');
  return (
    <Layout title={`${title} | ${name}`} description={`${title} ${name}`}>
      <LegalPage title={title}><LegalContent sections={sections} /></LegalPage>
    </Layout>
  );
}
