/**
 * Not-found page: the root ErrorBoundary renders it for every 404 (unknown
 * path, unknown listing) and 410 (a listing that left the site), keeping the
 * status. Also the splat route (`*`). Language from the path.
 */
import { isRouteErrorResponse, useLocation, useRouteError } from 'react-router';
import { t } from '@realadvisor/sites-kit-core/i18n';
import { notFound } from '@realadvisor/sites-kit-react/server/seo';
import { Site } from '../components/Site';
import { UI, href, langOfPath } from '../lib/i18n';
import './404.css';

export function loader(): never {
  throw notFound();
}

// 410 read from the route error here: React Router wraps a route's default export, so a `gone` prop from the ErrorBoundary is dropped.
export default function NotFound(props: { gone?: boolean }) {
  const err = useRouteError();
  const gone = props.gone === true || (isRouteErrorResponse(err) && err.status === 410);
  const lang = langOfPath(useLocation().pathname);
  const ui = UI[lang];
  const title = gone ? t('listingGone', {}, lang) : t('notFound', {}, lang);
  return (
    <Site lang={lang} title={title} description={title} noindex>
      <section className="wrap nf">
        <p className="nf-code" aria-hidden="true">{gone ? '410' : '404'}</p>
        <h1 className="display-l">{title}</h1>
        <p className="lead">{gone ? t('listingGoneText', {}, lang) : t('notFoundText', {}, lang)}</p>
        <p className="nf-links">
          <a className="cta cta-accent" href={href('buy', lang)}>{ui.allSale}</a>
          <a className="cta cta-line" href={href('home', lang)}>{ui.backHome}</a>
        </p>
      </section>
    </Site>
  );
}

export function ServerError() {
  const lang = langOfPath(useLocation().pathname);
  const title = lang === 'en' ? 'Page temporarily unavailable' : 'Página no disponible temporalmente';
  return (
    <Site lang={lang} title={title} description={title} noindex>
      <section className="wrap nf">
        <h1 className="display-l">{title}</h1>
        <p className="nf-links"><a className="cta cta-line" href={href('home', lang)}>{UI[lang].backHome}</a></p>
      </section>
    </Site>
  );
}
