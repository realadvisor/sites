/**
 * Not-found page: the root ErrorBoundary renders it for every 404 (unknown
 * path, listing, agent, district, post) and 410 (a listing that left the
 * site: "no longer available"), keeping the status. Also the splat route.
 */
import { useLocation } from 'react-router';
import { t } from '@realadvisor/sites-kit/i18n';
import { notFound } from '@realadvisor/sites-kit-react/server/seo';
import { useGone } from '@realadvisor/sites-kit-react/components/Document';
import { Site } from '../components/Site';
import { UI, href, langOfPath } from '../lib/i18n';
import './404.css';

export function loader(): never {
  throw notFound();
}

// The 410 comes from the route error (useGone): React Router drops props given to a route's default export.
export default function NotFound() {
  const gone = useGone();
  const lang = langOfPath(useLocation().pathname);
  const ui = UI[lang];
  const title = gone ? t('listingGone', {}, lang) : t('notFound', {}, lang);
  return (
    <Site lang={lang} title={title} description={title} noindex>
      <section className="wrap phead nf">
        <h1 className="d-xl">{title}</h1>
        <p className="lead">{gone ? t('listingGoneText', {}, lang) : t('notFoundText', {}, lang)}</p>
        <p className="nf-links">
          <a className="cta cta-solid" href={href('buy', lang)}>{ui.allSale}</a>
          <a className="cta" href={href('home', lang)}>{ui.backHome}</a>
        </p>
      </section>
    </Site>
  );
}

/** Anything but a 404/410: a short page, never a cut 200. */
export function ServerError() {
  const lang = langOfPath(useLocation().pathname);
  const title = lang === 'en' ? 'Page temporarily unavailable' : 'Pagina momentaneamente non disponibile';
  return (
    <Site lang={lang} title={title} description={title} noindex>
      <section className="wrap phead nf">
        <h1 className="d-xl">{title}</h1>
        <p className="nf-links"><a className="cta" href={href('home', lang)}>{UI[lang].backHome}</a></p>
      </section>
    </Site>
  );
}
