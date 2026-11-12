// Legal notice: text from the kit's legal builder and the organisation's data only.
import type { Route } from './+types/legal';
import { LegalContent } from '@realadvisor/sites-kit-react/components/LegalContent';
import { legalNotice } from '@realadvisor/sites-kit-core/legal';
import { t } from '@realadvisor/sites-kit-core/i18n';
import { Layout } from '../components/Layout';
import { PageHead } from '../components/PageHead';
import { legalIdentity } from '../lib/data.server';
import './legal.css';

export async function loader() {
  const agency = await legalIdentity();
  return { name: agency.name, sections: legalNotice(agency) };
}

export default function Page({ loaderData: { name, sections } }: Route.ComponentProps) {
  const title = t('legalNotice');
  return (
    <Layout title={`${title} | ${name}`} description={`${title} du site de ${name}.`}>
      <PageHead title={title} />
      <section className="section section--tight"><div className="wrap"><LegalContent sections={sections} className="legal-body" /></div></section>
    </Layout>
  );
}
