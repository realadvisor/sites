/**
 * Not-found page: the root ErrorBoundary renders it for every 404 (unknown
 * path, unknown programme or unit), keeping the status. Also the splat route (`*`).
 */
import { useRouteLoaderData } from 'react-router';
import { t } from '@realadvisor/sites-kit/i18n';
import { notFound } from '@realadvisor/sites-kit-react/server/seo';
import type { RootData } from '../root';
import { Layout } from '../components/Layout';
import { PageHead } from '../components/PageHead';
import { programmeStatus, programmeUrl, PROGRAMMES_PATH } from '../lib/fr';
import './404.css';

export function loader(): never {
  throw notFound();
}

export default function NotFound() {
  const programmes = (useRouteLoaderData('root') as RootData | undefined)?.layout.programmes ?? [];
  const title = t('notFound');
  return (
    <Layout title={title} description={title} noindex>
      <PageHead title="Cette page n’existe pas ou plus">
        <p className="lead nf-lead">Le lien est peut-être ancien, ou le logement a été retiré. Nos programmes, eux, sont toujours là.</p>
      </PageHead>
      <section className="section section--tight">
        <div className="wrap">
          <ul className="nf-list">
            {programmes.map((d) => (
              <li key={d.id}><a href={programmeUrl(d)}><span className="nf-t">{d.title}</span><span className="nf-m">{d.address.city}{programmeStatus(d) && ` · ${programmeStatus(d)}`}</span></a></li>
            ))}
          </ul>
          <p className="nf-links"><a className="link" href={PROGRAMMES_PATH}>Tous nos programmes</a> <a className="link" href="/">{t('home')}</a></p>
        </div>
      </section>
    </Layout>
  );
}

export function ServerError() {
  return (
    <Layout title="Page temporairement indisponible" description="Page temporairement indisponible" noindex>
      <PageHead title="Page temporairement indisponible">
        <p className="lead nf-lead">Merci de réessayer dans quelques minutes.</p>
      </PageHead>
      <section className="section section--tight"><div className="wrap"><p className="nf-links"><a className="link" href="/">{t('home')}</a></p></div></section>
    </Layout>
  );
}
