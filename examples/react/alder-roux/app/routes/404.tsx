/**
 * Not-found page: the root ErrorBoundary renders it for every 404 (unknown
 * path or slug) and 410 (a listing that left the site), keeping the status,
 * in the language of the path. Also the splat route (`*`).
 */
import { useLocation, useRouteLoaderData } from 'react-router';
import { lang as klang, t as kt } from '@realadvisor/sites-kit-core/i18n';
import { notFound } from '@realadvisor/sites-kit-react/server/seo';
import { useGone } from '@realadvisor/sites-kit-react/components/Document';
import { Layout } from '../components/Layout';
import type { RootData } from '../root';
import { href, langOf, LOCALE } from '../lib/routes';
import { tx } from '../lib/copy';
import './404.css';

export function loader(): never {
  throw notFound();
}

// The 410 comes from the route error (useGone): React Router drops props given to a route's default export.
export default function NotFound() {
  const gone = useGone();
  const l = langOf(useLocation().pathname);
  const name = (useRouteLoaderData('root') as RootData | undefined)?.layout.org.name ?? '';
  const lg = klang(LOCALE[l]);
  const t = tx(l);
  const title = gone ? kt('listingGone', {}, lg) : kt('notFound', {}, lg);
  return (
    <Layout l={l} route="home" switchTo={{ fr: '/', de: '/de' }} title={`${title} | ${name}`} description={title} noindex>
      <section className="band on-navy nf">
        <div className="wrap band__inner">
          <span className="eyebrow">{t('notFoundEyebrow')}</span>
          <h1 className="h1">{title}</h1>
          <p className="lede">{gone ? kt('listingGoneText', {}, lg) : kt('notFoundText', {}, lg)}</p>
          <ul className="plain-list nf__links">
            <li><a className="button button--light" href={href('buy', l)}>{t('navBuy')}</a></li>
            <li><a className="button button--outline-light" href={href('rent', l)}>{t('navRent')}</a></li>
            <li><a className="button button--outline-light" href={href('offices', l)}>{t('navOffices')}</a></li>
            <li><a className="button button--outline-light" href={href('home', l)}>{t('home')}</a></li>
          </ul>
        </div>
      </section>
    </Layout>
  );
}

/** Anything but 404/410: a short page in the path's language (the Worker answers 500). */
export function ServerError() {
  const l = langOf(useLocation().pathname);
  const title = l === 'de' ? 'Seite vorübergehend nicht verfügbar' : 'Page momentanément indisponible';
  return (
    <Layout l={l} route="home" switchTo={{ fr: '/', de: '/de' }} title={title} description={title} noindex>
      <section className="band on-navy nf">
        <div className="wrap band__inner">
          <h1 className="h1">{title}</h1>
          <p className="lede">{l === 'de' ? 'Bitte versuchen Sie es in einigen Minuten erneut.' : 'Merci de réessayer dans quelques minutes.'}</p>
        </div>
      </section>
    </Layout>
  );
}
