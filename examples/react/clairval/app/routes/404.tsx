/**
 * Not-found page: the root ErrorBoundary renders it for every 404 (unknown
 * path, unknown slug) and 410 (a listing that left the portal shows "no
 * longer available"), keeping the status. Also the splat route (`*`).
 * Language from the path.
 */
import { isRouteErrorResponse, useLocation, useRouteError, useRouteLoaderData } from 'react-router';
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

const HOMES = { en: '/', fr: '/fr' } as const;

// React Router wraps a route's default export and drops extra props, so the
// 410 is read from the route error.
export default function NotFound() {
  const err = useRouteError();
  const gone = isRouteErrorResponse(err) && err.status === 410;
  const l = langOfPath(useLocation().pathname);
  const lg = klang(LOCALE[l]);
  const t = tx(l);
  const title = gone ? kt('listingGone', {}, lg) : kt('notFound', {}, lg);
  const name = (useRouteLoaderData('root') as RootData | undefined)?.layout.org.name ?? '';
  return (
    <Site l={l} route="home" switchTo={HOMES} title={`${title} | ${name}`} description={title} noindex>
      <section className="nf wrap">
        <h1 className="h1">{title}</h1>
        <p className="lede">{gone ? kt('listingGoneText', {}, lg) : kt('notFoundText', {}, lg)}</p>
        <ul className="plain nf__links">
          <li><a className="cta" href={href('buy', l)}>{t('navBuy')}</a></li>
          <li><a className="cta cta--ghost" href={href('rent', l)}>{t('navRent')}</a></li>
          <li><a className="cta cta--ghost" href={href('home', l)}>{t('home')}</a></li>
        </ul>
      </section>
    </Site>
  );
}

/** Anything else than a 404 or 410: a short page in the frame, no data needed. */
export function ServerError() {
  const l = langOfPath(useLocation().pathname);
  const title = { en: 'Page temporarily unavailable', fr: 'Page temporairement indisponible' }[l];
  const t = tx(l);
  return (
    <Site l={l} route="home" switchTo={HOMES} title={title} description={title} noindex>
      <section className="nf wrap">
        <h1 className="h1">{title}</h1>
        <ul className="plain nf__links">
          <li><a className="cta" href={href('home', l)}>{t('home')}</a></li>
        </ul>
      </section>
    </Site>
  );
}
