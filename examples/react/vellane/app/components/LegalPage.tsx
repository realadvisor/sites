/** Legal notice and privacy policy: the kit's text from the organisation data, in the site frame. Never edited here. */
import type { LegalSection } from '@realadvisor/sites-kit/legal';
import { LegalContent } from '@realadvisor/sites-kit-react/components/LegalContent';
import { Layout } from './Layout';
import './LegalPage.css';

export function LegalPage({ title, orgName, sections }: { title: string; orgName: string; sections: LegalSection[] }) {
  return (
    <Layout title={`${title} | ${orgName}`} description={`${title} de ${orgName}.`}>
      <div className="wrap lgp">
        <h1 className="h2">{title}</h1>
        <LegalContent sections={sections} />
      </div>
    </Layout>
  );
}
