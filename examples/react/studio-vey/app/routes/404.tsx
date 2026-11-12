/**
 * Not-found page: the root ErrorBoundary renders it for every 404 (unknown
 * path, unknown listing) and 410 (a listing that left the site), keeping the
 * status. Also the splat route (`*`).
 */
import { isRouteErrorResponse, useRouteError } from 'react-router';
import { t } from '@realadvisor/sites-kit/i18n';
import { notFound } from '@realadvisor/sites-kit-react/server/seo';
import { Layout } from '../components/Layout';
import './404.css';

export function loader(): never {
  throw notFound();
}

// React Router wraps a route's default export and drops extra props, so the
// ErrorBoundary's `gone` never arrives: read the 410 from the route error.
export default function NotFound(props: { gone?: boolean }) {
  const err = useRouteError();
  const gone = props.gone === true || (isRouteErrorResponse(err) && err.status === 410);
  const title = gone ? t('listingGone') : t('notFound');
  return (
    <Layout title={title} description={title} noindex>
      <section className="nf wrap">
        <p className="eyebrow">{gone ? 'Nicht mehr verfügbar' : 'Fehler 404'}</p>
        <h1 className="h1">{title}</h1>
        <p className="lede muted">{gone ? t('listingGoneText') : t('notFoundText')}</p>
        <ul className="nf-links">
          <li><a className="button button--solid" href="/kaufen">Objekte zum Kauf</a></li>
          <li><a className="button" href="/mieten">Objekte zur Miete</a></li>
          <li><a className="more" href="/">{t('home')}</a></li>
        </ul>
      </section>
    </Layout>
  );
}

export function ServerError() {
  return (
    <Layout title="Seite vorübergehend nicht verfügbar" description="Seite vorübergehend nicht verfügbar" noindex>
      <section className="nf wrap">
        <h1 className="h1">Seite vorübergehend nicht verfügbar</h1>
        <p className="lede muted">Bitte versuchen Sie es in einigen Minuten erneut.</p>
        <ul className="nf-links"><li><a className="more" href="/">{t('home')}</a></li></ul>
      </section>
    </Layout>
  );
}
