/** Shell of the legal pages: the kit's text (LegalContent), our layout. */
import { LegalContent } from '@realadvisor/sites-kit-react/components/LegalContent';
import type { LegalSection } from '@realadvisor/sites-kit-core/legal';
import { Layout } from './Layout';
import './LegalPage.css';

export function LegalPage({ devTitle, orgName, title, sections }: { devTitle: string; orgName: string; title: string; sections: LegalSection[] }) {
  return (
    <Layout title={`${title} | ${devTitle}`} description={`${title} – ${orgName}, ${devTitle}.`}>
      <div className="wrap page legal-page">
        <h1>{title}</h1>
        <LegalContent sections={sections} className="legal-body" />
      </div>
    </Layout>
  );
}
