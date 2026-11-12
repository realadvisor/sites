/**
 * Not-found page, rendered by the root ErrorBoundary for every 404 (and 410:
 * a listing that left the portal shows "no longer available"), keeping the
 * status. Also the splat route (`*`). Language from the path.
 */
import { useLocation, useRouteLoaderData } from 'react-router';
import { lang as klang, t as kt } from '@realadvisor/sites-kit-core/i18n';
import { notFound } from '@realadvisor/sites-kit-react/server/seo';
import { Site } from '../components/Site';
import { href, langOfPath, LOCALE } from '../lib/routes';
import { tx } from '../lib/copy';
import type { RootData } from '../root';
import './404.css';

export function loader(): never {
  throw notFound();
}

const HOMES = { de: '/', fr: '/fr', en: '/en' } as const;

/** The page itself (named: React Router wraps a route module's default export and drops its props). */
export function NotFoundPage({ gone = false }: { gone?: boolean }) {
  const l = langOfPath(useLocation().pathname);
  const lg = klang(LOCALE[l]);
  const t = tx(l);
  const title = gone ? kt('listingGone', {}, lg) : kt('notFound', {}, lg);
  const name = (useRouteLoaderData('root') as RootData | undefined)?.layout.org.name ?? '';
  return (
    <Site l={l} route="home" switchTo={HOMES} title={`${title} | ${name}`} description={title} noindex>
      <section className="band on-green nf">
        <div className="wrap band__inner">
          <p className="kicker">{t('notFoundCode')}</p>
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
    </Site>
  );
}

export default function NotFound() {
  return <NotFoundPage />;
}

/** Anything else than a 404 or 410: a short page in the frame, no data needed. */
export function ServerError() {
  const l = langOfPath(useLocation().pathname);
  const title = { de: 'Seite vorübergehend nicht verfügbar', fr: 'Page temporairement indisponible', en: 'Page temporarily unavailable' }[l];
  const t = tx(l);
  return (
    <Site l={l} route="home" switchTo={HOMES} title={title} description={title} noindex>
      <section className="band on-green nf">
        <div className="wrap band__inner">
          <h1 className="h1">{title}</h1>
          <ul className="plain-list nf__links">
            <li><a className="button button--light" href={href('home', l)}>{t('home')}</a></li>
          </ul>
        </div>
      </section>
    </Site>
  );
}
