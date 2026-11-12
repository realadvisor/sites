/**
 * Not-found page: the root ErrorBoundary renders it for every 404 (unknown
 * path, unknown unit) and 410, keeping the status. Also the splat route (`*`).
 */
import { useRouteLoaderData } from 'react-router';
import { t } from '@realadvisor/sites-kit/i18n';
import { notFound } from '@realadvisor/sites-kit-react/server/seo';
import { useGone } from '@realadvisor/sites-kit-react/components/Document';
import type { RootData } from '../root';
import { Layout } from '../components/Layout';
import { Icon } from '../components/Icon';
import './404.css';

export function loader(): never {
  throw notFound();
}

// The 410 comes from the route error (useGone): React Router drops props given to a route's default export.
export default function NotFound() {
  const gone = useGone();
  const data = useRouteLoaderData('root') as RootData | undefined;
  const title = gone ? t('listingGone', {}, 'de') : 'Seite nicht gefunden';
  return (
    <Layout page="404" title={`${title} | ${data?.layout.devTitle ?? ''}`} description={title} noindex>
      <section className="nf">
        <div className="wrap nf-in">
          <p className="code num" aria-hidden="true">404</p>
          <div className="txt">
            <h1>{title}</h1>
            <p className="lead">{gone ? t('listingGoneText', {}, 'de') : 'Diese Adresse gibt es nicht oder nicht mehr. Die freien Wohnungen finden Sie im Stockwerkplan.'}</p>
            <div className="acts">
              <a className="cta" href="/wohnungen">Freie Wohnungen <Icon name="arrow" /></a>
              <a className="cta cta--ghost" href="/">Zur Startseite</a>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}

export function ServerError() {
  return (
    <Layout page="404" title="Seite vorübergehend nicht verfügbar" description="Seite vorübergehend nicht verfügbar" noindex>
      <section className="nf">
        <div className="wrap nf-in">
          <div className="txt">
            <h1>Seite vorübergehend nicht verfügbar</h1>
            <p className="lead">Bitte versuchen Sie es in einigen Minuten erneut.</p>
            <div className="acts"><a className="cta cta--ghost" href="/">Zur Startseite</a></div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
