// Legal notice (Impressum). Text from the kit (agency data only): restyled, never rewritten.
import type { Route } from './+types/legal';
import { agencyOf } from '@realadvisor/sites-kit/agency';
import { LegalContent } from '@realadvisor/sites-kit-react/components/LegalContent';
import { legalNotice } from '@realadvisor/sites-kit/legal';
import { lang, t } from '@realadvisor/sites-kit/i18n';

import { Layout } from '../components/Layout';
import { LegalPage } from '../components/LegalPage';
import { site } from '../lib/data.server';

export async function loader() {
  const s = await site();
  return { name: s.org.name, sections: legalNotice(agencyOf(s.org, s.team), lang()) };
}

export default function Page({ loaderData: { name, sections } }: Route.ComponentProps) {
  const title = t('legalNotice');
  return (
    <Layout title={`${title} | ${name}`} description={`${title} ${name}`}>
      <LegalPage title={title}><LegalContent sections={sections} /></LegalPage>
    </Layout>
  );
}
