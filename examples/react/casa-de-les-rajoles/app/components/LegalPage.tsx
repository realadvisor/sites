/** Shell of the legal pages: the kit's text (LegalContent), our layout. Never edit the words. */
import type { LegalSection } from '@realadvisor/sites-kit-core/legal';
import { LegalContent } from '@realadvisor/sites-kit-react/components/LegalContent';
import { alternates, type Lang } from '../lib/i18n';
import { Layout } from './Layout';
import './LegalPage.css';

type Props = { lang: Lang; devTitle: string; orgName: string; title: string; sections: LegalSection[]; route: 'legal' | 'privacy' };

export function LegalPage({ lang, devTitle, orgName, title, sections, route }: Props) {
  return (
    <Layout lang={lang} route={route} title={`${title} | ${devTitle}`} description={`${title}: ${orgName}, ${devTitle}.`} alternates={alternates(route)} langLinks={alternates('home')} page="pg-legal">
      <div className="wrap page">
        <h1>{title}</h1>
        <LegalContent sections={sections} className="legal-body" />
      </div>
    </Layout>
  );
}
