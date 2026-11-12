// Privacy policy (Datenschutz): the kit's text from the organisation's data, restyled, never rewritten.
import type { Route } from './+types/privacy';
import { LegalContent } from '@realadvisor/sites-kit-react/components/LegalContent';
import { privacyPolicy } from '@realadvisor/sites-kit-core/legal';
import { analyticsId } from '@realadvisor/sites-kit-core/env';
import { t } from '@realadvisor/sites-kit-core/i18n';
import { Layout } from '../components/Layout';
import { PageHead } from '../components/PageHead';
import { legalAgency, site as load } from '../lib/data.server';
import './legal.css';

export async function loader() {
  const site = await load();
  const title = t('privacyPolicy', {}, 'de');
  return { title, devTitle: site.dev.title, orgName: site.org.name, sections: privacyPolicy(legalAgency(site), { analytics: !!analyticsId() }, 'de') };
}

export default function Page({ loaderData: { title, devTitle, orgName, sections } }: Route.ComponentProps) {
  return (
    <Layout page="legal" title={`${title} | ${devTitle}`} description={`${title}: ${orgName}`}>
      <PageHead title={title} tone="sand" />
      <div className="wrap legal-wrap"><LegalContent sections={sections} className="legal-body" /></div>
    </Layout>
  );
}
