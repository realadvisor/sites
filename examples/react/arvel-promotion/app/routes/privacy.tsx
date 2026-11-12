// Privacy policy: text from the kit's legal builder and the organisation's data only.
import type { Route } from './+types/privacy';
import { LegalContent } from '@realadvisor/sites-kit-react/components/LegalContent';
import { privacyPolicy } from '@realadvisor/sites-kit-core/legal';
import { analyticsId } from '@realadvisor/sites-kit-core/env';
import { t } from '@realadvisor/sites-kit-core/i18n';
import { Layout } from '../components/Layout';
import { PageHead } from '../components/PageHead';
import { legalIdentity } from '../lib/data.server';

export async function loader() {
  const agency = await legalIdentity();
  return { name: agency.name, sections: privacyPolicy(agency, { analytics: !!analyticsId() }) };
}

export default function Page({ loaderData: { name, sections } }: Route.ComponentProps) {
  const title = t('privacyPolicy');
  return (
    <Layout title={`${title} | ${name}`} description={`${title} du site de ${name}.`}>
      <PageHead title={title} />
      <section className="section section--tight"><div className="wrap"><LegalContent sections={sections} className="legal-body" /></div></section>
    </Layout>
  );
}
