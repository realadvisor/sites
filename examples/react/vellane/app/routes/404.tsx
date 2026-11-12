/**
 * Not-found page: the root ErrorBoundary renders it for every 404 (unknown
 * path, unknown listing, agency, agent or city) and 410 (a listing that left
 * the site: "no longer available"), keeping the status. Also the splat route.
 */
import { t } from '@realadvisor/sites-kit-core/i18n';
import { notFound } from '@realadvisor/sites-kit-react/server/seo';
import { Layout } from '../components/Layout';
import { PageHead } from '../components/PageHead';
import { R, searchUrl } from '../lib/site';
import './404.css';

export function loader(): never {
  throw notFound();
}

// Named export for the root ErrorBoundary: React Router wraps a route's default export and drops other props.
export function NotFoundPage({ gone = false }: { gone?: boolean }) {
  const title = gone ? t('listingGone', {}, 'fr') : t('notFound', {}, 'fr');
  const text = gone ? t('listingGoneText', {}, 'fr') : t('notFoundText', {}, 'fr');
  return (
    <Layout title={title} description={title} noindex>
      <PageHead title={title} lede={text}>
        <p className="nf"><a className="vb" href={searchUrl('buy')}>Voir les biens à vendre</a><a className="vb vb--ghost" href={R.home}>Accueil</a></p>
      </PageHead>
    </Layout>
  );
}

export default function NotFound() {
  return <NotFoundPage />;
}

export function ServerError() {
  const title = 'Page momentanément indisponible';
  return (
    <Layout title={title} description={title} noindex>
      <PageHead title={title} lede="Merci de réessayer dans quelques minutes.">
        <p className="nf"><a className="vb vb--ghost" href={R.home}>Accueil</a></p>
      </PageHead>
    </Layout>
  );
}
